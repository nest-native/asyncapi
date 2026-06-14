import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import 'reflect-metadata';
import {
  ASYNC_API_CHANNEL_METADATA,
  ASYNC_API_HEADERS_METADATA,
  ASYNC_API_MESSAGE_METADATA,
  ASYNC_API_OPERATION_METADATA,
  AsyncApiAction,
} from '../constants';
import {
  AsyncApiChannel,
  AsyncApiChannelMetadata,
  AsyncApiHeaders,
  AsyncApiHeadersMetadata,
  AsyncApiMessage,
  AsyncApiMessageMetadata,
  AsyncApiOperationMetadata,
  AsyncApiPub,
  AsyncApiSub,
} from '../decorators';

function readChannel(target: object): AsyncApiChannelMetadata | undefined {
  return Reflect.getMetadata(ASYNC_API_CHANNEL_METADATA, target) as
    | AsyncApiChannelMetadata
    | undefined;
}

function readOperation(
  method: unknown,
): AsyncApiOperationMetadata | undefined {
  return Reflect.getMetadata(ASYNC_API_OPERATION_METADATA, method as object) as
    | AsyncApiOperationMetadata
    | undefined;
}

function readMessage(method: unknown): AsyncApiMessageMetadata | undefined {
  return Reflect.getMetadata(ASYNC_API_MESSAGE_METADATA, method as object) as
    | AsyncApiMessageMetadata
    | undefined;
}

function readHeaders(method: unknown): AsyncApiHeadersMetadata | undefined {
  return Reflect.getMetadata(ASYNC_API_HEADERS_METADATA, method as object) as
    | AsyncApiHeadersMetadata
    | undefined;
}

class OrderDto {}
class HeadersDto {}

describe('AsyncApiChannel', () => {
  it('stores the id and all supplied channel options', () => {
    @AsyncApiChannel('orders', {
      address: 'orders.v1',
      title: 'Orders',
      summary: 'Order events',
      description: 'Lifecycle of an order',
    })
    class OrdersHandler {}

    assert.deepEqual(readChannel(OrdersHandler), {
      id: 'orders',
      address: 'orders.v1',
      title: 'Orders',
      summary: 'Order events',
      description: 'Lifecycle of an order',
    });
  });

  it('stores only the id when no options are supplied', () => {
    @AsyncApiChannel('plain')
    class PlainHandler {}

    assert.deepEqual(readChannel(PlainHandler), { id: 'plain' });
  });

  it('preserves an explicit null address', () => {
    @AsyncApiChannel('dynamic', { address: null })
    class DynamicHandler {}

    assert.equal(readChannel(DynamicHandler)?.address, null);
  });
});

describe('AsyncApiPub', () => {
  it('marks the method as a send operation with its options', () => {
    class Handler {
      @AsyncApiPub({
        operationId: 'orderPlaced',
        title: 'Order placed',
        summary: 'Emitted on order placement',
        description: 'Sent when a customer places an order',
      })
      placeOrder(): void {}
    }

    assert.deepEqual(readOperation(Handler.prototype.placeOrder), {
      action: AsyncApiAction.Send,
      operationId: 'orderPlaced',
      title: 'Order placed',
      summary: 'Emitted on order placement',
      description: 'Sent when a customer places an order',
    });
  });

  it('stores only the action when no options are supplied', () => {
    class Handler {
      @AsyncApiPub()
      placeOrder(): void {}
    }

    assert.deepEqual(readOperation(Handler.prototype.placeOrder), {
      action: AsyncApiAction.Send,
    });
  });
});

describe('AsyncApiSub', () => {
  it('marks the method as a receive operation with its options', () => {
    class Handler {
      @AsyncApiSub({ operationId: 'onShipped' })
      handleShipped(): void {}
    }

    assert.deepEqual(readOperation(Handler.prototype.handleShipped), {
      action: AsyncApiAction.Receive,
      operationId: 'onShipped',
    });
  });

  it('stores only the action when no options are supplied', () => {
    class Handler {
      @AsyncApiSub()
      handleShipped(): void {}
    }

    assert.deepEqual(readOperation(Handler.prototype.handleShipped), {
      action: AsyncApiAction.Receive,
    });
  });
});

describe('AsyncApiMessage', () => {
  it('stores the payload source and all supplied message options', () => {
    class Handler {
      @AsyncApiMessage(OrderDto, {
        name: 'OrderPlaced',
        title: 'Order placed',
        summary: 'A customer placed an order',
        description: 'Emitted on order placement',
        contentType: 'application/json',
      })
      placeOrder(): void {}
    }

    assert.deepEqual(readMessage(Handler.prototype.placeOrder), {
      payload: OrderDto,
      name: 'OrderPlaced',
      title: 'Order placed',
      summary: 'A customer placed an order',
      description: 'Emitted on order placement',
      contentType: 'application/json',
    });
  });

  it('stores only the payload when no options are supplied', () => {
    class Handler {
      @AsyncApiMessage(OrderDto)
      placeOrder(): void {}
    }

    assert.deepEqual(readMessage(Handler.prototype.placeOrder), {
      payload: OrderDto,
    });
  });

  it('accepts a pre-computed JSON Schema source as the payload', () => {
    const source = { name: 'Ping', schema: { type: 'object' as const } };

    class Handler {
      @AsyncApiMessage(source)
      ping(): void {}
    }

    assert.deepEqual(readMessage(Handler.prototype.ping)?.payload, source);
  });
});

describe('AsyncApiHeaders', () => {
  it('stores the headers source', () => {
    class Handler {
      @AsyncApiHeaders(HeadersDto)
      placeOrder(): void {}
    }

    assert.deepEqual(readHeaders(Handler.prototype.placeOrder), {
      headers: HeadersDto,
    });
  });
});
