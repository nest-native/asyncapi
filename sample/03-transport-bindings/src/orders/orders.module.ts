import { Module } from '@nestjs/common';
import { OrdersHandler } from './orders.handler';

/**
 * Feature module contributing the orders channel handler. The generator
 * discovers the handler — and the servers and bindings it declares — through
 * NestJS metadata.
 */
@Module({
  controllers: [OrdersHandler],
})
export class OrdersModule {}
