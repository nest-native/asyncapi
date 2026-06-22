import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AsyncApiModule } from '@nest-native/asyncapi';
import { AppModule } from './app.module';
import { createAsyncApiDocument } from './asyncapi';

/**
 * Bootstrap the docs-route sample.
 *
 * The flow mirrors `@nestjs/swagger`: create the HTTP application, generate the
 * document from the decorated handlers, then mount the viewer and the raw
 * JSON/YAML spec with `AsyncApiModule.setup` before the app starts listening.
 * Open `http://localhost:3000/async-docs` for the live viewer.
 *
 * The HTTP driver is passed explicitly via `ExpressAdapter` rather than relying
 * on `NestFactory`'s default-driver auto-discovery. Auto-discovery resolves
 * `@nestjs/platform-express` relative to `@nestjs/core`'s install location, so
 * it only works when both are hoisted together — a fragile assumption in a
 * workspace where a lockfile refresh can nest `platform-express` under this
 * sample. Constructing the adapter here resolves it from this sample's own
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
