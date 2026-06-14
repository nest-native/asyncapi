import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import 'reflect-metadata';
import { Controller, Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApiProperty } from '@nestjs/swagger';
import { ASYNC_API_VERSION } from '../document';
import {
  buildAsyncApiDocument,
  DEFAULT_DOCUMENT_TITLE,
  DEFAULT_DOCUMENT_VERSION,
  getAsyncApiDocument,
} from '../generator';
import { AsyncApiModule } from '../asyncapi.module';
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
import { ScannedHandler } from '../scanner';

@Injectable()
class OrdersService {
  emit(): void {}
}

@Controller()
class OrdersController {
  handle(): void {}
}

describe('buildAsyncApiDocument', () => {
  it('emits an empty valid AsyncAPI 3.0 document with defaults', () => {
    const document = buildAsyncApiDocument({}, []);

    assert.deepEqual(document, {
      asyncapi: ASYNC_API_VERSION,
      info: {
        title: DEFAULT_DOCUMENT_TITLE,
        version: DEFAULT_DOCUMENT_VERSION,
      },
      channels: {},
      operations: {},
      components: {},
    });
  });

  it('targets AsyncAPI specification version 3.0.0', () => {
    assert.equal(ASYNC_API_VERSION, '3.0.0');
    assert.equal(buildAsyncApiDocument({}, []).asyncapi, '3.0.0');
  });

  it('copies through every supplied info field', () => {
    const document = buildAsyncApiDocument(
      {
        title: 'Orders API',
        version: '2.3.4',
        description: 'Order lifecycle events',
        termsOfService: 'https://example.com/tos',
        contact: { name: 'Platform', email: 'platform@example.com' },
        license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
      },
      [],
    );

    assert.deepEqual(document.info, {
      title: 'Orders API',
      version: '2.3.4',
      description: 'Order lifecycle events',
      termsOfService: 'https://example.com/tos',
      contact: { name: 'Platform', email: 'platform@example.com' },
      license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
    });
  });

  it('omits optional info fields that are not provided', () => {
    const document = buildAsyncApiDocument({ title: 'Only Title' }, []);

    assert.deepEqual(document.info, {
      title: 'Only Title',
      version: DEFAULT_DOCUMENT_VERSION,
    });
    assert.ok(!('description' in document.info));
    assert.ok(!('termsOfService' in document.info));
    assert.ok(!('contact' in document.info));
    assert.ok(!('license' in document.info));
  });

  it('skips handlers without an @AsyncApiChannel decorator', () => {
    const handlers: ScannedHandler[] = [
      { metatype: OrdersService, methodNames: ['emit'] },
    ];

    const document = buildAsyncApiDocument({}, handlers);

    assert.deepEqual(document.channels, {});
    assert.deepEqual(document.operations, {});
  });

  it('emits a channel and its operations from decorator metadata', () => {
    @AsyncApiChannel('orders', {
      address: 'orders.v1',
      title: 'Orders',
      summary: 'Order lifecycle',
      description: 'Where order events flow',
    })
    class OrdersChannel {
      @AsyncApiPub({
        operationId: 'orderPlaced',
        title: 'Order placed',
        summary: 'Emitted on placement',
        description: 'Sent when a customer places an order',
      })
      placeOrder(): void {}

      @AsyncApiSub({ operationId: 'onOrderShipped' })
      handleShipped(): void {}

      untouched(): void {}
    }

    const document = buildAsyncApiDocument({}, [
      {
        metatype: OrdersChannel,
        methodNames: ['placeOrder', 'handleShipped', 'untouched'],
      },
    ]);

    assert.deepEqual(document.channels, {
      orders: {
        address: 'orders.v1',
        title: 'Orders',
        summary: 'Order lifecycle',
        description: 'Where order events flow',
      },
    });
    assert.deepEqual(document.operations, {
      orderPlaced: {
        action: 'send',
        channel: { $ref: '#/channels/orders' },
        title: 'Order placed',
        summary: 'Emitted on placement',
        description: 'Sent when a customer places an order',
      },
      onOrderShipped: {
        action: 'receive',
        channel: { $ref: '#/channels/orders' },
      },
    });
  });

  it('defaults the channel address to the channel id', () => {
    @AsyncApiChannel('payments')
    class PaymentsChannel {}

    const document = buildAsyncApiDocument({}, [
      { metatype: PaymentsChannel, methodNames: [] },
    ]);

    assert.deepEqual(document.channels.payments, { address: 'payments' });
  });

  it('preserves an explicit null channel address', () => {
    @AsyncApiChannel('dynamic', { address: null })
    class DynamicChannel {}

    const document = buildAsyncApiDocument({}, [
      { metatype: DynamicChannel, methodNames: [] },
    ]);

    assert.equal(document.channels.dynamic.address, null);
  });

  it('defaults the operation id to the method name', () => {
    @AsyncApiChannel('orders')
    class OrdersChannel {
      @AsyncApiPub()
      placeOrder(): void {}
    }

    const document = buildAsyncApiDocument({}, [
      { metatype: OrdersChannel, methodNames: ['placeOrder'] },
    ]);

    assert.deepEqual(document.operations.placeOrder, {
      action: 'send',
      channel: { $ref: '#/channels/orders' },
    });
  });

  it('ignores method names that are not callable prototype members', () => {
    @AsyncApiChannel('orders')
    class OrdersChannel {
      @AsyncApiPub()
      placeOrder(): void {}
    }

    const document = buildAsyncApiDocument({}, [
      {
        metatype: OrdersChannel,
        // 'missing' is not a real method on the prototype.
        methodNames: ['placeOrder', 'missing'],
      },
    ]);

    assert.deepEqual(Object.keys(document.operations), ['placeOrder']);
  });

  it('throws on a duplicate channel id across handlers', () => {
    @AsyncApiChannel('orders')
    class FirstOrders {}

    @AsyncApiChannel('orders')
    class SecondOrders {}

    assert.throws(
      () =>
        buildAsyncApiDocument({}, [
          { metatype: FirstOrders, methodNames: [] },
          { metatype: SecondOrders, methodNames: [] },
        ]),
      /Duplicate AsyncAPI channel id "orders" produced by SecondOrders/,
    );
  });

  it('throws on a duplicate operation id across handlers', () => {
    @AsyncApiChannel('orders')
    class OrdersChannel {
      @AsyncApiPub({ operationId: 'shared' })
      placeOrder(): void {}
    }

    @AsyncApiChannel('shipments')
    class ShipmentsChannel {
      @AsyncApiSub({ operationId: 'shared' })
      handleShipped(): void {}
    }

    assert.throws(
      () =>
        buildAsyncApiDocument({}, [
          { metatype: OrdersChannel, methodNames: ['placeOrder'] },
          { metatype: ShipmentsChannel, methodNames: ['handleShipped'] },
        ]),
      /Duplicate AsyncAPI operation id "shared" produced by ShipmentsChannel\.handleShipped/,
    );
  });
});

