import 'reflect-metadata';
import assert from 'node:assert/strict';
import { Parser } from '@asyncapi/parser';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { createAsyncApiDocument } from '../src/asyncapi';

const parser = new Parser();

/**
 * Boot the sample, assert the class-validator payload and headers became JSON
 * Schema components, and validate the document with `@asyncapi/parser`.
 */
async function smoke(): Promise<void> {
  // The HTTP driver is supplied explicitly via `ExpressAdapter` instead of
  // `NestFactory`'s default-driver auto-discovery. Auto-discovery resolves
  // `@nestjs/platform-express` relative to `@nestjs/core`, so it only succeeds
  // when both are hoisted together; constructing the adapter here resolves it
  // from this sample's own declared dependency, independent of workspace
  // hoisting.
  const app = await NestFactory.create(AppModule, new ExpressAdapter(), {
    abortOnError: false,
    logger: false,
  });
  await app.init();

  try {
    const document = createAsyncApiDocument(app);

    const message = document.components.messages?.PaymentCaptured;
    assert.ok(message, 'the captured-payment message is registered');
    assert.equal(
      message.payload?.$ref,
      '#/components/schemas/PaymentCapturedDto',
    );
    assert.equal(
      message.headers?.$ref,
      '#/components/schemas/PaymentHeadersDto',
    );
    assert.ok(document.components.schemas?.PaymentCapturedDto);
    assert.ok(document.components.schemas?.PaymentHeadersDto);

    const { diagnostics } = await parser.parse(
      JSON.parse(JSON.stringify(document)),
    );
    const errors = diagnostics
      .filter((diagnostic) => diagnostic.severity === 0)
      .map((diagnostic) => diagnostic.message);
    assert.deepEqual(errors, []);
  } finally {
    await app.close();
  }
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
