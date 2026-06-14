import { Module } from '@nestjs/common';
import { AsyncApiModule } from '@nest-native/asyncapi';
import { OrdersModule } from './orders/orders.module';

/**
 * Root module for the showcase. `AsyncApiModule.forRoot()` registers the global
 * AsyncAPI configuration; feature modules contribute decorated channel
 * handlers that the generator discovers through NestJS metadata.
 */
@Module({
  imports: [
    AsyncApiModule.forRoot({
      defaultInfo: { title: 'Nest-native AsyncAPI showcase' },
    }),
    OrdersModule,
  ],
})
export class AppModule {}
