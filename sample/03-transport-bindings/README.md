# Sample 03 - Transport Bindings

Demonstrates AsyncAPI 3.0 protocol bindings for the four transports
`@nest-native/asyncapi` ships in v1: **Kafka**, **NATS**, **MQTT**, and **AMQP**.

A binding carries protocol-specific information the core AsyncAPI objects cannot
express — a Kafka topic's partition count, an AMQP exchange's type, an MQTT QoS
level, a NATS queue group. AsyncAPI attaches bindings at four scopes (server,
channel, operation, message); this sample exercises all of them and validates the
result with the official `@asyncapi/parser`.

## What It Demonstrates

- `@AsyncApiServer(name, host, protocol, options)` declaring one broker per
  transport, each with its `protocol` and server-level `bindings`
- `@AsyncApiChannelBindings({ kafka, amqp })` describing the channel's Kafka topic
  and AMQP exchange
- `@AsyncApiOperationBindings({ kafka, nats, mqtt, amqp })` documenting consumer
  groups, queue groups, QoS, and delivery mode per operation
- `@AsyncApiMessageBindings({ kafka, amqp, mqtt })` documenting the message
  wire-format (schema-id location, content encoding, payload-format indicator)
- The generated document passing official `@asyncapi/parser` validation

The package only ships typed bindings for Kafka, NATS, MQTT, and AMQP, but the
binding maps stay open, so any other protocol's spec-compliant binding can be
attached verbatim.

## Commands

```bash
npm run test --workspace nest-native-asyncapi-sample-03-transport-bindings
npm run start --workspace nest-native-asyncapi-sample-03-transport-bindings
```

`test` typechecks the sample and runs a smoke script that boots the application,
asserts the servers and bindings, and validates the document with
`@asyncapi/parser`. `start` prints the generated AsyncAPI document to stdout.

## Main Files

- `src/orders/orders.handler.ts`: the channel handler declaring the four servers
  and the channel/operation/message bindings.
- `src/orders/order.dto.ts`: the class-validator payload DTO.
- `src/asyncapi.ts`: builds the AsyncAPI document from the running application.
- `scripts/smoke.ts`: boots the app, asserts the bindings, and validates with
  `@asyncapi/parser`.
