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

const parser = new Parser();

/**
 * Boot the sample over a real Express HTTP server, set up the docs route, and
 * assert the viewer page, the JSON spec, and the YAML spec are served — then
 * validate both served documents with the official `@asyncapi/parser`.
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

  const document = createAsyncApiDocument(app);
  const routes = AsyncApiModule.setup('async-docs', app, document, {
    title: 'Orders Service — AsyncAPI',
  });

  assert.deepEqual(routes, {
    uiUrl: '/async-docs',
    jsonUrl: '/async-docs-json',
    yamlUrl: '/async-docs-yaml',
  });

  await app.listen(0);

  try {
    const origin = baseUrl(app);

    await assertViewerPage(origin, routes.uiUrl);
    await assertJsonSpec(origin, routes.jsonUrl);
    await assertYamlSpec(origin, routes.yamlUrl);
  } finally {
    await app.close();
  }
}

function baseUrl(app: INestApplication): string {
  const server = app.getHttpServer() as { address(): AddressInfo | string | null };
  const address = server.address();
  assert.ok(address && typeof address === 'object', 'the server bound a port');
  return `http://127.0.0.1:${address.port}`;
}

async function assertViewerPage(origin: string, path: string): Promise<void> {
  const response = await fetch(`${origin}${path}`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /text\/html/);

  const html = await response.text();
  assert.match(html, /AsyncApiStandalone\.render\(/);
  assert.match(html, /<title>Orders Service — AsyncAPI<\/title>/);
  // The spec is embedded inline so the viewer renders without a second request.
  assert.match(html, /\\"asyncapi\\": \\"3.0.0\\"/);
}

async function assertJsonSpec(origin: string, path: string): Promise<void> {
  const response = await fetch(`${origin}${path}`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /application\/json/);

  const body = await response.text();
  const parsed = JSON.parse(body);
  assert.equal(parsed.asyncapi, '3.0.0');
  assert.equal(parsed.info.title, 'Orders Service');
  assert.ok(parsed.channels.orders, 'the orders channel is in the served JSON');

  await assertValidatesWithParser(body);
}

async function assertYamlSpec(origin: string, path: string): Promise<void> {
  const response = await fetch(`${origin}${path}`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /application\/yaml/);

  const yaml = await response.text();
  assert.match(yaml, /^asyncapi: 3\.0\.0$/m);
  assert.match(yaml, /^ {2}title: Orders Service$/m);

  await assertValidatesWithParser(yaml);
}

async function assertValidatesWithParser(source: string): Promise<void> {
  const { diagnostics } = await parser.parse(source);
  const errors = diagnostics
    .filter((diagnostic) => diagnostic.severity === 0)
    .map((diagnostic) => diagnostic.message);

  assert.deepEqual(
    errors,
    [],
    'the served document must pass @asyncapi/parser validation',
  );
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
