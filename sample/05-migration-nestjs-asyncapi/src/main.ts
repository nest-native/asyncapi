import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
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
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
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
