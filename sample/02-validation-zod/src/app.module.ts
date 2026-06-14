import { Module } from '@nestjs/common';
import { AsyncApiModule } from '@nest-native/asyncapi';
import { MetricsModule } from './metrics/metrics.module';

/**
 * Root module for the Zod validation sample.
 */
@Module({
  imports: [
    AsyncApiModule.forRoot({ defaultInfo: { title: 'Metrics Service' } }),
    MetricsModule,
  ],
})
export class AppModule {}
