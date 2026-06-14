import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import 'reflect-metadata';
import {
  ASYNC_API_CHANNEL_BINDINGS_METADATA,
  ASYNC_API_CHANNEL_METADATA,
  ASYNC_API_HEADERS_METADATA,
  ASYNC_API_MESSAGE_BINDINGS_METADATA,
  ASYNC_API_MESSAGE_METADATA,
  ASYNC_API_OPERATION_BINDINGS_METADATA,
  ASYNC_API_OPERATION_METADATA,
  ASYNC_API_SERVERS_METADATA,
  AsyncApiAction,
} from '../constants';
import {
  AsyncApiChannel,
  AsyncApiChannelBindings,
  AsyncApiChannelMetadata,
  AsyncApiHeaders,
  AsyncApiHeadersMetadata,
  AsyncApiMessage,
  AsyncApiMessageBindings,
  AsyncApiMessageMetadata,
  AsyncApiOperationBindings,
  AsyncApiOperationMetadata,
  AsyncApiPub,
  AsyncApiServer,
  AsyncApiServerMetadata,
  AsyncApiSub,
} from '../decorators';
import {
  AsyncApiChannelBindingsMap,
  AsyncApiMessageBindingsMap,
  AsyncApiOperationBindingsMap,
} from '../bindings';

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

function readChannelBindings(
  target: object,
): AsyncApiChannelBindingsMap | undefined {
  return Reflect.getMetadata(ASYNC_API_CHANNEL_BINDINGS_METADATA, target) as
    | AsyncApiChannelBindingsMap
    | undefined;
}

function readOperationBindings(
  method: unknown,
): AsyncApiOperationBindingsMap | undefined {
  return Reflect.getMetadata(
    ASYNC_API_OPERATION_BINDINGS_METADATA,
    method as object,
  ) as AsyncApiOperationBindingsMap | undefined;
}

function readMessageBindings(
  method: unknown,
): AsyncApiMessageBindingsMap | undefined {
  return Reflect.getMetadata(
    ASYNC_API_MESSAGE_BINDINGS_METADATA,
    method as object,
  ) as AsyncApiMessageBindingsMap | undefined;
}

function readServers(target: object): AsyncApiServerMetadata[] | undefined {
  return Reflect.getMetadata(ASYNC_API_SERVERS_METADATA, target) as
    | AsyncApiServerMetadata[]
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

describe('AsyncApiServer', () => {
  it('stores the required fields and all supplied options', () => {
    @AsyncApiServer('production', 'broker.example.com:9092', 'kafka', {
      protocolVersion: '3.5',
      pathname: '/events',
      title: 'Production Kafka',
      summary: 'Primary broker',
      description: 'The production Kafka cluster',
      bindings: { kafka: { schemaRegistryVendor: 'confluent' } },
    })
    class Handler {}

    assert.deepEqual(readServers(Handler), [
      {
        name: 'production',
        host: 'broker.example.com:9092',
        protocol: 'kafka',
        protocolVersion: '3.5',
        pathname: '/events',
        title: 'Production Kafka',
        summary: 'Primary broker',
        description: 'The production Kafka cluster',
        bindings: { kafka: { schemaRegistryVendor: 'confluent' } },
      },
    ]);
  });

  it('stores only the required fields when no options are supplied', () => {
    @AsyncApiServer('local', 'localhost:1883', 'mqtt')
    class Handler {}

    assert.deepEqual(readServers(Handler), [
      { name: 'local', host: 'localhost:1883', protocol: 'mqtt' },
    ]);
  });

  it('accumulates several server declarations on one class', () => {
    @AsyncApiServer('kafka', 'broker:9092', 'kafka')
    @AsyncApiServer('nats', 'nats://localhost:4222', 'nats')
    class Handler {}

    const servers = readServers(Handler);
    assert.equal(servers?.length, 2);
    assert.deepEqual(
      servers?.map((server) => server.name).sort(),
      ['kafka', 'nats'],
    );
  });
});

describe('AsyncApiChannelBindings', () => {
  it('stores the protocol-keyed channel bindings', () => {
    const bindings: AsyncApiChannelBindingsMap = {
      kafka: { topic: 'orders', partitions: 3, bindingVersion: '0.5.0' },
    };

    @AsyncApiChannelBindings(bindings)
    class Handler {}

    assert.deepEqual(readChannelBindings(Handler), bindings);
  });
});

describe('AsyncApiOperationBindings', () => {
  it('stores the protocol-keyed operation bindings', () => {
    const bindings: AsyncApiOperationBindingsMap = {
      kafka: { groupId: { type: 'string' }, bindingVersion: '0.5.0' },
      nats: { queue: 'workers', bindingVersion: '0.1.0' },
    };

    class Handler {
      @AsyncApiOperationBindings(bindings)
      onMessage(): void {}
    }

    assert.deepEqual(readOperationBindings(Handler.prototype.onMessage), bindings);
  });
});

describe('AsyncApiMessageBindings', () => {
  it('stores the protocol-keyed message bindings', () => {
    const bindings: AsyncApiMessageBindingsMap = {
      kafka: { schemaIdLocation: 'payload', bindingVersion: '0.5.0' },
      amqp: { contentEncoding: 'gzip', bindingVersion: '0.3.0' },
    };

    class Handler {
      @AsyncApiMessageBindings(bindings)
      onMessage(): void {}
    }

    assert.deepEqual(readMessageBindings(Handler.prototype.onMessage), bindings);
  });
});
