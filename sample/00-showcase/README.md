# Sample 00 - AsyncAPI Showcase

The growing integration baseline for `@nest-native/asyncapi`. It keeps AsyncAPI
3.0 semantics explicit while showing the Nest-native structure users expect in a
real event-driven application.

It demonstrates the channel and operation decorators plus message payloads from
both validation worlds, and transport bindings (Kafka on the orders channel,
NATS on the shipments channel), producing a valid AsyncAPI 3.0 document
validated by `@asyncapi/parser`.

## What It Demonstrates

- `AsyncApiModule.forRoot()` registering the global AsyncAPI configuration
- `@AsyncApiChannel('orders', ...)` declaring a channel on a handler class
- `@AsyncApiPub(...)` declaring a `send` operation
- `@AsyncApiSub(...)` declaring a `receive` operation
- `@AsyncApiMessage(...)` / `@AsyncApiHeaders(...)` attaching payloads and headers
- The class-validator world: DTOs turned into JSON Schema through the
  `@nestjs/swagger` chain (the `orders` channel)
- The Zod world: a Zod schema converted with `z.toJSONSchema()` (the
  `shipments` channel)
- `@AsyncApiServer(...)`, `@AsyncApiChannelBindings(...)`, and
  `@AsyncApiOperationBindings(...)` declaring the Kafka and NATS brokers and the
  channel/operation transport bindings
- `getAsyncApiDocument(app, config)` walking NestJS metadata to assemble a
  spec-compliant AsyncAPI 3.0 document — the AsyncAPI counterpart to
  `SwaggerModule.createDocument`
- The generated document passing official `@asyncapi/parser` validation

Sample `04-docs-route` covers the hosted docs route with a live viewer via
`AsyncApiModule.setup`, and sample `03-transport-bindings` covers all four v1
transports (Kafka, NATS, MQTT, AMQP) across every binding scope.

## Commands

```bash
npm run test --workspace nest-native-asyncapi-showcase
npm run start --workspace nest-native-asyncapi-showcase
```

`test` typechecks the sample and runs a smoke script that boots the application,
generates the document, and asserts its channels and operations. `start` prints
the generated AsyncAPI document to stdout.

## Main Files

- `src/app.module.ts`: root module importing `AsyncApiModule.forRoot()` and the
  orders and shipments feature modules.
- `src/orders/orders.handler.ts`: the channel handler decorated with
  `@AsyncApiChannel`, `@AsyncApiPub`, `@AsyncApiSub`, `@AsyncApiMessage`, and
  `@AsyncApiHeaders`, using class-validator DTOs.
- `src/orders/order.dto.ts`: the class-validator payload and headers DTOs.
- `src/shipments/shipments.handler.ts`: a channel handler using a Zod payload.
- `src/shipments/shipment.schema.ts`: the Zod schema and its JSON Schema source.
- `src/asyncapi.ts`: builds the AsyncAPI document from the running application.
- `scripts/smoke.ts`: boots the app, asserts the generated document, and
  validates it with `@asyncapi/parser`.
