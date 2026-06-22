import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AsyncApiModule } from '@nest-native/asyncapi';
import { AppModule } from './app.module';
import { createAsyncApiDocument } from './asyncapi';

/**
 * Bootstrap the migrated felines sample.
 *
 * The original `nestjs-asyncapi` `main.ts` connected a TCP microservice and
 * called `await AsyncApiModule.setup(path, app, document)`. The shape is the
 * same here: create the HTTP app, build the document, then mount the viewer with
 * `AsyncApiModule.setup`. Open `http://localhost:4001/async-api` for the viewer.
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
  AsyncApiModule.setup('async-api', app, document, {
    title: 'Feline — AsyncAPI',
  });

  await app.listen(4001);
  process.stdout.write(
    'AsyncAPI docs available at http://localhost:4001/async-api\n',
  );
}

void bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
