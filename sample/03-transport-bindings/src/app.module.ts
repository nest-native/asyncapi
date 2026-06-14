import { Module } from '@nestjs/common';
import { AsyncApiModule } from '@nest-native/asyncapi';
import { OrdersModule } from './orders/orders.module';

/**
 * Root module for the transport-bindings sample.
 */
@Module({
  imports: [
    AsyncApiModule.forRoot({ defaultInfo: { title: 'Orders Service' } }),
    OrdersModule,
  ],
})
export class AppModule {}
