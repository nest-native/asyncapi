import { ModuleMetadata, Provider } from '@nestjs/common';

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
