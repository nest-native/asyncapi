---
title: Adoption Guide
description: Introduce @nest-native/asyncapi into an existing Nest event-driven application incrementally.
---

# Adoption Guide

Adopt `@nest-native/asyncapi` in small steps. The package should describe the
handlers you already have, not change how they run. Transport stays in
`@nestjs/microservices` or your broker integration; this package only documents
it.

## Start With One Channel

Pick one handler class and declare its channel and a single operation. Nothing
else in the application needs to change.

```ts
@Controller()
@AsyncApiChannel('orders')
export class OrdersHandler {
  @AsyncApiPub({ operationId: 'orderPlaced' })
  @AsyncApiMessage(OrderPlacedDto)
  publishOrderPlaced(): void {}
}
```

Generate the document and serve it. Even one decorated method produces a valid
AsyncAPI 3.0 document you can validate with the parser.

## Reuse Existing DTOs

If your message payloads are already DTO classes documented with
`@nestjs/swagger`, pass them straight to `@AsyncApiMessage()`. The generator
reuses the same schema chain, so you do not rewrite the schema.

```ts
@AsyncApiMessage(OrderPlacedDto)
publishOrderPlaced(): void {}
```

If a payload comes from a Zod schema, convert it once with `z.toJSONSchema()`
and pass the `{ name, schema }` source. Mixing both styles in one app is fine —
see [Validation](validation.md).

## Add Operations And Headers Gradually

Add `@AsyncApiSub()` for the receive side, and `@AsyncApiHeaders()` when a
message carries documented headers. Each addition is independent and keeps the
document valid.

```ts
@AsyncApiSub({ operationId: 'onOrderPlaced' })
@AsyncApiMessage(OrderPlacedDto)
@AsyncApiHeaders(OrderHeadersDto)
handleOrderPlaced(): void {}
```

## Declare Servers And Bindings Last

Once channels and operations are documented, declare the brokers with
`@AsyncApiServer()` and attach protocol bindings where the core objects cannot
express transport detail. Bindings are optional and additive — see
[Bindings](bindings.md).

The usual order is:

1. Declare one channel and one operation.
2. Attach payloads (and headers) with existing DTOs or Zod sources.
3. Generate and validate the document with `@asyncapi/parser`.
4. Serve the docs route with `AsyncApiModule.setup()`.
5. Declare servers and protocol bindings for transport detail.

## Adoption PR Shape

Keep adoption PRs narrow:

- One handler or feature module at a time.
- No transport behavior changes mixed in with documentation.
- Reuse existing DTOs before introducing new schema sources.
- Validate the generated document in a smoke test.

This keeps the migration reversible and makes review about documentation rather
than runtime behavior. For a full port from `nestjs-asyncapi`, see
[Migration](migration.md).
