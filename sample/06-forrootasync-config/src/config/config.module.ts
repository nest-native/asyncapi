import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';

/**
 * Feature module exposing {@link ConfigService} so it can be injected into the
 * `AsyncApiModule.forRootAsync` factory.
 */
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
