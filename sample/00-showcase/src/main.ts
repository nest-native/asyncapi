import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createAsyncApiDocument } from './asyncapi';

/**
 * Bootstrap the showcase and print the generated AsyncAPI 3.0 document.
 *
 * The docs route with a live viewer lands in a later milestone; for now the
 * application demonstrates generating a valid document from decorated handlers.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
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
