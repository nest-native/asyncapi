import { Module } from '@nestjs/common';
import { OrdersHandler } from './orders.handler';

/**
 * Feature module contributing the orders channel handler the docs route renders.
 */
@Module({
  controllers: [OrdersHandler],
})
export class OrdersModule {}
