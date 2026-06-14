import { Module } from '@nestjs/common';
import {
  CreateFelineController,
  JournalController,
} from './felines.controller';

/**
 * Feature module contributing the ported felines channel handlers. The
 * generator discovers the handlers through NestJS metadata, exactly as the
 * `nestjs-asyncapi` generator did — the migration does not change how modules
 * are wired.
 */
@Module({
  controllers: [CreateFelineController, JournalController],
})
export class FelinesModule {}
