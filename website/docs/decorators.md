# Decorators

The package mirrors `@nestjs/swagger` naming. Five decorators describe the
AsyncAPI 3.0 model, and three optional decorators attach protocol bindings (see
[Bindings](bindings.md)).

## `@AsyncApiChannel(id, options?)`

Class-level. Declares the AsyncAPI 3.0 channel a handler class operates on,
mirroring how `@Controller('path')` declares an HTTP base route. The channel id
is explicit by design — the generator never derives it from the class name.

```ts
@AsyncApiChannel('orders', {
  address: 'orders.v1',
  title: 'Orders',
  description: 'Lifecycle events for customer orders.',
})
export class OrdersHandler {}
```

| Option | Purpose |
| --- | --- |
| `address` | Channel address (topic, queue, routing key). Defaults to the id; pass `null` to mark an address unknown at design time |
| `title` | Human-friendly channel title |
| `summary` | Short channel summary |
| `description` | Verbose channel description |

## `@AsyncApiPub(options?)` / `@AsyncApiSub(options?)`

Method-level. Declare an AsyncAPI 3.0 operation on a channel handler method.
`@AsyncApiPub` produces a `send` operation; `@AsyncApiSub` produces a `receive`
operation. The action is fixed by the decorator and is not configurable.

```ts
@AsyncApiPub({ operationId: 'orderPlaced', summary: 'A customer placed an order.' })
publishOrderPlaced(): void {}

@AsyncApiSub({ operationId: 'onOrderPlaced' })
handleOrderPlaced(): void {}
```

| Option | Purpose |
| --- | --- |
| `operationId` | Key in the generated `operations` map. Defaults to the method name |
| `title` | Human-friendly operation title |
| `summary` | Short operation summary |
| `description` | Verbose operation description |

> The 3.0 naming flips relative to 2.x: a `send` operation is `@AsyncApiPub`,
> and a `receive` operation is `@AsyncApiSub`. See [Migration](migration.md).

## `@AsyncApiMessage(payload, options?)`

Method-level. Declares the payload of the message an operation sends or
receives. The payload is a DTO class — turned into JSON Schema through the same
`@nestjs/swagger` chain that documents HTTP bodies — or a `{ name, schema }`
source whose `schema` is either a Zod schema (converted natively with Zod 4's
`z.toJSONSchema()`) or a pre-computed JSON Schema (registered verbatim). The
message is registered once in `components.messages` and referenced from the
channel and operation.

```ts
@AsyncApiMessage(OrderPlacedDto, {
  name: 'OrderPlaced',
  summary: 'A customer placed an order.',
})
publishOrderPlaced(): void {}
```

| Option | Purpose |
| --- | --- |
| `name` | `components.messages` key and message `name`. Defaults to the DTO class name or the schema source `name` |
| `title` | Human-friendly message title |
| `summary` | Short message summary |
| `description` | Verbose message description |
| `contentType` | Payload content type. Defaults to `application/json` |

## `@AsyncApiHeaders(headers)`

Method-level. Declares the headers of the message an operation sends or
receives, resolved exactly as the payload is — a DTO class through the
`@nestjs/swagger` chain, or a pre-computed `{ name, schema }`.

```ts
@AsyncApiMessage(OrderPlacedDto)
@AsyncApiHeaders(OrderHeadersDto)
publishOrderPlaced(): void {}
```

## `@AsyncApiServer(name, host, protocol, options?)`

Class-level and repeatable. Declares a broker the application connects to.
Stacking it declares several brokers, and every declaration across the
application is merged into the document's `servers` map. The `protocol` and the
optional protocol `bindings` carry the transport identity and connection
metadata.

```ts
@AsyncApiServer('kafka', 'kafka.example.com:9092', 'kafka', {
  title: 'Kafka cluster',
  bindings: { kafka: { bindingVersion: '0.5.0' } },
})
@AsyncApiServer('nats', 'nats.example.com:4222', 'nats')
export class OrdersHandler {}
```

| Argument / option | Purpose |
| --- | --- |
| `name` | Key in the generated `servers` map |
| `host` | Server host (may include the port) |
| `protocol` | Connection protocol (`kafka`, `nats`, `mqtt`, `amqp`, …) |
| `protocolVersion` | Protocol version used for connection |
| `pathname` | Path to a resource in the host |
| `title` / `summary` / `description` | Server metadata |
| `bindings` | Protocol-specific connection bindings, keyed by protocol |

## Binding Decorators

Three optional decorators attach protocol-specific bindings:

- `@AsyncApiChannelBindings(bindings)` — class-level, alongside `@AsyncApiChannel`.
- `@AsyncApiOperationBindings(bindings)` — method-level, alongside the operation.
- `@AsyncApiMessageBindings(bindings)` — method-level, alongside the message.

See [Bindings](bindings.md) for the full Kafka, NATS, MQTT, and AMQP binding
shapes.
