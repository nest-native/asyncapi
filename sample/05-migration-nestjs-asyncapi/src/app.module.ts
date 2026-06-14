import { Module } from '@nestjs/common';
import { AsyncApiModule } from '@nest-native/asyncapi';
import { FelinesModule } from './felines/felines.module';

/**
 * Root module for the migration sample.
 *
 * The original `nestjs-asyncapi` sample imported only its feature module and
 * relied on `AsyncApiModule.createDocument(app, ...)` at bootstrap.
 * `@nest-native/asyncapi` keeps `AsyncApiModule.forRoot()` for global
 * configuration and generates the document with `getAsyncApiDocument(app, ...)`.
 */
@Module({
  imports: [
    AsyncApiModule.forRoot({ defaultInfo: { title: 'Feline' } }),
    FelinesModule,
  ],
})
export class AppModule {}
