# Transport Bindings

AsyncAPI bindings carry protocol-specific detail the core objects cannot express
— a Kafka topic's partition count, an AMQP exchange type, an MQTT QoS level, a
NATS queue group. The package ships typed binding models for the four v1
protocols: **Kafka, NATS, MQTT, and AMQP**.

AsyncAPI 3.0 attaches bindings at four scopes. Each scope has its own decorator
or option:

| Scope | Where it attaches |
| --- | --- |
| Server | `@AsyncApiServer(..., { bindings })` |
| Channel | `@AsyncApiChannelBindings(bindings)` (class-level) |
| Operation | `@AsyncApiOperationBindings(bindings)` (method-level) |
| Message | `@AsyncApiMessageBindings(bindings)` (method-level) |

Every binding map is keyed by protocol and emitted verbatim into the document.
The models are typed for the v1 protocols but keep an index signature, so a field
a future binding version adds still type-checks. The package never invents
non-standard bindings — `@asyncapi/parser` remains the source of truth for what
is ultimately valid.

## Kafka

```ts
@AsyncApiServer('kafka', 'kafka.example.com:9092', 'kafka', {
  bindings: {
    kafka: { schemaRegistryVendor: 'confluent', bindingVersion: '0.5.0' },
  },
})
@AsyncApiChannel('orders', { address: 'orders.v1' })
@AsyncApiChannelBindings({
  kafka: { topic: 'orders.v1', partitions: 3, replicas: 3, bindingVersion: '0.5.0' },
})
export class OrdersHandler {
  @AsyncApiSub({ operationId: 'onOrderPlaced' })
  @AsyncApiMessage(OrderPlacedDto)
  @AsyncApiOperationBindings({
    kafka: {
      groupId: { type: 'string', enum: ['orders-consumer'] },
      bindingVersion: '0.5.0',
    },
  })
  handleOrderPlaced(): void {}
}
```

Kafka defines bindings at all four scopes: server (schema registry), channel
(topic, partitions, replicas), operation (consumer `groupId`, `clientId`), and
message (key, schema-id lookup).

## NATS

NATS defines only an operation-scoped binding — the queue group an operation
subscribes with.

```ts
@AsyncApiSub({ operationId: 'onMetric' })
@AsyncApiMessage(MetricDto)
@AsyncApiOperationBindings({
  nats: { queue: 'metrics-workers', bindingVersion: '0.1.0' },
})
handleMetric(): void {}
```

## MQTT

MQTT defines server (client id, clean session, last will, keep-alive),
operation (QoS, retain, expiry), and message (payload format, content type,
response topic) bindings.

```ts
@AsyncApiServer('mqtt', 'mqtt.example.com:1883', 'mqtt', {
  bindings: {
    mqtt: { clientId: 'orders-service', cleanSession: true, keepAlive: 60 },
  },
})
@AsyncApiChannel('telemetry')
export class TelemetryHandler {
  @AsyncApiPub({ operationId: 'publishTelemetry' })
  @AsyncApiMessage(TelemetryDto)
  @AsyncApiOperationBindings({ mqtt: { qos: 1, retain: false } })
  publishTelemetry(): void {}
}
```

## AMQP

AMQP defines channel (queue vs routing key, exchange/queue definition),
operation (delivery mode, priority, expiration), and message (content encoding,
message type) bindings.

```ts
@AsyncApiChannel('invoices')
@AsyncApiChannelBindings({
  amqp: {
    is: 'routingKey',
    exchange: { name: 'invoices', type: 'topic', durable: true },
  },
})
export class InvoicesHandler {
  @AsyncApiPub({ operationId: 'publishInvoice' })
  @AsyncApiMessage(InvoiceDto)
  @AsyncApiOperationBindings({ amqp: { deliveryMode: 2, priority: 5 } })
  publishInvoice(): void {}
}
```

## Protocol Constant

`AsyncApiProtocol` exports the supported binding keys for use in code:

```ts
import { AsyncApiProtocol } from '@nest-native/asyncapi';

AsyncApiProtocol.Kafka; // 'kafka'
AsyncApiProtocol.Nats;  // 'nats'
AsyncApiProtocol.Mqtt;  // 'mqtt'
AsyncApiProtocol.Amqp;  // 'amqp'
```

## Pinning `bindingVersion`

Every binding accepts an optional `bindingVersion`. It defaults to `latest` when
omitted, but pinning it (for example `0.5.0` for Kafka) produces reproducible
specs and is recommended. For a full multi-protocol example, see
[`sample/03-transport-bindings`](https://github.com/nest-native/asyncapi/tree/main/sample/03-transport-bindings).
