# Sample Catalog

Every sample is a runnable Nest application that generates an AsyncAPI 3.0
document and validates it with `@asyncapi/parser`. They use no external broker —
transport is out of scope for this package — so they run anywhere.

```bash
npm run ci:sample
npm run sample:focused
```

## Runnable Today

| Sample | Focus | Command |
| --- | --- | --- |
| [`00-showcase`](https://github.com/nest-native/asyncapi/tree/main/sample/00-showcase) | All five decorators, class-validator and Zod payloads, Kafka and NATS bindings, and the docs route with viewer | `npm run showcase` |
| [`01-validation-class-validator`](https://github.com/nest-native/asyncapi/tree/main/sample/01-validation-class-validator) | `@AsyncApiMessage` / `@AsyncApiHeaders` with class-validator DTOs | `npm run test --workspace nest-native-asyncapi-sample-01-validation-class-validator` |
| [`02-validation-zod`](https://github.com/nest-native/asyncapi/tree/main/sample/02-validation-zod) | A Zod payload via `z.toJSONSchema()` | `npm run test --workspace nest-native-asyncapi-sample-02-validation-zod` |
| [`03-transport-bindings`](https://github.com/nest-native/asyncapi/tree/main/sample/03-transport-bindings) | `@AsyncApiServer` plus Kafka, NATS, MQTT, and AMQP bindings across every scope | `npm run test --workspace nest-native-asyncapi-sample-03-transport-bindings` |
| [`04-docs-route`](https://github.com/nest-native/asyncapi/tree/main/sample/04-docs-route) | `AsyncApiModule.setup` serving the viewer and the JSON/YAML spec routes | `npm run test --workspace nest-native-asyncapi-sample-04-docs-route` |
| [`05-migration-nestjs-asyncapi`](https://github.com/nest-native/asyncapi/tree/main/sample/05-migration-nestjs-asyncapi) | The `nestjs-asyncapi` 2.x felines sample ported to AsyncAPI 3.0 | `npm run test --workspace nest-native-asyncapi-sample-05-migration-nestjs-asyncapi` |
| [`06-forrootasync-config`](https://github.com/nest-native/asyncapi/tree/main/sample/06-forrootasync-config) | `AsyncApiModule.forRootAsync` resolving the document defaults from an injected `ConfigService` | `npm run test --workspace nest-native-asyncapi-sample-06-forrootasync-config` |

## What The Showcase Proves

The showcase is intentionally rich — richness proves integration depth:

- All five decorators end-to-end, plus the three binding decorators.
- Both validation worlds: class-validator DTOs for orders, a Zod payload for
  shipments, in one document.
- Multiple transport bindings (Kafka and NATS at minimum).
- A live docs route served over HTTP with the AsyncAPI viewer.
- The generated spec validated against `@asyncapi/parser` on every run.

## Focused Samples

Each focused sample isolates one concept so you can copy the exact pattern you
need:

- **Validation** — `01` (class-validator) and `02` (Zod) show the two schema
  source styles described in [Validation](../validation.md).
- **Bindings** — `03` shows Kafka, NATS, MQTT, and AMQP bindings at the server,
  channel, operation, and message scopes described in [Bindings](../bindings.md).
- **Docs route** — `04` boots over HTTP and validates the served JSON and YAML,
  matching [Docs Route](../docs-route.md).
- **Migration** — `05` is the validated port behind the
  [Migration](../migration.md) guide.
- **Async configuration** — `06` registers the module with
  `AsyncApiModule.forRootAsync`, resolving the document defaults from an injected
  `ConfigService` before generating the document.
