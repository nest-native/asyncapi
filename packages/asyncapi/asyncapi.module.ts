import { DynamicModule, Module, Provider } from '@nestjs/common';
import {
  AsyncApiModuleAsyncOptions,
  AsyncApiModuleOptions,
} from './interfaces';

/**
 * Injection token for the resolved {@link AsyncApiModuleOptions}.
 *
 * Consumers that need the global AsyncAPI configuration can inject this token.
 * The AsyncAPI decorators and document generator added in later milestones
 * resolve their defaults from the same provider.
 */
export const ASYNC_API_MODULE_OPTIONS = Symbol('ASYNC_API_MODULE_OPTIONS');

/**
 * Root module for `@nest-native/asyncapi`.
 *
 * At this scaffold milestone the module only registers global configuration so
 * applications can wire it into their root module. The `@AsyncApiChannel`,
 * `@AsyncApiPub`, `@AsyncApiSub`, `@AsyncApiMessage`, `@AsyncApiHeaders`, and
 * `@AsyncApiServer` decorators and the document generator arrive in later
 * milestones and build on this same module shell.
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
}
