import 'reflect-metadata';
import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import { Parser } from '@asyncapi/parser';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AsyncApiModule } from '@nest-native/asyncapi';
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
  // The HTTP driver is supplied explicitly via `ExpressAdapter` instead of
  // `NestFactory`'s default-driver auto-discovery. Auto-discovery resolves
  // `@nestjs/platform-express` relative to `@nestjs/core`, so it only succeeds
  // when both are hoisted together; constructing the adapter here resolves it
  // from this sample's own declared dependency, independent of workspace
  // hoisting. The docs route below relies on a live HTTP server, so a working
  // driver is mandatory for this smoke.
  const app = await NestFactory.create(AppModule, new ExpressAdapter(), {
    abortOnError: false,
    logger: false,
  });

  try {
    const document = createAsyncApiDocument(app);

    assertDocumentShape(document);
    assertOrdersChannel(document);
    assertShipmentsChannel(document);
    assertComponents(document);
    assertTransportBindings(document);
    await assertValidatesWithParser(document);
    // Wiring the docs route before app.listen() mirrors SwaggerModule.setup:
    // the routes must be registered before the HTTP server finalizes routing.
    await assertDocsRoute(app, document);
  } finally {
    await app.close();
  }
}

async function assertDocsRoute(
  app: INestApplication,
  document: ShowcaseDocument,
): Promise<void> {
  const routes = AsyncApiModule.setup('async-docs', app, document, {
    title: 'Orders Service — AsyncAPI',
  });
  assert.deepEqual(routes, {
    uiUrl: '/async-docs',
    jsonUrl: '/async-docs-json',
    yamlUrl: '/async-docs-yaml',
  });

  await app.listen(0);
  const server = app.getHttpServer() as { address(): AddressInfo | string | null };
  const address = server.address();
  assert.ok(address && typeof address === 'object', 'the server bound a port');
  const origin = `http://127.0.0.1:${address.port}`;

  const page = await fetch(`${origin}${routes.uiUrl}`);
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type') ?? '', /text\/html/);
  assert.match(await page.text(), /AsyncApiStandalone\.render\(/);

  const yaml = await fetch(`${origin}${routes.yamlUrl}`);
  assert.match(yaml.headers.get('content-type') ?? '', /application\/yaml/);
  const { diagnostics } = await parser.parse(await yaml.text());
  assert.deepEqual(
    diagnostics.filter((diagnostic) => diagnostic.severity === 0),
    [],
    'the YAML served by the docs route must pass @asyncapi/parser validation',
  );
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

  // Zod world: the Zod schema is passed directly and converted by the
  // generator with Zod 4's native z.toJSONSchema().
  assert.equal(
    messages.OrderShipped.payload?.$ref,
    '#/components/schemas/OrderShipped',
  );
  const orderShipped = schemas.OrderShipped as
    | Record<string, unknown>
    | undefined;
  assert.ok(orderShipped, 'Zod-derived payload schema is present');
  assert.equal(
    orderShipped.type,
    'object',
    'the Zod schema was converted to JSON Schema',
  );
  assert.deepEqual(orderShipped.required, ['orderId', 'carrier', 'shippedAt']);
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
