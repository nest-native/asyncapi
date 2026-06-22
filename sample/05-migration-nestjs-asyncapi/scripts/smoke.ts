import 'reflect-metadata';
import assert from 'node:assert/strict';
import { Parser } from '@asyncapi/parser';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { createAsyncApiDocument } from '../src/asyncapi';

type MigrationDocument = ReturnType<typeof createAsyncApiDocument>;

const parser = new Parser();

/**
 * Boot the migrated sample, assert it reproduces the two channels, the
 * send/receive operations, the polymorphic feline payload, and the TCP server
 * from the original `nestjs-asyncapi` felines sample, then validate the result
 * with the official `@asyncapi/parser`.
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

    assertInfo(document);
    assertServer(document);
    assertChannels(document);
    assertOperations(document);
    assertPolymorphicPayload(document);
    await assertValidatesWithParser(document);
  } finally {
    await app.close();
  }
}

function assertInfo(document: MigrationDocument): void {
  assert.equal(document.info.title, 'Feline');
  assert.equal(document.info.version, '1.0.0');
}

function assertServer(document: MigrationDocument): void {
  const servers = document.servers ?? {};
  assert.deepEqual(Object.keys(servers), ['felines-broker']);
  assert.equal(servers['felines-broker'].protocol, 'tcp');
  assert.equal(servers['felines-broker'].host, 'tcp://localhost:4001');
}

function assertChannels(document: MigrationDocument): void {
  // The 2.x sample's two `channel` strings become two AsyncAPI 3.0 channels.
  assert.deepEqual(Object.keys(document.channels).sort(), [
    'ms/create/feline',
    'ms/journal',
  ]);
  assert.equal(document.channels['ms/create/feline'].title, 'Create feline');
  assert.equal(document.channels['ms/journal'].title, 'Journal');
}

function assertOperations(document: MigrationDocument): void {
  // @AsyncApiSend -> send operation, @AsyncApiReceive -> receive operation.
  assert.equal(document.operations.publishCreateFeline.action, 'send');
  assert.equal(document.operations.onCreateFeline.action, 'receive');
  assert.equal(document.operations.onJournalEntry.action, 'receive');

  // The channel id contains `/`, so the JSON Pointer escapes it as `~1`.
  assert.deepEqual(document.operations.publishCreateFeline.channel, {
    $ref: '#/channels/ms~1create~1feline',
  });
}

function assertPolymorphicPayload(document: MigrationDocument): void {
  const messages = document.components.messages ?? {};
  assert.ok(messages.FelineEvent, 'the feline event message is registered');
  assert.ok(messages.JournalEntry, 'the journal entry message is registered');

  const schemas = document.components.schemas ?? {};
  // The @ApiProperty oneOf of Cat/Lion/Tiger is pulled in by the @nestjs/swagger
  // chain with no separate extraModels step, just like the migration doc claims.
  for (const name of ['FelineEventDto', 'Cat', 'Lion', 'Tiger']) {
    assert.ok(schemas[name], `${name} schema is emitted into components.schemas`);
  }

  const payload = schemas.FelineEventDto.properties as
    | Record<string, { oneOf?: unknown[] }>
    | undefined;
  assert.ok(payload?.payload?.oneOf, 'the payload keeps its polymorphic oneOf');
  assert.equal(payload.payload.oneOf?.length, 3);
}

async function assertValidatesWithParser(
  document: MigrationDocument,
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
    'the migrated document must pass @asyncapi/parser validation',
  );
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
