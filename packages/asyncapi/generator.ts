import { INestApplicationContext, Type } from '@nestjs/common';
import { MetadataScanner, ModulesContainer } from '@nestjs/core';
import {
  AsyncApiChannelBindingsMap,
  AsyncApiMessageBindingsMap,
  AsyncApiOperationBindingsMap,
} from './bindings';
import {
  ASYNC_API_CHANNEL_BINDINGS_METADATA,
  ASYNC_API_CHANNEL_METADATA,
  ASYNC_API_HEADERS_METADATA,
  ASYNC_API_MESSAGE_BINDINGS_METADATA,
  ASYNC_API_MESSAGE_METADATA,
  ASYNC_API_OPERATION_BINDINGS_METADATA,
  ASYNC_API_OPERATION_METADATA,
  ASYNC_API_SERVERS_METADATA,
} from './constants';
import {
  AsyncApiChannelMetadata,
  AsyncApiHeadersMetadata,
  AsyncApiMessageMetadata,
  AsyncApiOperationMetadata,
  AsyncApiServerMetadata,
} from './decorators';
import {
  ASYNC_API_VERSION,
  AsyncApiChannelObject,
  AsyncApiDocument,
  AsyncApiInfo,
  AsyncApiMessageObject,
  AsyncApiOperationObject,
  AsyncApiServerObject,
} from './document';
import { AsyncApiDocumentConfig } from './interfaces';
import { buildRef } from './references';
import { AsyncApiDocumentScanner, ScannedHandler } from './scanner';
import { AsyncApiSchemaRegistry, SchemaSource } from './schema';

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
 * Read the {@link AsyncApiMessageMetadata} an {@link AsyncApiMessage} decorator
 * left on a prototype method, or `undefined` when the method has no payload.
 */
function readMessageMetadata(
  method: unknown,
): AsyncApiMessageMetadata | undefined {
  return Reflect.getMetadata(ASYNC_API_MESSAGE_METADATA, method as object) as
    | AsyncApiMessageMetadata
    | undefined;
}

/**
 * Read the {@link AsyncApiHeadersMetadata} an {@link AsyncApiHeaders} decorator
 * left on a prototype method, or `undefined` when the method has no headers.
 */
function readHeadersMetadata(
  method: unknown,
): AsyncApiHeadersMetadata | undefined {
  return Reflect.getMetadata(ASYNC_API_HEADERS_METADATA, method as object) as
    | AsyncApiHeadersMetadata
    | undefined;
}

/**
 * Read the channel bindings an {@link AsyncApiChannelBindings} decorator left on
 * a handler class, or `undefined` when the channel declares none.
 */
function readChannelBindings(
  metatype: Type,
): AsyncApiChannelBindingsMap | undefined {
  return Reflect.getMetadata(ASYNC_API_CHANNEL_BINDINGS_METADATA, metatype) as
    | AsyncApiChannelBindingsMap
    | undefined;
}

/**
 * Read the operation bindings an {@link AsyncApiOperationBindings} decorator left
 * on a prototype method, or `undefined` when the operation declares none.
 */
function readOperationBindings(
  method: unknown,
): AsyncApiOperationBindingsMap | undefined {
  return Reflect.getMetadata(
    ASYNC_API_OPERATION_BINDINGS_METADATA,
    method as object,
  ) as AsyncApiOperationBindingsMap | undefined;
}

/**
 * Read the message bindings an {@link AsyncApiMessageBindings} decorator left on
 * a prototype method, or `undefined` when the message declares none.
 */
function readMessageBindings(
  method: unknown,
): AsyncApiMessageBindingsMap | undefined {
  return Reflect.getMetadata(
    ASYNC_API_MESSAGE_BINDINGS_METADATA,
    method as object,
  ) as AsyncApiMessageBindingsMap | undefined;
}

/**
 * Read the list of {@link AsyncApiServerMetadata} the (repeatable)
 * {@link AsyncApiServer} decorator left on a handler class, or `undefined` when
 * the class declares no servers.
 */
function readServerMetadata(
  metatype: Type,
): AsyncApiServerMetadata[] | undefined {
  return Reflect.getMetadata(ASYNC_API_SERVERS_METADATA, metatype) as
    | AsyncApiServerMetadata[]
    | undefined;
}

/**
 * Derive the name a schema source contributes. A DTO class exposes its class
 * name through `Function.prototype.name`; a {@link JsonSchemaSource} exposes the
 * `name` it was created with. Both live on `.name`, so the same access works for
 * either and doubles as the default message name.
 */
