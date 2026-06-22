import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import 'reflect-metadata';
import { ApiProperty } from '@nestjs/swagger';
import { Parser } from '@asyncapi/parser';
import { z } from 'zod';
import {
  AsyncApiChannel,
  AsyncApiChannelBindings,
  AsyncApiHeaders,
  AsyncApiMessage,
  AsyncApiMessageBindings,
  AsyncApiOperationBindings,
  AsyncApiPub,
  AsyncApiServer,
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
      orderId: z.uuid(),
      carrier: z.enum(['ups', 'fedex']),
    });
    const schema = z.toJSONSchema(OrderShipped, {
      target: 'draft-7',
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

  it('validates Kafka servers, channel, operation, and message bindings', async () => {
    @AsyncApiServer('production', 'broker.example.com:9092', 'kafka', {
      title: 'Production Kafka',
      bindings: {
        kafka: {
          schemaRegistryUrl: 'https://registry.example.com',
          schemaRegistryVendor: 'confluent',
          bindingVersion: '0.5.0',
        },
      },
    })
    @AsyncApiChannel('orders', { address: 'orders.v1' })
    @AsyncApiChannelBindings({
      kafka: { topic: 'orders.v1', partitions: 3, replicas: 3, bindingVersion: '0.5.0' },
    })
    class OrdersChannel {
      @AsyncApiPub({ operationId: 'publishOrderPlaced' })
      @AsyncApiMessage({ name: 'OrderPlaced', schema: { type: 'object' } })
      @AsyncApiOperationBindings({
        kafka: { groupId: { type: 'string' }, bindingVersion: '0.5.0' },
      })
      @AsyncApiMessageBindings({
        kafka: { schemaIdLocation: 'payload', bindingVersion: '0.5.0' },
      })
      publishOrderPlaced(): void {}
    }

    const document = buildAsyncApiDocument(
      { title: 'Orders Service', version: '1.0.0' },
      [{ metatype: OrdersChannel, methodNames: ['publishOrderPlaced'] }],
    );

    assert.deepEqual(await validate(document), []);
  });

  it('validates an AMQP channel and operation binding', async () => {
    @AsyncApiServer('rabbit', 'rabbit.example.com:5672', 'amqp')
    @AsyncApiChannel('invoices', { address: 'invoices' })
    @AsyncApiChannelBindings({
      amqp: {
        is: 'routingKey',
        exchange: { name: 'invoices', type: 'topic', durable: true },
        bindingVersion: '0.3.0',
      },
    })
    class InvoicesChannel {
      @AsyncApiSub({ operationId: 'onInvoice' })
      @AsyncApiMessage({ name: 'Invoice', schema: { type: 'object' } })
      @AsyncApiOperationBindings({
        amqp: { deliveryMode: 2, mandatory: true, bindingVersion: '0.3.0' },
      })
      @AsyncApiMessageBindings({
        amqp: { contentEncoding: 'gzip', messageType: 'invoice', bindingVersion: '0.3.0' },
      })
      onInvoice(): void {}
    }

    const document = buildAsyncApiDocument(
      { title: 'Invoices Service', version: '1.0.0' },
      [{ metatype: InvoicesChannel, methodNames: ['onInvoice'] }],
    );

    assert.deepEqual(await validate(document), []);
  });

  it('validates NATS and MQTT operation bindings', async () => {
    @AsyncApiServer('mqtt', 'broker.example.com:1883', 'mqtt', {
      bindings: { mqtt: { clientId: 'orders-service', bindingVersion: '0.2.0' } },
    })
    @AsyncApiChannel('telemetry', { address: 'telemetry' })
    class TelemetryChannel {
      @AsyncApiSub({ operationId: 'onTelemetryNats' })
      @AsyncApiOperationBindings({
        nats: { queue: 'telemetry-workers', bindingVersion: '0.1.0' },
      })
      onTelemetryNats(): void {}

      @AsyncApiSub({ operationId: 'onTelemetryMqtt' })
      @AsyncApiMessage({ name: 'Telemetry', schema: { type: 'object' } })
      @AsyncApiOperationBindings({
        mqtt: { qos: 1, retain: false, bindingVersion: '0.2.0' },
      })
      @AsyncApiMessageBindings({
        mqtt: { payloadFormatIndicator: 1, bindingVersion: '0.2.0' },
      })
      onTelemetryMqtt(): void {}
    }

    const document = buildAsyncApiDocument(
      { title: 'Telemetry Service', version: '1.0.0' },
      [
        {
          metatype: TelemetryChannel,
          methodNames: ['onTelemetryNats', 'onTelemetryMqtt'],
        },
      ],
    );

    assert.deepEqual(await validate(document), []);
  });
});
