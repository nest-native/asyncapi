import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createAsyncApiDocument } from './asyncapi';

/**
 * Bootstrap the sample and print the generated AsyncAPI 3.0 document.
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
