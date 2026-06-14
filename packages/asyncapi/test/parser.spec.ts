import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import 'reflect-metadata';
import { ApiProperty } from '@nestjs/swagger';
import { Parser } from '@asyncapi/parser';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  AsyncApiChannel,
  AsyncApiHeaders,
  AsyncApiMessage,
  AsyncApiPub,
  AsyncApiSub,
} from '../decorators';
import { buildAsyncApiDocument } from '../generator';
import { AsyncApiSchemaObject } from '../document';

const parser = new Parser();

/**
 * Parse a generated document and return the parser's error diagnostics. An empty
 * array means the document is a valid AsyncAPI 3.0 spec.
 */
async function validate(document: unknown): Promise<string[]> {
  const { diagnostics } = await parser.parse(
    JSON.parse(JSON.stringify(document)),
  );
  return diagnostics
    .filter((diagnostic) => diagnostic.severity === 0)
    .map((diagnostic) => diagnostic.message);
}

describe('@asyncapi/parser validation', () => {
  it('validates an empty document', async () => {
    const document = buildAsyncApiDocument(
      { title: 'Empty', version: '1.0.0' },
      [],
    );

    assert.deepEqual(await validate(document), []);
  });

  it('validates a document generated from class-validator DTOs', async () => {
    class OrderHeaders {
      @ApiProperty()
      traceId!: string;
    }

    class OrderPlaced {
      @ApiProperty()
      id!: string;

      @ApiProperty({ minimum: 0 })
      amount!: number;
    }

    @AsyncApiChannel('orders', { address: 'orders.v1', title: 'Orders' })
    class OrdersChannel {
      @AsyncApiPub({ operationId: 'publishOrderPlaced' })
      @AsyncApiMessage(OrderPlaced, { summary: 'An order was placed' })
      @AsyncApiHeaders(OrderHeaders)
      publishOrderPlaced(): void {}
    }

    const document = buildAsyncApiDocument(
      { title: 'Orders Service', version: '1.0.0' },
      [{ metatype: OrdersChannel, methodNames: ['publishOrderPlaced'] }],
    );

    assert.deepEqual(await validate(document), []);
  });

  it('validates a document generated from a Zod payload', async () => {
    const OrderShipped = z.object({
      orderId: z.string().uuid(),
      carrier: z.enum(['ups', 'fedex']),
    });
    const schema = zodToJsonSchema(OrderShipped, {
      $refStrategy: 'none',
      target: 'jsonSchema7',
    }) as AsyncApiSchemaObject;

    @AsyncApiChannel('shipments', { address: 'shipments.v1' })
    class ShipmentsChannel {
      @AsyncApiSub({ operationId: 'onOrderShipped' })
      @AsyncApiMessage({ name: 'OrderShipped', schema })
      onOrderShipped(): void {}
    }

    const document = buildAsyncApiDocument(
      { title: 'Shipments Service', version: '1.0.0' },
      [{ metatype: ShipmentsChannel, methodNames: ['onOrderShipped'] }],
    );

    assert.deepEqual(await validate(document), []);
  });
});
