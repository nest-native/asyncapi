import { INestApplicationContext, Type } from '@nestjs/common';
import { MetadataScanner, ModulesContainer } from '@nestjs/core';
import {
  ASYNC_API_CHANNEL_METADATA,
  ASYNC_API_OPERATION_METADATA,
} from './constants';
import {
  AsyncApiChannelMetadata,
  AsyncApiOperationMetadata,
} from './decorators';
import {
  ASYNC_API_VERSION,
  AsyncApiChannelObject,
  AsyncApiDocument,
  AsyncApiInfo,
  AsyncApiOperationObject,
} from './document';
import { AsyncApiDocumentConfig } from './interfaces';
import { AsyncApiDocumentScanner, ScannedHandler } from './scanner';

/**
 * The default title used when a document config omits one.
 */
export const DEFAULT_DOCUMENT_TITLE = 'AsyncAPI';

/**
 * The default document version used when a document config omits one. This is
 * the API/document version, not the AsyncAPI spec version.
 */
export const DEFAULT_DOCUMENT_VERSION = '1.0.0';

/**
 * Build the `info` object of the document from the supplied config, applying
 * the documented defaults for `title` and `version` and copying through only
 * the optional fields that were provided.
 */
function buildInfo(config: AsyncApiDocumentConfig): AsyncApiInfo {
  const info: AsyncApiInfo = {
    title: config.title ?? DEFAULT_DOCUMENT_TITLE,
    version: config.version ?? DEFAULT_DOCUMENT_VERSION,
  };

  if (config.description !== undefined) {
    info.description = config.description;
  }
  if (config.termsOfService !== undefined) {
    info.termsOfService = config.termsOfService;
  }
  if (config.contact !== undefined) {
    info.contact = config.contact;
  }
  if (config.license !== undefined) {
    info.license = config.license;
  }

  return info;
}

/**
 * Read the {@link AsyncApiChannelMetadata} a {@link AsyncApiChannel} decorator
 * left on a handler class, or `undefined` when the class is not a channel.
 */
function readChannelMetadata(
  metatype: Type,
): AsyncApiChannelMetadata | undefined {
  return Reflect.getMetadata(ASYNC_API_CHANNEL_METADATA, metatype) as
    | AsyncApiChannelMetadata
    | undefined;
}

/**
 * Read the {@link AsyncApiOperationMetadata} a {@link AsyncApiPub} /
 * {@link AsyncApiSub} decorator left on a prototype method, or `undefined` when
 * the method is not an operation.
 */
function readOperationMetadata(
  prototype: object,
  methodName: string,
): AsyncApiOperationMetadata | undefined {
  const method = (prototype as Record<string, unknown>)[methodName];

  if (typeof method !== 'function') {
    return undefined;
  }

  return Reflect.getMetadata(ASYNC_API_OPERATION_METADATA, method) as
    | AsyncApiOperationMetadata
    | undefined;
}

/**
 * Build a Channel Object from its metadata, defaulting the address to the
 * channel id and copying through only the optional fields that were provided.
 */
function buildChannel(
  metadata: AsyncApiChannelMetadata,
): AsyncApiChannelObject {
  const channel: AsyncApiChannelObject = {
    address: metadata.address === undefined ? metadata.id : metadata.address,
  };

  if (metadata.title !== undefined) {
    channel.title = metadata.title;
  }
  if (metadata.summary !== undefined) {
    channel.summary = metadata.summary;
  }
  if (metadata.description !== undefined) {
    channel.description = metadata.description;
  }

  return channel;
}

/**
 * Build an Operation Object from its metadata, referencing the supplied channel
 * id and copying through only the optional fields that were provided.
 */
function buildOperation(
  metadata: AsyncApiOperationMetadata,
  channelId: string,
): AsyncApiOperationObject {
  const operation: AsyncApiOperationObject = {
    action: metadata.action,
    channel: { $ref: `#/channels/${channelId}` },
  };

  if (metadata.title !== undefined) {
    operation.title = metadata.title;
  }
  if (metadata.summary !== undefined) {
    operation.summary = metadata.summary;
  }
  if (metadata.description !== undefined) {
    operation.description = metadata.description;
  }

  return operation;
}