describe('buildAsyncApiDocument message integration', () => {
  it('wires a DTO payload and headers into messages and schemas', () => {
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

    @AsyncApiChannel('orders', { address: 'orders.v1' })
    class OrdersChannel {
      @AsyncApiPub({ operationId: 'orderPlaced' })
      @AsyncApiMessage(OrderPlaced, { summary: 'A customer placed an order' })
      @AsyncApiHeaders(OrderHeaders)
      placeOrder(): void {}
    }

    const document = buildAsyncApiDocument({}, [
      { metatype: OrdersChannel, methodNames: ['placeOrder'] },
    ]);

    assert.deepEqual(document.channels.orders.messages, {
      OrderPlaced: { $ref: '#/components/messages/OrderPlaced' },
    });
    assert.deepEqual(document.operations.orderPlaced.messages, [
      { $ref: '#/channels/orders/messages/OrderPlaced' },
    ]);
    assert.deepEqual(document.components.messages?.OrderPlaced, {
      name: 'OrderPlaced',
      contentType: 'application/json',
      summary: 'A customer placed an order',
      payload: { $ref: '#/components/schemas/OrderPlaced' },
      headers: { $ref: '#/components/schemas/OrderHeaders' },
    });
    assert.ok(document.components.schemas?.OrderPlaced);
    assert.ok(document.components.schemas?.OrderHeaders);
  });

  it('copies through every supplied message field and a custom content type', () => {
    class Event {
      @ApiProperty()
      id!: string;
    }

    @AsyncApiChannel('events')
    class EventsChannel {
      @AsyncApiSub()
      @AsyncApiMessage(Event, {
        name: 'DomainEvent',
        title: 'Domain event',
        summary: 'Something happened',
        description: 'A verbose domain event description',
        contentType: 'application/cloudevents+json',
      })
      onEvent(): void {}
    }

    const document = buildAsyncApiDocument({}, [
      { metatype: EventsChannel, methodNames: ['onEvent'] },
    ]);

    assert.deepEqual(document.components.messages?.DomainEvent, {
      name: 'DomainEvent',
      title: 'Domain event',
      summary: 'Something happened',
      description: 'A verbose domain event description',
      contentType: 'application/cloudevents+json',
      payload: { $ref: '#/components/schemas/Event' },
    });
    assert.deepEqual(document.channels.events.messages, {
      DomainEvent: { $ref: '#/components/messages/DomainEvent' },
    });
  });

  it('accepts a pre-computed JSON Schema payload (the Zod path)', () => {
    @AsyncApiChannel('shipments')
    class ShipmentsChannel {
      @AsyncApiSub({ operationId: 'onShipped' })
      @AsyncApiMessage({
        name: 'OrderShipped',
        schema: {
          type: 'object',
          properties: { orderId: { type: 'string' } },
          required: ['orderId'],
        },
      })
      onShipped(): void {}
    }

    const document = buildAsyncApiDocument({}, [
      { metatype: ShipmentsChannel, methodNames: ['onShipped'] },
    ]);

    assert.deepEqual(document.components.schemas?.OrderShipped, {
      type: 'object',
      properties: { orderId: { type: 'string' } },
      required: ['orderId'],
    });
    assert.equal(
      document.components.messages?.OrderShipped.payload?.$ref,
      '#/components/schemas/OrderShipped',
    );
    assert.ok(!('headers' in (document.components.messages?.OrderShipped ?? {})));
  });

  it('omits the components sub-sections when no message is declared', () => {
    @AsyncApiChannel('plain')
    class PlainChannel {
      @AsyncApiPub()
      emit(): void {}
    }

    const document = buildAsyncApiDocument({}, [
      { metatype: PlainChannel, methodNames: ['emit'] },
    ]);

    assert.deepEqual(document.components, {});
    assert.ok(!('messages' in document.channels.plain));
    assert.ok(!('messages' in document.operations.emit));
  });

  it('reuses a shared payload DTO across messages without duplicating it', () => {
    class Shared {
      @ApiProperty()
      id!: string;
    }

    @AsyncApiChannel('a')
    class ChannelA {
      @AsyncApiPub({ operationId: 'aOp' })
      @AsyncApiMessage(Shared, { name: 'SharedA' })
      a(): void {}
    }

    @AsyncApiChannel('b')
    class ChannelB {
      @AsyncApiSub({ operationId: 'bOp' })
      @AsyncApiMessage(Shared, { name: 'SharedB' })
      b(): void {}
    }

    const document = buildAsyncApiDocument({}, [
      { metatype: ChannelA, methodNames: ['a'] },
      { metatype: ChannelB, methodNames: ['b'] },
    ]);

    assert.deepEqual(Object.keys(document.components.schemas ?? {}), ['Shared']);
    assert.equal(
      document.components.messages?.SharedA.payload?.$ref,
      '#/components/schemas/Shared',
    );
    assert.equal(
      document.components.messages?.SharedB.payload?.$ref,
      '#/components/schemas/Shared',
    );
  });

  it('throws when two handlers register a conflicting message name', () => {
    // The two messages share the message name "Clash" but carry distinct payload
    // schemas (different schema names), so the schema registry accepts both and
    // the conflict surfaces at the message level instead.
    @AsyncApiChannel('one')
    class ChannelOne {
      @AsyncApiPub({ operationId: 'oneOp' })
      @AsyncApiMessage(
        { name: 'PayloadOne', schema: { type: 'object' } },
        { name: 'Clash', summary: 'first' },
      )
      one(): void {}
    }

    @AsyncApiChannel('two')
    class ChannelTwo {
      @AsyncApiSub({ operationId: 'twoOp' })
      @AsyncApiMessage(
        { name: 'PayloadTwo', schema: { type: 'string' } },
        { name: 'Clash', summary: 'second' },
      )
      two(): void {}
    }

    assert.throws(
      () =>
        buildAsyncApiDocument({}, [
          { metatype: ChannelOne, methodNames: ['one'] },
          { metatype: ChannelTwo, methodNames: ['two'] },
        ]),
      /Conflicting AsyncAPI message named "Clash" produced by ChannelTwo\.two/,
    );
  });

  it('tolerates re-declaring an identical message name', () => {
    const schema = { type: 'object' as const };

    @AsyncApiChannel('alpha')
    class Alpha {
      @AsyncApiPub({ operationId: 'alphaOp' })
      @AsyncApiMessage({ name: 'Same', schema })
      alpha(): void {}
    }

    @AsyncApiChannel('beta')
    class Beta {
      @AsyncApiSub({ operationId: 'betaOp' })
      @AsyncApiMessage({ name: 'Same', schema })
      beta(): void {}
    }

    assert.doesNotThrow(() =>
      buildAsyncApiDocument({}, [
        { metatype: Alpha, methodNames: ['alpha'] },
        { metatype: Beta, methodNames: ['beta'] },
      ]),
    );
  });

  it('does not attach a message to an operation without @AsyncApiMessage', () => {
    @AsyncApiChannel('mixed')
    class MixedChannel {
      @AsyncApiPub({ operationId: 'withMessage' })
      @AsyncApiMessage({ name: 'WithMessage', schema: { type: 'object' } })
      withMessage(): void {}

      @AsyncApiSub({ operationId: 'withoutMessage' })
      withoutMessage(): void {}
    }

    const document = buildAsyncApiDocument({}, [
      { metatype: MixedChannel, methodNames: ['withMessage', 'withoutMessage'] },
    ]);

    assert.ok(document.operations.withMessage.messages);
    assert.ok(!('messages' in document.operations.withoutMessage));
    assert.deepEqual(Object.keys(document.channels.mixed.messages ?? {}), [
      'WithMessage',
    ]);
  });
});

