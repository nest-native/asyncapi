import { Module } from '@nestjs/common';
import { MetricsHandler } from './metrics.handler';

/**
 * Feature module wiring the metrics channel handler.
 */
@Module({
  controllers: [MetricsHandler],
})
export class MetricsModule {}
