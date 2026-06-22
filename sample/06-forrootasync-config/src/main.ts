import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { createAsyncApiDocument } from './asyncapi';

/**
 * Bootstrap the sample and print the generated AsyncAPI 3.0 document.
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
  await app.init();

  try {
    const document = createAsyncApiDocument(app);
    process.stdout.write(`${JSON.stringify(document, null, 2)}\n`);
  } finally {
    await app.close();
  }
}

void bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
