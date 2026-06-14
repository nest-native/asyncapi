import { Module } from '@nestjs/common';
import { AsyncApiModule } from '@nest-native/asyncapi';
import { OrdersModule } from './orders/orders.module';
import { ShipmentsModule } from './shipments/shipments.module';

/**
 * Root module for the showcase. `AsyncApiModule.forRoot()` registers the global
 * AsyncAPI configuration; feature modules contribute decorated channel
 * handlers that the generator discovers through NestJS metadata. The orders
 * channel uses class-validator DTOs and the shipments channel uses Zod, showing
 * both validation worlds in one document.
 */
@Module({
  imports: [
    AsyncApiModule.forRoot({
      defaultInfo: { title: 'Nest-native AsyncAPI showcase' },
    }),
    OrdersModule,
    ShipmentsModule,
  ],
})
export class AppModule {}
