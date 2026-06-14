import { Module } from '@nestjs/common';
import { AsyncApiModule } from '@nest-native/asyncapi';
import { OrdersModule } from './orders/orders.module';

/**
 * Root module for the docs-route sample. The viewer is wired in `main.ts` via
 * `AsyncApiModule.setup`, after the HTTP application is created.
 */
@Module({
  imports: [
    AsyncApiModule.forRoot({ defaultInfo: { title: 'Orders Service' } }),
    OrdersModule,
  ],
})
export class AppModule {}
