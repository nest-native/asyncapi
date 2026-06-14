import 'reflect-metadata';
import assert from 'node:assert/strict';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { createAsyncApiDocument } from '../src/asyncapi';

/**
 * Verify the showcase application generates a valid AsyncAPI 3.0 document with
 * the decorated orders channel and both of its operations.
 */
async function smoke(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    abortOnError: false,
    logger: false,
  });
  await app.init();

  try {
    const document = createAsyncApiDocument(app);

    assertDocumentShape(document);
    assertOrdersChannel(document);
    assertOperations(document);
  } finally {
    await app.close();
  }
}

function assertDocumentShape(document: ReturnType<typeof createAsyncApiDocument>): void {
  assert.equal(document.asyncapi, '3.0.0');
  assert.equal(document.info.title, 'Orders Service');
  assert.equal(document.info.version, '1.0.0');
}

function assertOrdersChannel(
  document: ReturnType<typeof createAsyncApiDocument>,
): void {
  assert.deepEqual(document.channels, {
    orders: {
      address: 'orders.v1',
      title: 'Orders',
      description: 'Lifecycle events for customer orders.',
    },
  });
}

function assertOperations(
  document: ReturnType<typeof createAsyncApiDocument>,
): void {
  assert.deepEqual(document.operations, {
    orderPlaced: {
      action: 'send',
      channel: { $ref: '#/channels/orders' },
      summary: 'A customer placed an order.',
    },
    onOrderShipped: {
      action: 'receive',
      channel: { $ref: '#/channels/orders' },
      summary: 'React to an order being shipped.',
    },
  });
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