describe('buildAsyncApiDocument transport bindings', () => {
  it('attaches channel bindings from @AsyncApiChannelBindings', () => {
    @AsyncApiChannel('orders', { address: 'orders' })
    @AsyncApiChannelBindings({
      kafka: { topic: 'orders', partitions: 3, bindingVersion: '0.5.0' },
    })
    class OrdersChannel {}

    const document = buildAsyncApiDocument({}, [
      { metatype: OrdersChannel, methodNames: [] },
    ]);

    assert.deepEqual(document.channels.orders.bindings, {
      kafka: { topic: 'orders', partitions: 3, bindingVersion: '0.5.0' },
    });
  });

  it('omits channel bindings when none are declared', () => {
    @AsyncApiChannel('orders')
    class OrdersChannel {}

    const document = buildAsyncApiDocument({}, [
      { metatype: OrdersChannel, methodNames: [] },
    ]);

    assert.ok(!('bindings' in document.channels.orders));
  });

  it('attaches operation bindings from @AsyncApiOperationBindings', () => {
    @AsyncApiChannel('orders')
    class OrdersChannel {
      @AsyncApiPub({ operationId: 'placeOrder' })
      @AsyncApiOperationBindings({
        kafka: { groupId: { type: 'string' }, bindingVersion: '0.5.0' },
      })
      placeOrder(): void {}
    }

    const document = buildAsyncApiDocument({}, [
      { metatype: OrdersChannel, methodNames: ['placeOrder'] },
    ]);

    assert.deepEqual(document.operations.placeOrder.bindings, {
      kafka: { groupId: { type: 'string' }, bindingVersion: '0.5.0' },
    });
  });

  it('omits operation bindings when none are declared', () => {
    @AsyncApiChannel('orders')
    class OrdersChannel {
      @AsyncApiPub({ operationId: 'placeOrder' })
      placeOrder(): void {}
    }

    const document = buildAsyncApiDocument({}, [
      { metatype: OrdersChannel, methodNames: ['placeOrder'] },
    ]);

    assert.ok(!('bindings' in document.operations.placeOrder));
  });

  it('attaches message bindings from @AsyncApiMessageBindings', () => {
    @AsyncApiChannel('orders')
    class OrdersChannel {
      @AsyncApiPub({ operationId: 'placeOrder' })
      @AsyncApiMessage({ name: 'OrderPlaced', schema: { type: 'object' } })
      @AsyncApiMessageBindings({
        amqp: { contentEncoding: 'gzip', bindingVersion: '0.3.0' },
      })
      placeOrder(): void {}
    }

    const document = buildAsyncApiDocument({}, [
      { metatype: OrdersChannel, methodNames: ['placeOrder'] },
    ]);

    assert.deepEqual(document.components.messages?.OrderPlaced.bindings, {
      amqp: { contentEncoding: 'gzip', bindingVersion: '0.3.0' },
    });
  });

  it('omits message bindings when none are declared', () => {
    @AsyncApiChannel('orders')
    class OrdersChannel {
      @AsyncApiPub({ operationId: 'placeOrder' })
      @AsyncApiMessage({ name: 'OrderPlaced', schema: { type: 'object' } })
      placeOrder(): void {}
    }

    const document = buildAsyncApiDocument({}, [
      { metatype: OrdersChannel, methodNames: ['placeOrder'] },
    ]);

    assert.ok(!('bindings' in (document.components.messages?.OrderPlaced ?? {})));
  });
});

