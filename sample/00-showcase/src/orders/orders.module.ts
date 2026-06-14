import { Module } from '@nestjs/common';
import { OrdersHandler } from './orders.handler';

/**
 * Feature module wiring the orders channel handler.
 */
@Module({
  controllers: [OrdersHandler],
})
export class OrdersModule {}
