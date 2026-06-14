import { Module } from '@nestjs/common';
import { ShipmentsHandler } from './shipments.handler';

/**
 * Feature module wiring the shipments channel handler (Zod validation world).
 */
@Module({
  controllers: [ShipmentsHandler],
})
export class ShipmentsModule {}