describe('buildAsyncApiDocument servers', () => {
  it('omits the servers section when no server is declared', () => {
    @AsyncApiChannel('orders')
    class OrdersChannel {}

    const document = buildAsyncApiDocument({}, [
      { metatype: OrdersChannel, methodNames: [] },
    ]);

    assert.ok(!('servers' in document));
  });

  it('emits a server from a single @AsyncApiServer declaration', () => {
    @AsyncApiServer('production', 'broker:9092', 'kafka', {
      title: 'Production Kafka',
      bindings: { kafka: { schemaRegistryVendor: 'confluent' } },
    })
    @AsyncApiChannel('orders')
    class OrdersChannel {}

    const document = buildAsyncApiDocument({}, [
      { metatype: OrdersChannel, methodNames: [] },
    ]);

    assert.deepEqual(document.servers, {
      production: {
        host: 'broker:9092',
        protocol: 'kafka',
        title: 'Production Kafka',
        bindings: { kafka: { schemaRegistryVendor: 'confluent' } },
      },
    });
  });

  it('copies through every supplied server field', () => {
    @AsyncApiServer('full', 'host:1', 'mqtt', {
      protocolVersion: '5',
      pathname: '/p',
      title: 'T',
      summary: 'S',
      description: 'D',
    })
    class Handler {}

    const document = buildAsyncApiDocument({}, [
      { metatype: Handler, methodNames: [] },
    ]);

    assert.deepEqual(document.servers?.full, {
      host: 'host:1',
      protocol: 'mqtt',
      protocolVersion: '5',
      pathname: '/p',
      title: 'T',
      summary: 'S',
      description: 'D',
    });
  });

  it('collects servers from a class that declares no channel', () => {
    @AsyncApiServer('nats', 'nats://localhost:4222', 'nats')
    class Servers {}

    const document = buildAsyncApiDocument({}, [
      { metatype: Servers, methodNames: [] },
    ]);

    assert.deepEqual(document.servers, {
      nats: { host: 'nats://localhost:4222', protocol: 'nats' },
    });
    assert.deepEqual(document.channels, {});
  });

  it('merges several server declarations across classes', () => {
    @AsyncApiServer('kafka', 'broker:9092', 'kafka')
    class KafkaServers {}

    @AsyncApiServer('mqtt', 'localhost:1883', 'mqtt')
    class MqttServers {}

    const document = buildAsyncApiDocument({}, [
      { metatype: KafkaServers, methodNames: [] },
      { metatype: MqttServers, methodNames: [] },
    ]);

    assert.deepEqual(Object.keys(document.servers ?? {}).sort(), [
      'kafka',
      'mqtt',
    ]);
  });

  it('tolerates re-declaring an identical server across classes', () => {
    @AsyncApiServer('shared', 'broker:9092', 'kafka', { title: 'Shared' })
    class First {}

    @AsyncApiServer('shared', 'broker:9092', 'kafka', { title: 'Shared' })
    class Second {}

    assert.doesNotThrow(() =>
      buildAsyncApiDocument({}, [
        { metatype: First, methodNames: [] },
        { metatype: Second, methodNames: [] },
      ]),
    );
  });

  it('throws when two classes register a conflicting server name', () => {
    @AsyncApiServer('shared', 'broker:9092', 'kafka')
    class First {}

    @AsyncApiServer('shared', 'other:9092', 'kafka')
    class Second {}

    assert.throws(
      () =>
        buildAsyncApiDocument({}, [
          { metatype: First, methodNames: [] },
          { metatype: Second, methodNames: [] },
        ]),
      /Conflicting AsyncAPI server named "shared" produced by Second/,
    );
  });
});

