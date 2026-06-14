import { Module } from '@nestjs/common';
import { PaymentsHandler } from './payments.handler';

/**
 * Feature module wiring the payments channel handler.
 */
@Module({
  controllers: [PaymentsHandler],
})
export class PaymentsModule {}
