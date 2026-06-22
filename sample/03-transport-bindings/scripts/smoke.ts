import 'reflect-metadata';
import assert from 'node:assert/strict';
import { Parser } from '@asyncapi/parser';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { createAsyncApiDocument } from '../src/asyncapi';

type BindingsDocument = ReturnType<typeof createAsyncApiDocument>;

const parser = new Parser();

/**
 * Boot the sample, assert the servers and the channel/operation/message
 * bindings for all four transports are present, then validate the document with
 * the official `@asyncapi/parser`.
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

    assertServers(document);
    assertChannelBindings(document);
    assertOperationBindings(document);
    assertMessageBindings(document);
    await assertValidatesWithParser(document);
  } finally {
    await app.close();
  }
}

function assertServers(document: BindingsDocument): void {
  const servers = document.servers ?? {};
  assert.deepEqual(Object.keys(servers).sort(), [
    'kafka',
    'mqtt',
    'nats',
    'rabbit',
  ]);
  assert.equal(servers.kafka.protocol, 'kafka');
  assert.equal(
    servers.kafka.bindings?.kafka?.schemaRegistryVendor,
    'confluent',
  );
  assert.equal(servers.mqtt.bindings?.mqtt?.clientId, 'orders-service');
}

function assertChannelBindings(document: BindingsDocument): void {
  const bindings = document.channels.orders.bindings ?? {};
  assert.equal(bindings.kafka?.topic, 'orders.v1');
  assert.equal(bindings.kafka?.partitions, 6);
  assert.equal(bindings.amqp?.is, 'routingKey');
}

function assertOperationBindings(document: BindingsDocument): void {
  const publish = document.operations.publishOrderPlaced.bindings ?? {};
  assert.ok(publish.kafka?.clientId, 'Kafka producer client id is documented');

  const receive = document.operations.onOrderPlaced.bindings ?? {};
  assert.ok(receive.kafka?.groupId, 'Kafka consumer group is documented');
  assert.equal(receive.nats?.queue, 'orders-workers');
  assert.equal(receive.mqtt?.qos, 1);
  assert.equal(receive.amqp?.deliveryMode, 2);
}

function assertMessageBindings(document: BindingsDocument): void {
  const message = document.components.messages?.OrderPlaced;
  assert.ok(message, 'the order placed message is registered');
  // Publisher and subscriber attach the same message bindings, so the single
  // reusable message carries every transport's wire-format binding.
  assert.equal(message.bindings?.kafka?.schemaIdLocation, 'payload');
  assert.equal(message.bindings?.amqp?.contentEncoding, 'gzip');
  assert.equal(message.bindings?.mqtt?.payloadFormatIndicator, 1);
}

async function assertValidatesWithParser(
  document: BindingsDocument,
): Promise<void> {
  const { diagnostics } = await parser.parse(
    JSON.parse(JSON.stringify(document)),
  );
  const errors = diagnostics
    .filter((diagnostic) => diagnostic.severity === 0)
    .map((diagnostic) => diagnostic.message);

  assert.deepEqual(
    errors,
    [],
    'the generated document must pass @asyncapi/parser validation',
  );
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
