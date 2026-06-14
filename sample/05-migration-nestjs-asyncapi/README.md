# Sample 05 - Migration from `nestjs-asyncapi`

Ports the [`nestjs-asyncapi`](https://github.com/flamewow/nestjs-asyncapi)
"felines" example app — the de-facto AsyncAPI **2.x** generator for NestJS — to
`@nest-native/asyncapi` (AsyncAPI **3.0**). It is the executable companion to the
[migration guide](../../docs/migration-from-nestjs-asyncapi.md): the smoke test
asserts the migrated document reproduces the original's channels, operations,
polymorphic payload, and server, then validates it with the official
`@asyncapi/parser`.

## What It Demonstrates

- The 2.x → 3.0 model shift: a method that stacked `@AsyncApiSend` /
  `@AsyncApiReceive` (each with its own `{ channel, message }`) becomes a
  class-level `@AsyncApiChannel('id')` plus method-level `@AsyncApiPub()` /
  `@AsyncApiSub()` + `@AsyncApiMessage(Dto)`.
- Coexistence with `@nestjs/microservices`: the `@EventPattern` transport
  bindings stay on the handlers; the package documents them without taking over
  transport.
- **Channel ids with slashes** (`ms/create/feline`, mirroring the
  `@EventPattern` string) generating spec-valid, JSON-Pointer-escaped `$ref`s.
- Polymorphic payloads: the builder's `extraModels: [Cat, Lion, Tiger]` becomes
  the standard `@nestjs/swagger` `@ApiExtraModels(...)` decorator on the DTO.
- The builder (`new AsyncApiDocumentBuilder().setTitle(...).addServers(...)`)
  replaced by a config object passed to `getAsyncApiDocument(app, ...)` plus a
  class-level `@AsyncApiServer(...)`.
- The generated document passing official `@asyncapi/parser` validation.

## Commands

```bash
npm run test --workspace nest-native-asyncapi-sample-05-migration-nestjs-asyncapi
npm run start --workspace nest-native-asyncapi-sample-05-migration-nestjs-asyncapi
```

`test` typechecks the sample and runs a smoke script that boots the application,
asserts the migrated channels/operations/server/polymorphic payload, and
validates the document with `@asyncapi/parser`. `start` boots the app over HTTP
and serves the viewer at `http://localhost:4001/async-api`.

## Main Files

- `src/felines/felines.controller.ts`: the ported channel handlers — one per
  channel, each splitting the original's send/receive into 3.0 operations.
- `src/felines/feline.messages.ts`: the message DTOs, including the polymorphic
  `FelineEventDto` payload registered with `@ApiExtraModels`.
- `src/felines/feline.classes.ts`: the `Feline` / `Cat` / `Lion` / `Tiger`
  domain classes, ported verbatim from the original sample.
- `src/asyncapi.ts`: the `getAsyncApiDocument(app, ...)` replacement for the
  original `AsyncApiDocumentBuilder` + `createDocument` flow.
- `scripts/smoke.ts`: boots the app, asserts the migration is faithful, and
  validates with `@asyncapi/parser`.