function schemaSourceName(source: SchemaSource): string {
  return source.name;
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
    channel: { $ref: buildRef('#/channels', channelId) },
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
 * Build the descriptive fields of a Message Object, copying through only the
 * metadata the decorator supplied. Payload and headers schemas are attached by
 * the caller once they are registered.
 */
function buildMessage(
  metadata: AsyncApiMessageMetadata,
  name: string,
): AsyncApiMessageObject {
  const message: AsyncApiMessageObject = {
    name,
    contentType: metadata.contentType ?? 'application/json',
  };

  if (metadata.title !== undefined) {
    message.title = metadata.title;
  }
  if (metadata.summary !== undefined) {
    message.summary = metadata.summary;
  }
  if (metadata.description !== undefined) {
    message.description = metadata.description;
  }

  return message;
}

/**
 * Build a Server Object from one {@link AsyncApiServer} declaration, copying the
 * required `host`/`protocol` and only the optional fields that were provided.
 */
function buildServer(metadata: AsyncApiServerMetadata): AsyncApiServerObject {
  const server: AsyncApiServerObject = {
    host: metadata.host,
    protocol: metadata.protocol,
  };

  if (metadata.protocolVersion !== undefined) {
    server.protocolVersion = metadata.protocolVersion;
  }
  if (metadata.pathname !== undefined) {
    server.pathname = metadata.pathname;
  }
  if (metadata.title !== undefined) {
    server.title = metadata.title;
  }
  if (metadata.summary !== undefined) {
    server.summary = metadata.summary;
  }
  if (metadata.description !== undefined) {
    server.description = metadata.description;
  }
  if (metadata.bindings !== undefined) {
    server.bindings = metadata.bindings;
  }

  return server;
}

/**
 * The mutable document body that {@link collectHandler} appends channels,
 * operations, and reusable messages to as it visits each decorated handler. The
 * {@link AsyncApiSchemaRegistry} accumulates `components.schemas` and dedupes
 * shared DTOs across messages.
 */
interface DocumentBody {
  servers: Record<string, AsyncApiServerObject>;
  channels: Record<string, AsyncApiChannelObject>;
  operations: Record<string, AsyncApiOperationObject>;
  messages: Record<string, AsyncApiMessageObject>;
  registry: AsyncApiSchemaRegistry;
}

/**
 * The pieces of a single discovered operation needed to register it: the
 * channel it belongs to and the prototype method carrying its decorators.
 */
interface OperationContext {
  handler: ScannedHandler;
  channelId: string;
  methodName: string;
  method: unknown;
}

/**
 * Register the message an operation declares (if any) and wire it into the
 * document: store the reusable message in `components.messages`, expose it on
 * the channel, and return the channel-local reference the operation points at.
 * Operations without an {@link AsyncApiMessage} contribute no message.
 */
function collectMessage(
  body: DocumentBody,
  context: OperationContext,
): string | undefined {
  const messageMeta = readMessageMetadata(context.method);
  if (messageMeta === undefined) {
    return undefined;
  }

  const messageName = messageMeta.name ?? schemaSourceName(messageMeta.payload);
  const message = buildMessage(messageMeta, messageName);
  message.payload = { $ref: body.registry.register(messageMeta.payload) };

  const headersMeta = readHeadersMetadata(context.method);
  if (headersMeta !== undefined) {
    message.headers = { $ref: body.registry.register(headersMeta.headers) };
  }

  const messageBindings = readMessageBindings(context.method);
  if (messageBindings !== undefined) {
    message.bindings = messageBindings;
  }

  registerMessage(body, context, messageName, message);

  return buildRef(
    '#/channels',
    context.channelId,
    'messages',
    messageName,
  );
}

/**
 * Place a built message into `components.messages` and onto its channel,
 * treating a name reused for a structurally different message as a build
 * failure so collisions never silently overwrite a definition.
 */
function registerMessage(
  body: DocumentBody,
  context: OperationContext,
  messageName: string,
  message: AsyncApiMessageObject,
): void {
  const existing = body.messages[messageName];
  if (existing !== undefined && JSON.stringify(existing) !== JSON.stringify(message)) {
    throw new Error(
      `Conflicting AsyncAPI message named "${messageName}" produced by ${context.handler.metatype.name}.${context.methodName}.`,
    );
  }

  body.messages[messageName] = message;

  const channel = body.channels[context.channelId];
  channel.messages ??= {};
  channel.messages[messageName] = {
    $ref: buildRef('#/components/messages', messageName),
  };
}

/**
 * Register one discovered operation on the body, attaching its message
 * reference when the method declares a payload.
 */
function collectOperation(body: DocumentBody, context: OperationContext): void {
  const operationMeta = readOperationMetadata(
    context.handler.metatype.prototype as object,
    context.methodName,
  );
  if (operationMeta === undefined) {
    return;
  }

  const operationId = operationMeta.operationId ?? context.methodName;
  if (operationId in body.operations) {
    throw new Error(
      `Duplicate AsyncAPI operation id "${operationId}" produced by ${context.handler.metatype.name}.${context.methodName}.`,
    );
  }

  const operation = buildOperation(operationMeta, context.channelId);
  const messageRef = collectMessage(body, context);
  if (messageRef !== undefined) {
    operation.messages = [{ $ref: messageRef }];
  }

  const operationBindings = readOperationBindings(context.method);
  if (operationBindings !== undefined) {
    operation.bindings = operationBindings;
  }

  body.operations[operationId] = operation;
}

/**
 * Read every operation off one channel handler and register it on the body.
 */
function collectOperations(
  body: DocumentBody,
  handler: ScannedHandler,
  channelId: string,
): void {
  const prototype = handler.metatype.prototype as Record<string, unknown>;

  for (const methodName of handler.methodNames) {
    collectOperation(body, {
      handler,
      channelId,
      methodName,
      method: prototype[methodName],
    });
  }
}

/**
 * Register one scanned handler's channel and operations on the body. Handlers
 * without an {@link AsyncApiChannel} decorator are skipped, and a duplicate
 * channel id is treated as a build failure.
 */
function collectHandler(body: DocumentBody, handler: ScannedHandler): void {
  collectServers(body, handler);

  const channelMeta = readChannelMetadata(handler.metatype);
  if (channelMeta === undefined) {
    return;
  }

  if (channelMeta.id in body.channels) {
    throw new Error(
      `Duplicate AsyncAPI channel id "${channelMeta.id}" produced by ${handler.metatype.name}.`,
    );
  }

  const channel = buildChannel(channelMeta);
  const channelBindings = readChannelBindings(handler.metatype);
  if (channelBindings !== undefined) {
    channel.bindings = channelBindings;
  }

  body.channels[channelMeta.id] = channel;
  collectOperations(body, handler, channelMeta.id);
}

/**
 * Register every {@link AsyncApiServer} declared on a handler class. The
 * decorator is repeatable, so a class can carry several declarations; a server
 * name reused for a structurally different server is a build failure so a
 * collision never silently overwrites a definition.
 */
function collectServers(body: DocumentBody, handler: ScannedHandler): void {
  const serversMeta = readServerMetadata(handler.metatype);
  if (serversMeta === undefined) {
    return;
  }

  for (const serverMeta of serversMeta) {
    const server = buildServer(serverMeta);
    const existing = body.servers[serverMeta.name];

    if (
      existing !== undefined &&
      JSON.stringify(existing) !== JSON.stringify(server)
    ) {
      throw new Error(
        `Conflicting AsyncAPI server named "${serverMeta.name}" produced by ${handler.metatype.name}.`,
      );
    }

    body.servers[serverMeta.name] = server;
  }
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
  const body: DocumentBody = {
    servers: {},
    channels: {},
    operations: {},
    messages: {},
    registry: new AsyncApiSchemaRegistry(),
  };

  for (const handler of handlers) {
    collectHandler(body, handler);
  }

  const document: AsyncApiDocument = {
    asyncapi: ASYNC_API_VERSION,
    info: buildInfo(config),
    channels: body.channels,
    operations: body.operations,
    components: buildComponents(body),
  };

  if (Object.keys(body.servers).length > 0) {
    document.servers = body.servers;
  }

  return document;
}

/**
 * Assemble the `components` object, emitting `messages` and `schemas` only when
 * a handler declared at least one. An application with no `@AsyncApiMessage`
 * decorators still produces a valid (empty) `components` object.
 */
function buildComponents(body: DocumentBody): AsyncApiDocument['components'] {
  const components: AsyncApiDocument['components'] = {};
  const schemas = body.registry.getSchemas();

  if (Object.keys(body.messages).length > 0) {
    components.messages = body.messages;
  }
  if (Object.keys(schemas).length > 0) {
    components.schemas = schemas;
  }

  return components;
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
