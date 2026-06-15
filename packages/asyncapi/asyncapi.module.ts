import {
  DynamicModule,
  INestApplication,
  Module,
  Provider,
} from '@nestjs/common';
import { AsyncApiDocsOptions, setupAsyncApiDocs } from './docs';
import { AsyncApiDocument } from './document';
import {
  AsyncApiModuleAsyncOptions,
  AsyncApiModuleOptions,
} from './interfaces';

/**
 * Injection token for the resolved {@link AsyncApiModuleOptions}.
 *
 * Consumers that need the global AsyncAPI configuration can inject this token.
 * The document generator ({@link getAsyncApiDocument}) reads its defaults from
 * the same provider.
 */
export const ASYNC_API_MODULE_OPTIONS = Symbol('ASYNC_API_MODULE_OPTIONS');

/**
 * Root module for `@nest-native/asyncapi`.
 *
 * Register it once in the application's root module to provide the global
 * AsyncAPI configuration that {@link getAsyncApiDocument} reads when generating
 * a document. The `@AsyncApiChannel`, `@AsyncApiPub`, `@AsyncApiSub`,
 * `@AsyncApiMessage`, `@AsyncApiHeaders`, and `@AsyncApiServer` decorators
 * annotate handlers and DTOs independently of this module; {@link setup} then
 * serves the generated document and its viewer over the running HTTP server.
 */
@Module({})
export class AsyncApiModule {
  /**
   * Register the module with synchronous configuration.
   */
  static forRoot(options: AsyncApiModuleOptions = {}): DynamicModule {
    const optionsProvider: Provider = {
      provide: ASYNC_API_MODULE_OPTIONS,
      useValue: options,
    };

    return {
      module: AsyncApiModule,
      global: options.isGlobal ?? true,
      providers: [optionsProvider],
      exports: [optionsProvider],
    };
  }

  /**
   * Register the module with asynchronous configuration resolved through a
   * factory.
   */
  static forRootAsync(options: AsyncApiModuleAsyncOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: ASYNC_API_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };

    return {
      module: AsyncApiModule,
      global: options.isGlobal ?? true,
      imports: options.imports ?? [],
      providers: [...(options.extraProviders ?? []), optionsProvider],
      exports: [optionsProvider],
    };
  }

  /**
   * Serve a generated AsyncAPI document and its viewer over a running NestJS
   * application's HTTP server.
   *
   * This mirrors `SwaggerModule.setup`: pass the document produced by
   * {@link getAsyncApiDocument} and a base route, and the viewer page is mounted
   * at `path` with the raw JSON and YAML at `${path}-json` / `${path}-yaml`
   * (both overridable). The routes attach to the application's existing HTTP
   * adapter, so it works on `@nestjs/platform-express` and
   * `@nestjs/platform-fastify` alike.
   *
   * @returns The normalized routes the docs were mounted on.
   */
  static setup(
    path: string,
    app: INestApplication,
    document: AsyncApiDocument,
    options?: AsyncApiDocsOptions,
  ): { uiUrl: string; jsonUrl: string; yamlUrl: string } {
    return setupAsyncApiDocs(path, app, document, options);
  }
}