describe('getAsyncApiDocument', () => {
  it('walks a running application and emits an empty valid document', async () => {
    const app = await Test.createTestingModule({
      imports: [AsyncApiModule.forRoot({ defaultInfo: { title: 'Orders' } })],
      controllers: [OrdersController],
      providers: [OrdersService],
    }).compile();
    await app.init();

    try {
      const document = getAsyncApiDocument(app, {
        title: 'Orders API',
        version: '1.2.3',
      });

      assert.equal(document.asyncapi, ASYNC_API_VERSION);
      assert.equal(document.info.title, 'Orders API');
      assert.equal(document.info.version, '1.2.3');
      assert.deepEqual(document.channels, {});
      assert.deepEqual(document.operations, {});
      assert.deepEqual(document.components, {});
    } finally {
      await app.close();
    }
  });

  it('defaults the document config when none is supplied', async () => {
    const app = await Test.createTestingModule({
      providers: [OrdersService],
    }).compile();
    await app.init();

    try {
      const document = getAsyncApiDocument(app);

      assert.equal(document.info.title, DEFAULT_DOCUMENT_TITLE);
      assert.equal(document.info.version, DEFAULT_DOCUMENT_VERSION);
    } finally {
      await app.close();
    }
  });

  it('discovers a decorated channel handler from a running application', async () => {
    @Controller()
    @AsyncApiChannel('user-signup', {
      address: 'user.signup',
      title: 'User signup',
    })
    class SignupChannel {
      @AsyncApiPub({ operationId: 'userSignedUp' })
      onSignup(): void {}
    }

    const app = await Test.createTestingModule({
      imports: [AsyncApiModule.forRoot()],
      controllers: [SignupChannel],
    }).compile();
    await app.init();

    try {
      const document = getAsyncApiDocument(app, { title: 'Signup API' });

      assert.deepEqual(document.channels, {
        'user-signup': { address: 'user.signup', title: 'User signup' },
      });
      assert.deepEqual(document.operations, {
        userSignedUp: {
          action: 'send',
          channel: { $ref: '#/channels/user-signup' },
        },
      });
    } finally {
      await app.close();
    }
  });
});
