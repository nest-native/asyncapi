import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
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
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
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
