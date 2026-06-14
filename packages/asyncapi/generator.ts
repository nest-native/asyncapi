import { INestApplicationContext } from '@nestjs/common';
import { MetadataScanner, ModulesContainer } from '@nestjs/core';
import {
  ASYNC_API_VERSION,
  AsyncApiDocument,
  AsyncApiInfo,
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
 * Assemble an AsyncAPI 3.0 document from a document config and the handlers
 * discovered while walking NestJS metadata.
 *
 * At this skeleton milestone no AsyncAPI decorators exist, so the discovered
 * handlers contribute no channels or operations and the document is emitted
 * with empty `channels`, `operations`, and `components`. This is a valid
 * AsyncAPI 3.0 document. Later milestones populate these sections from the
 * decorator metadata read off the same {@link ScannedHandler} list.
 */
export function buildAsyncApiDocument(
  config: AsyncApiDocumentConfig,
  handlers: ScannedHandler[],
): AsyncApiDocument {
  void handlers;

  return {
    asyncapi: ASYNC_API_VERSION,
    info: buildInfo(config),
    channels: {},
    operations: {},
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
