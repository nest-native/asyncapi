# Sample 00 - AsyncAPI Showcase

The growing integration baseline for `@nest-native/asyncapi`. It keeps AsyncAPI
3.0 semantics explicit while showing the Nest-native structure users expect in a
real event-driven application.

This sample grows milestone by milestone. At this milestone it demonstrates the
channel and operation decorators producing a valid AsyncAPI 3.0 document.

## What It Demonstrates

- `AsyncApiModule.forRoot()` registering the global AsyncAPI configuration
- `@AsyncApiChannel('orders', ...)` declaring a channel on a handler class
- `@AsyncApiPub(...)` declaring a `send` operation
- `@AsyncApiSub(...)` declaring a `receive` operation
- `getAsyncApiDocument(app, config)` walking NestJS metadata to assemble a
  spec-compliant AsyncAPI 3.0 document — the AsyncAPI counterpart to
  `SwaggerModule.createDocument`

Message payloads and headers, transport bindings, and the hosted docs route with
a live viewer land in later milestones and will be folded into this same
showcase.

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
  orders feature module.
- `src/orders/orders.handler.ts`: the channel handler decorated with
  `@AsyncApiChannel`, `@AsyncApiPub`, and `@AsyncApiSub`.
- `src/asyncapi.ts`: builds the AsyncAPI document from the running application.
- `scripts/smoke.ts`: boots the app and asserts the generated document.
