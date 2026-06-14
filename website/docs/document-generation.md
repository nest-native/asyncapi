# Document Generation

`getAsyncApiDocument()` is the AsyncAPI counterpart to
`SwaggerModule.createDocument`. It walks a running application's NestJS metadata
exactly as `@nestjs/swagger` walks controllers, then assembles a spec-compliant
AsyncAPI 3.0 document.

```ts
import { NestFactory } from '@nestjs/core';
import { getAsyncApiDocument } from '@nest-native/asyncapi';
import { AppModule } from './app.module';

const app = await NestFactory.create(AppModule);

const document = getAsyncApiDocument(app, {
  title: 'Orders Service',
  version: '1.0.0',
  description: 'Event-driven order lifecycle, documented with AsyncAPI 3.0.',
});
```

## The Metadata Walk

The generator resolves the application's `ModulesContainer` and uses a
`MetadataScanner` to visit every provider and controller class. For each class
it reads the AsyncAPI metadata left by the decorators:

- `@AsyncApiChannel` makes a class a channel handler. Classes without it
  contribute nothing.
- Each `@AsyncApiPub` / `@AsyncApiSub` method becomes one operation referencing
  the class's channel.
- `@AsyncApiMessage` / `@AsyncApiHeaders` register schemas under
  `components.schemas` and a message under `components.messages`, referenced via
  `$ref`.
- `@AsyncApiServer` declarations merge into the document's `servers` map.
- Binding decorators attach protocol bindings verbatim.

No extra module import is required in the consuming application — the walk reads
the running app you already created.

## Document Config

The second argument seeds the document's `info` object. Every field is optional.

| Field | Purpose | Default |
| --- | --- | --- |
| `title` | Application title | `AsyncAPI` |
| `version` | Document/API version (distinct from the spec version, always `3.0.0`) | `1.0.0` |
| `description` | Short application description | — |
| `termsOfService` | URL to the Terms of Service | — |
| `contact` | Contact `{ name?, url?, email? }` | — |
| `license` | License `{ name, url? }` | — |

Channels, operations, messages, and servers are discovered from metadata and are
never configured here. This is the AsyncAPI counterpart to
`@nestjs/swagger`'s `DocumentBuilder` for the parts that cannot be derived from
code.

## Versioning

Three versions appear in the output and are intentionally distinct:

- The **spec version** is always `3.0.0` (the `asyncapi` field).
- The **document version** is your API version (`info.version`, default
  `1.0.0`), set through the config.
- A **server version** is the broker protocol version
  (`@AsyncApiServer`'s `protocolVersion`), independent of both.

## Empty But Valid

An application with no AsyncAPI decorators still produces a valid (empty)
AsyncAPI 3.0 document: `info` plus empty `channels`, `operations`, and
`components`. This lets you wire generation in first and decorate handlers
incrementally.

## Validating The Output

Every generated document is treated as valid only when it passes the official
`@asyncapi/parser`. Add a check in a smoke test:

```ts
import { Parser } from '@asyncapi/parser';
import { getAsyncApiDocument } from '@nest-native/asyncapi';

const document = getAsyncApiDocument(app, { title: 'Orders', version: '1.0.0' });
const { diagnostics } = await new Parser().parse(document as never);

const errors = diagnostics.filter((d) => d.severity === 0);
if (errors.length > 0) {
  throw new Error(`Invalid AsyncAPI document: ${JSON.stringify(errors)}`);
}
```

Treat parser errors as build failures. Every sample in this repository validates
its generated document this way.

## Serialization

The document is plain JSON data. Serialize it with the exported helpers:

```ts
import { toJson, toYaml } from '@nest-native/asyncapi';

const json = toJson(document); // indented JSON
const yaml = toYaml(document); // block-style YAML 1.2
```

YAML is the canonical AsyncAPI interchange format, and JSON is offered
alongside. The YAML emitter is dependency-free, keeping the published package at
`"dependencies": {}`. To serve both over HTTP, see [Docs Route](docs-route.md).
