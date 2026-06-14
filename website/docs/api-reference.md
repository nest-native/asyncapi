# API Reference

This page lists the first-version public API. The package may add APIs as
samples and binding coverage grow, but this surface is the supported baseline.

## Module

### `AsyncApiModule.forRoot(options?)`

Registers global AsyncAPI configuration. Returns a global `DynamicModule` by
default.

```ts
AsyncApiModule.forRoot({
  defaultInfo: { title: 'Orders Service', version: '1.0.0' },
});
```

| Option | Purpose |
| --- | --- |
| `isGlobal` | Defaults to `true`; set `false` for module-scoped registration |
| `defaultInfo` | Default document `info` metadata as a string map |

### `AsyncApiModule.forRootAsync(options)`

Registers global configuration from a provider-backed factory.

```ts
AsyncApiModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    defaultInfo: { title: config.getOrThrow('SERVICE_NAME') },
  }),
});
```

| Option | Purpose |
| --- | --- |
| `useFactory` | Factory resolving the module options (sync or async) |
| `inject` | Providers injected into the factory |
| `imports` | Modules imported for the factory's dependencies |
| `extraProviders` | Additional providers registered alongside the options |
| `isGlobal` | Defaults to `true` |

### `AsyncApiModule.setup(path, app, document, options?)`

Serves the viewer page plus the raw JSON and YAML on the application's HTTP
server. Returns `{ uiUrl, jsonUrl, yamlUrl }`. See [Docs Route](docs-route.md).

## Decorators

See [Decorators](decorators.md) for full options.

| Decorator | Level | Purpose |
| --- | --- | --- |
| `@AsyncApiChannel(id, options?)` | class | Declare the channel a handler operates on |
| `@AsyncApiPub(options?)` | method | Declare a `send` operation |
| `@AsyncApiSub(options?)` | method | Declare a `receive` operation |
| `@AsyncApiMessage(payload, options?)` | method | Declare the message payload |
| `@AsyncApiHeaders(headers)` | method | Declare the message headers |
| `@AsyncApiServer(name, host, protocol, options?)` | class | Declare a broker (repeatable) |
| `@AsyncApiChannelBindings(bindings)` | class | Attach channel bindings |
| `@AsyncApiOperationBindings(bindings)` | method | Attach operation bindings |
| `@AsyncApiMessageBindings(bindings)` | method | Attach message bindings |

## Functions

### `getAsyncApiDocument(app, config?)`

Walks the running application's NestJS metadata and returns a spec-compliant
AsyncAPI 3.0 document. The AsyncAPI counterpart to
`SwaggerModule.createDocument`. See [Document Generation](document-generation.md).

### `buildAsyncApiDocument(config, handlers)`

Assembles a document from a config and a pre-scanned handler list. The lower-level
building block `getAsyncApiDocument` calls after the metadata walk; useful for
advanced custom discovery.

### `toJson(document)` / `toYaml(document)`

Serialize a document to indented JSON or block-style YAML 1.2. Both are
dependency-free.

### `escapeJsonPointerSegment(segment)` / `buildRef(base, ...segments)`

RFC 6901 reference helpers used to build `$ref` strings whose segments may
contain `/` or `~` (common with channel ids that mirror `@EventPattern`
strings). Exported for advanced use.

## Schema Sources

`@AsyncApiMessage` and `@AsyncApiHeaders` accept a `SchemaSource`:

- A **DTO class** — resolved through the same `@nestjs/swagger` chain that
  documents HTTP bodies.
- A **`JsonSchemaSource`** — a pre-computed `{ name, schema }`, for example a Zod
  schema converted with `zod-to-json-schema`.

`AsyncApiSchemaRegistry` is the registry the generator uses to collect
`components.schemas` and dedupe shared DTOs. See [Validation](validation.md).

## Constants

- `ASYNC_API_VERSION` — the emitted spec version (`3.0.0`).
- `AsyncApiAction` — operation actions (`Send`, `Receive`).
- `AsyncApiProtocol` — supported binding protocol keys (`kafka`, `nats`, `mqtt`,
  `amqp`).
- `DEFAULT_DOCUMENT_TITLE`, `DEFAULT_DOCUMENT_VERSION` — config defaults.

## Public API Tiers

Onboarding focuses on `AsyncApiModule` and the five decorators
(`@AsyncApiChannel`, `@AsyncApiPub` / `@AsyncApiSub`, `@AsyncApiMessage`,
`@AsyncApiHeaders`, `@AsyncApiServer`) plus `getAsyncApiDocument` and
`AsyncApiModule.setup`.

Advanced features — binding decorators, `buildAsyncApiDocument`,
`AsyncApiSchemaRegistry`, serializers, and reference helpers — stay in their own
sections and are not needed for a first integration.
