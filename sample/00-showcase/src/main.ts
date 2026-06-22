import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AsyncApiModule } from '@nest-native/asyncapi';
import { AppModule } from './app.module';
import { createAsyncApiDocument } from './asyncapi';

/**
 * Bootstrap the showcase, generate the AsyncAPI 3.0 document, and serve it with
 * the live viewer.
 *
 * `AsyncApiModule.setup` mirrors `SwaggerModule.setup`: it mounts the viewer at
 * `/async-docs` and the raw JSON/YAML spec at `/async-docs-json` and
 * `/async-docs-yaml` on the application's HTTP server.
 *
 * The HTTP driver is passed explicitly via `ExpressAdapter` rather than relying
 * on `NestFactory`'s default-driver auto-discovery. Auto-discovery resolves
 * `@nestjs/platform-express` relative to `@nestjs/core`'s install location, so
 * it only works when both are hoisted together — a fragile assumption in a
 * workspace where a lockfile refresh can nest `platform-express` under this
 * sample. Constructing the adapter here resolves it from the showcase's own
 * dependency (declared in this package), independent of hoisting.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(), {
    abortOnError: false,
    logger: false,
  });

  const document = createAsyncApiDocument(app);
  AsyncApiModule.setup('async-docs', app, document, {
    title: 'Orders Service — AsyncAPI',
  });

  await app.listen(3000);
  process.stdout.write(
    'AsyncAPI docs available at http://localhost:3000/async-docs\n',
  );
}

void bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
