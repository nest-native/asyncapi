import { ModuleMetadata, Provider } from '@nestjs/common';
import { AsyncApiContact, AsyncApiLicense } from './document';

/**
 * Configuration for {@link AsyncApiModule.forRoot}.
 *
 * At this scaffold milestone the module only wires global configuration; the
 * AsyncAPI decorators (`@AsyncApiChannel`, `@AsyncApiPub`, `@AsyncApiSub`,
 * `@AsyncApiMessage`, `@AsyncApiHeaders`, `@AsyncApiServer`) and the document
 * generator land in later milestones and will read from these options.
 */
export interface AsyncApiModuleOptions {
  /**
   * Whether to register this module globally so the configuration is available
   * to every feature module without re-importing.
   *
   * @default true
   */
  isGlobal?: boolean;

  /**
   * Default metadata applied to the generated AsyncAPI document, such as the
   * info title and version used when no per-document override is supplied.
   */
  defaultInfo?: Record<string, string>;
}

/**
 * Configuration for {@link AsyncApiModule.forRootAsync}.
 */
export interface AsyncApiModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  /**
   * Whether to register this module globally.
   *
   * @default true
   */
  isGlobal?: boolean;

  /**
   * Providers to inject into {@link AsyncApiModuleAsyncOptions.useFactory}.
   */
  inject?: any[];

  /**
   * Additional providers registered alongside the resolved options.
   */
  extraProviders?: Provider[];

  /**
   * Factory that resolves the {@link AsyncApiModuleOptions} asynchronously.
   */
  useFactory: (
    ...args: any[]
  ) => AsyncApiModuleOptions | Promise<AsyncApiModuleOptions>;
}

/**
 * Configuration passed to {@link getAsyncApiDocument} to seed the generated
 * AsyncAPI 3.0 document's `info` object.
 *
 * This is the AsyncAPI counterpart to `DocumentBuilder` in `@nestjs/swagger`:
 * it carries the document-level metadata that cannot be derived from decorated
 * handlers. Channels, operations, and components are discovered from NestJS
 * metadata by the generator and are not configured here.
 */
export interface AsyncApiDocumentConfig {
  /**
   * The title of the application.
   *
   * @default 'AsyncAPI'
   */
  title?: string;

  /**
   * The version of the generated document. This is the API/document version and
   * is distinct from the AsyncAPI specification version (always `3.0.0`).
   *
   * @default '1.0.0'
   */
  version?: string;

  /**
   * A short description of the application.
   */
  description?: string;

  /**
   * A URL to the Terms of Service for the API.
   */
  termsOfService?: string;

  /**
   * Contact information for the exposed API.
   */
  contact?: AsyncApiContact;

  /**
   * License information for the exposed API.
   */
  license?: AsyncApiLicense;
}