/**
 * The mutable document body that {@link collectHandler} appends channels and
 * operations to as it visits each decorated handler.
 */
interface DocumentBody {
  channels: Record<string, AsyncApiChannelObject>;
  operations: Record<string, AsyncApiOperationObject>;
}

/**
 * Read every operation off one channel handler and register it on the body,
 * raising on a duplicate operation id so collisions surface as build failures
 * rather than silently dropped operations.
 */
function collectOperations(
  body: DocumentBody,
  handler: ScannedHandler,
  channelId: string,
): void {
  const prototype = handler.metatype.prototype as object;

  for (const methodName of handler.methodNames) {
    const operationMeta = readOperationMetadata(prototype, methodName);
    if (operationMeta === undefined) {
      continue;
    }

    const operationId = operationMeta.operationId ?? methodName;
    if (operationId in body.operations) {
      throw new Error(
        `Duplicate AsyncAPI operation id "${operationId}" produced by ${handler.metatype.name}.${methodName}.`,
      );
    }

    body.operations[operationId] = buildOperation(operationMeta, channelId);
  }
}

/**
 * Register one scanned handler's channel and operations on the body. Handlers
 * without an {@link AsyncApiChannel} decorator are skipped, and a duplicate
 * channel id is treated as a build failure.
 */
function collectHandler(body: DocumentBody, handler: ScannedHandler): void {
  const channelMeta = readChannelMetadata(handler.metatype);
  if (channelMeta === undefined) {
    return;
  }

  if (channelMeta.id in body.channels) {
    throw new Error(
      `Duplicate AsyncAPI channel id "${channelMeta.id}" produced by ${handler.metatype.name}.`,
    );
  }

  body.channels[channelMeta.id] = buildChannel(channelMeta);
  collectOperations(body, handler, channelMeta.id);
}

/**
 * Assemble an AsyncAPI 3.0 document from a document config and the handlers
 * discovered while walking NestJS metadata.
 *
 * Each handler decorated with {@link AsyncApiChannel} contributes one channel,
 * and each of its {@link AsyncApiPub} / {@link AsyncApiSub} methods contributes
 * one operation that references that channel. Handlers without AsyncAPI
 * decorators contribute nothing, so a fully undecorated application still emits
 * a valid (empty) AsyncAPI 3.0 document.
 */
export function buildAsyncApiDocument(
  config: AsyncApiDocumentConfig,
  handlers: ScannedHandler[],
): AsyncApiDocument {
  const body: DocumentBody = { channels: {}, operations: {} };

  for (const handler of handlers) {
    collectHandler(body, handler);
  }

  return {
    asyncapi: ASYNC_API_VERSION,
    info: buildInfo(config),
    channels: body.channels,
    operations: body.operations,
    components: {},
  };
}

/**
 * Generate an AsyncAPI 3.0 document for a running NestJS application.
 *
 * This is the AsyncAPI counterpart to `SwaggerModule.createDocument`: it walks
 * the application's NestJS metadata exactly as `@nestjs/swagger` walks
 * controllers, then assembles a spec-compliant AsyncAPI 3.0 document. The
 * resolved application's `ModulesContainer` and a {@link MetadataScanner} drive
 * the walk; no extra module import is required in the consuming application.
 *
 * @param app   A NestJS application or application context.
 * @param config Document-level metadata (title, version, contact, …).
 */
export function getAsyncApiDocument(
  app: INestApplicationContext,
  config: AsyncApiDocumentConfig = {},
): AsyncApiDocument {
  const modulesContainer = app.get(ModulesContainer, { strict: false });
  const scanner = new AsyncApiDocumentScanner(
    modulesContainer,
    new MetadataScanner(),
  );

  return buildAsyncApiDocument(config, scanner.scan());
}
