import assert from 'node:assert/strict';
import Module from 'node:module';
import { describe, it } from 'node:test';
import 'reflect-metadata';
import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
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

  it('accepts a Zod schema converted with zod-to-json-schema', () => {
    const registry = new AsyncApiSchemaRegistry();
    const OrderShipped = z.object({
      orderId: z.string().uuid(),
      carrier: z.enum(['ups', 'fedex']),
    });
    const schema = zodToJsonSchema(OrderShipped, {
      $refStrategy: 'none',
      target: 'jsonSchema7',
    });

    const ref = registry.register({ name: 'OrderShipped', schema });

    assert.equal(ref, '#/components/schemas/OrderShipped');
    const registered = registry.getSchemas().OrderShipped as Record<
      string,
      unknown
    >;
    assert.equal(registered.type, 'object');
    assert.deepEqual(registered.required, ['orderId', 'carrier']);
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
});
