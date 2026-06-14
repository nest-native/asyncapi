import 'reflect-metadata';
import assert from 'node:assert/strict';
import { Parser } from '@asyncapi/parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { createAsyncApiDocument } from '../src/asyncapi';

type ShowcaseDocument = ReturnType<typeof createAsyncApiDocument>;

const parser = new Parser();

/**
 * Verify the showcase application generates a valid AsyncAPI 3.0 document with
 * the decorated channels, their operations, and the message payloads/headers
 * sourced from both validation worlds — then validate it with the official
 * `@asyncapi/parser`.
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
    assertShipmentsChannel(document);
    assertComponents(document);
    assertTransportBindings(document);
    await assertValidatesWithParser(document);
  } finally {
    await app.close();
  }
}

function assertDocumentShape(document: ShowcaseDocument): void {
  assert.equal(document.asyncapi, '3.0.0');
  assert.equal(document.info.title, 'Orders Service');
  assert.equal(document.info.version, '1.0.0');
}

function assertOrdersChannel(document: ShowcaseDocument): void {
  assert.deepEqual(document.channels.orders.messages, {
    OrderPlaced: { $ref: '#/components/messages/OrderPlaced' },
  });
  assert.deepEqual(document.operations.orderPlaced.messages, [
    { $ref: '#/channels/orders/messages/OrderPlaced' },
  ]);
}

function assertShipmentsChannel(document: ShowcaseDocument): void {
  assert.deepEqual(document.channels.shipments.messages, {
    OrderShipped: { $ref: '#/components/messages/OrderShipped' },
  });
  assert.deepEqual(document.operations.onOrderShipped.messages, [
    { $ref: '#/channels/shipments/messages/OrderShipped' },
  ]);
}

function assertComponents(document: ShowcaseDocument): void {
  const messages = document.components.messages ?? {};
  const schemas = document.components.schemas ?? {};

  // class-validator world: payload and headers turned into JSON Schema. The
  // schema component name is the DTO class name; the message name is the
  // explicit `name` passed to `@AsyncApiMessage`.
  assert.equal(
    messages.OrderPlaced.payload?.$ref,
    '#/components/schemas/OrderPlacedDto',
  );
  assert.equal(
    messages.OrderPlaced.headers?.$ref,
    '#/components/schemas/OrderHeadersDto',
  );
  assert.ok(schemas.OrderPlacedDto, 'class-validator payload schema is present');
  assert.ok(
    schemas.OrderHeadersDto,
    'class-validator headers schema is present',
  );

  // Zod world: pre-computed JSON Schema registered verbatim.
  assert.equal(
    messages.OrderShipped.payload?.$ref,
    '#/components/schemas/OrderShipped',
  );
  assert.ok(schemas.OrderShipped, 'Zod-derived payload schema is present');
}

function assertTransportBindings(document: ShowcaseDocument): void {
  // Kafka: a server, the channel topic, and the consumer group.
  const servers = document.servers ?? {};
  assert.equal(servers.kafka?.protocol, 'kafka');
  assert.equal(servers.nats?.protocol, 'nats');
  assert.equal(
    document.channels.orders.bindings?.kafka?.topic,
    'orders.v1',
  );
  assert.ok(
    document.operations.onOrderPlaced.bindings?.kafka?.groupId,
    'the orders consumer group is documented',
  );
  // NATS: the queue group on the shipments subscriber.
  assert.equal(
    document.operations.onOrderShipped.bindings?.nats?.queue,
    'shipments-workers',
  );
}

async function assertValidatesWithParser(
  document: ShowcaseDocument,
): Promise<void> {
  const { diagnostics } = await parser.parse(
    JSON.parse(JSON.stringify(document)),
  );
  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === 0);

  assert.deepEqual(
    errors.map((diagnostic) => diagnostic.message),
    [],
    'the generated document must pass @asyncapi/parser validation',
  );
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
