import { Module } from '@nestjs/common';
import { AsyncApiModule } from '@nest-native/asyncapi';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { NotificationsModule } from './notifications/notifications.module';

/**
 * Root module for the `forRootAsync` configuration sample.
 *
 * Instead of inlining the AsyncAPI defaults with `forRoot`, the module resolves
 * them asynchronously: it imports a module that exports {@link ConfigService},
 * injects that service into the factory, and awaits the config values. This is
 * the exact shape an application uses to seed its AsyncAPI metadata from
 * environment variables, a secrets manager, or a remote config server.
 */
@Module({
  imports: [
    AsyncApiModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        defaultInfo: {
          title: await config.resolve('SERVICE_TITLE'),
          version: await config.resolve('SERVICE_VERSION'),
        },
      }),
    }),
    NotificationsModule,
  ],
})
export class AppModule {}
