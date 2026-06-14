import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import 'reflect-metadata';
import { Controller, Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ASYNC_API_VERSION } from '../document';
import {
  buildAsyncApiDocument,
  DEFAULT_DOCUMENT_TITLE,
  DEFAULT_DOCUMENT_VERSION,
  getAsyncApiDocument,
} from '../generator';
import { AsyncApiModule } from '../asyncapi.module';
import { AsyncApiChannel, AsyncApiPub, AsyncApiSub } from '../decorators';
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
