import assert from 'node:assert/strict';
import Module from 'node:module';
import { describe, it } from 'node:test';
import 'reflect-metadata';
import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { AsyncApiSchemaRegistry, JsonSchemaSource } from '../schema';

describe('AsyncApiSchemaRegistry', () => {
  it('registers a pre-computed JSON Schema under its name', () => {
    const registry = new AsyncApiSchemaRegistry();
    const source: JsonSchemaSource = {
      name: 'OrderHeaders',
      schema: { type: 'object', properties: { trace: { type: 'string' } } },
    };

    const ref = registry.register(source);

    assert.equal(ref, '#/components/schemas/OrderHeaders');
    assert.deepEqual(registry.getSchemas().OrderHeaders, source.schema);
  });

  it('accepts a Zod schema converted with z.toJSONSchema()', () => {
    const registry = new AsyncApiSchemaRegistry();
    const OrderShipped = z.object({
      orderId: z.uuid(),
      carrier: z.enum(['ups', 'fedex']),
    });
    const schema = z.toJSONSchema(OrderShipped, { target: 'draft-7' });

    const ref = registry.register({ name: 'OrderShipped', schema });

    assert.equal(ref, '#/components/schemas/OrderShipped');
    const registered = registry.getSchemas().OrderShipped as Record<
      string,
      unknown
    >;
    assert.equal(registered.type, 'object');
    assert.deepEqual(registered.required, ['orderId', 'carrier']);
  });

  it('registers a Zod schema directly, converting it with z.toJSONSchema()', () => {
    const registry = new AsyncApiSchemaRegistry();
    const OrderShipped = z.object({
      orderId: z.uuid(),
      carrier: z.enum(['ups', 'fedex']),
    });

    const ref = registry.register({ name: 'OrderShipped', schema: OrderShipped });

    assert.equal(ref, '#/components/schemas/OrderShipped');
    const registered = registry.getSchemas().OrderShipped;
    assert.equal(registered.type, 'object');
    assert.deepEqual(registered.required, ['orderId', 'carrier']);
    assert.equal(
      registered.$schema,
      'http://json-schema.org/draft-07/schema#',
      'the conversion targets the draft-07 dialect AsyncAPI 3.0 defaults to',
    );
    assert.ok(
      !('def' in registered) && !('safeParse' in registered),
      'the registered schema is plain JSON Schema, not the Zod instance',
    );
    assert.ok(
      !JSON.stringify(registered).includes('~standard'),
      'the registered schema serializes without Zod markers',
    );
  });

  it('reuses the lazily loaded Zod converter across registrations', () => {
    const registry = new AsyncApiSchemaRegistry();

    registry.register({ name: 'First', schema: z.object({ a: z.string() }) });
    registry.register({ name: 'Second', schema: z.object({ b: z.number() }) });

    assert.deepEqual(Object.keys(registry.getSchemas()), ['First', 'Second']);
  });

  it('registers a marker-carrying value without a validator surface verbatim', () => {
    // Zod 4.4+ tags the JSON Schema emitted by z.toJSONSchema() with its own
    // (non-enumerable) `~standard` marker. Only a value that also quacks like
    // a live schema — `def` plus a `safeParse` function — is converted; this
    // one lacks `safeParse`, so it is trusted as pre-computed JSON Schema.
    const registry = new AsyncApiSchemaRegistry();
    const taggedJson = {
      '~standard': { vendor: 'zod', version: 1 },
      def: {},
      type: 'object',
    };

    const ref = registry.register({ name: 'Tagged', schema: taggedJson });

    assert.equal(ref, '#/components/schemas/Tagged');
    assert.equal(registry.getSchemas().Tagged, taggedJson);
  });

  it('rejects a non-Zod Standard Schema with a pointer to the escape hatch', () => {
    const registry = new AsyncApiSchemaRegistry();
    const foreign = { '~standard': { vendor: 'valibot', version: 1 } };

    assert.throws(
      () => registry.register({ name: 'Foreign', schema: foreign }),
      /vendor "valibot", but only Zod schemas are converted natively/,
    );
    assert.deepEqual(Object.keys(registry.getSchemas()), []);
  });

  it('generates JSON Schema from a DTO class via the swagger chain', () => {
    class Address {
      @ApiProperty()
      city!: string;
    }

    class OrderPlaced {
      @ApiProperty()
      id!: string;

      @ApiProperty({ minimum: 0 })
      amount!: number;

      @ApiProperty({ type: () => Address })
      address!: Address;
    }

    const registry = new AsyncApiSchemaRegistry();

    const ref = registry.register(OrderPlaced);

    assert.equal(ref, '#/components/schemas/OrderPlaced');
    const schemas = registry.getSchemas();
    assert.ok(schemas.OrderPlaced);
    assert.ok(schemas.Address, 'nested DTOs are registered too');
    const placed = schemas.OrderPlaced as Record<string, unknown>;
    const properties = placed.properties as Record<string, unknown>;
    assert.deepEqual(properties.address, {
      $ref: '#/components/schemas/Address',
    });
  });

  it('registers a DTO that has no nested models once under its name', () => {
    class Ping {
      @ApiProperty()
      at!: string;
    }

    const registry = new AsyncApiSchemaRegistry();
    const ref = registry.register(Ping);

    assert.equal(ref, '#/components/schemas/Ping');
    assert.deepEqual(Object.keys(registry.getSchemas()), ['Ping']);
  });

  it('caches a DTO class so it is converted only once', () => {
    class Cached {
      @ApiProperty()
      value!: string;
    }

    const registry = new AsyncApiSchemaRegistry();
    const first = registry.register(Cached);
    const second = registry.register(Cached);

    assert.equal(first, second);
    assert.deepEqual(Object.keys(registry.getSchemas()), ['Cached']);
  });

  it('tolerates re-registering an identical schema under the same name', () => {
    const registry = new AsyncApiSchemaRegistry();
    const schema = { type: 'object' as const };

    registry.register({ name: 'Same', schema });

    assert.doesNotThrow(() => registry.register({ name: 'Same', schema }));
    assert.deepEqual(Object.keys(registry.getSchemas()), ['Same']);
  });

  it('throws when two different schemas share a name', () => {
    const registry = new AsyncApiSchemaRegistry();
    registry.register({ name: 'Clash', schema: { type: 'object' } });

    assert.throws(
      () => registry.register({ name: 'Clash', schema: { type: 'string' } }),
      /Conflicting AsyncAPI schema registered for "Clash"/,
    );
  });

  it('throws an actionable error when @nestjs/swagger is unavailable', () => {
    class Orphan {
      @ApiProperty()
      id!: string;
    }

    const registry = new AsyncApiSchemaRegistry();
    const loader = Module as unknown as {
      _load(request: string, parent: unknown, isMain: boolean): unknown;
    };
    const originalLoad = loader._load;

    loader._load = function patchedLoad(
      request: string,
      parent: unknown,
      isMain: boolean,
    ): unknown {
      if (request === '@nestjs/swagger') {
        throw new Error('Cannot find module "@nestjs/swagger"');
      }
      return originalLoad.call(this, request, parent, isMain);
    };

    try {
      assert.throws(
        () => registry.register(Orphan),
        /requires the optional peer dependency "@nestjs\/swagger"/,
      );
    } finally {
      loader._load = originalLoad;
    }
  });

  it('throws an actionable error when zod is unavailable', () => {
    const registry = new AsyncApiSchemaRegistry();
    const source = { name: 'Uninstalled', schema: z.object({ id: z.string() }) };

    withPatchedZodModule(
      () => {
        throw new Error('Cannot find module "zod"');
      },
      () => {
        assert.throws(
          () => registry.register(source),
          /requires the optional peer dependency "zod" version 4 or newer/,
        );
      },
    );
  });

  it('throws an actionable error when the installed zod lacks z.toJSONSchema()', () => {
    const registry = new AsyncApiSchemaRegistry();
    const source = { name: 'TooOld', schema: z.object({ id: z.string() }) };

    // A zod major before 4 exposes `z` without the native `toJSONSchema`.
    withPatchedZodModule(
      () => ({ z: {} }),
      () => {
        assert.throws(
          () => registry.register(source),
          /requires the optional peer dependency "zod" version 4 or newer/,
        );
      },
    );
  });
});

/**
 * Run `test` while `require('zod')` inside the package resolves to whatever
 * `resolve` returns (or throws), restoring the real module loader afterwards.
 */
function withPatchedZodModule(resolve: () => unknown, test: () => void): void {
  const loader = Module as unknown as {
    _load(request: string, parent: unknown, isMain: boolean): unknown;
  };
  const originalLoad = loader._load;

  loader._load = function patchedLoad(
    request: string,
    parent: unknown,
    isMain: boolean,
  ): unknown {
    if (request === 'zod') {
      return resolve();
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    test();
  } finally {
    loader._load = originalLoad;
  }
}
