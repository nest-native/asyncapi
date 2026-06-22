---
title: Why Native
description: How @nest-native/asyncapi differs from hand-written spec files and the abandoned nestjs-asyncapi 2.x package.
---

# Why Native

AsyncAPI already gives event-driven systems a strong, language-neutral way to
describe channels, operations, and messages. NestJS applications need a second
thing: a way to derive that description from the handlers and DTOs they already
write, using the modules, providers, and metadata reflection they already use.

`@nest-native/asyncapi` exists for that Nest-facing layer. It should make
AsyncAPI feel at home in a Nest codebase without turning AsyncAPI into a
different model.

## The Problem It Solves

Teams documenting event-driven Nest services usually land in one of two places:

- A hand-maintained `asyncapi.yaml` that drifts from the code, because nothing
  ties the spec to the actual handlers and DTOs.
- The de-facto `nestjs-asyncapi` package, which is effectively abandoned: it is
  AsyncAPI 2.x only, AsyncAPI 3.0 was requested in December 2023 with no
  progress, and it breaks on current Node and `@nestjs/swagger`.

Both leave you maintaining the contract by hand. This package derives the
contract from decorators, the same way `@nestjs/swagger` derives OpenAPI from
`@Controller` metadata.

## Comparison

| Approach | Good fit | Tradeoff |
| --- | --- | --- |
| Hand-written `asyncapi.yaml` | Tiny or stable specs, non-Nest stacks | Drifts from code; no link to handlers, DTOs, or DI |
| `nestjs-asyncapi` (2.x) | Legacy apps already on it | Abandoned, AsyncAPI 2.x only, breaks on current Node and `@nestjs/swagger` |
| Generic AsyncAPI codegen | Spec-first teams | Inverts the flow; the spec is the source, not the Nest code |
| `@nest-native/asyncapi` | Nest apps that want AsyncAPI 3.0 derived from decorated handlers and DTOs | Adds a small Nest-facing decorator API to learn |

The package does not compete with the AsyncAPI specification or its tooling.
AsyncAPI remains the document model. This package is the Nest integration layer
that produces a valid document from your code.

## What Stays AsyncAPI

These stay AsyncAPI concepts, expressed with spec primitives only:

- The channels, operations, and messages separation that 3.0 introduced.
- Protocol bindings for Kafka, NATS, MQTT, and AMQP.
- JSON Schema payloads and headers under `components.schemas`.
- `$ref` wiring between channels, operations, messages, and schemas.

The package never invents non-standard AsyncAPI extensions, and every generated
document is treated as valid only when it passes the official
`@asyncapi/parser`.

## What Becomes Nest-Native

These become package-supported Nest patterns:

- `AsyncApiModule.forRoot()` and `forRootAsync()` for global configuration.
- `@AsyncApiChannel()`, `@AsyncApiPub()`, `@AsyncApiSub()`,
  `@AsyncApiMessage()`, `@AsyncApiHeaders()`, and `@AsyncApiServer()` for
  metadata.
- `getAsyncApiDocument()` for the metadata walk, mirroring
  `SwaggerModule.createDocument`.
- `AsyncApiModule.setup()` for serving the viewer, mirroring
  `SwaggerModule.setup`.

The goal is not to replace AsyncAPI semantics. The goal is to let those
semantics fall out of ordinary Nest handlers and DTOs.

## Validation Boundary

The canonical Nest path is DTO classes documented through the `@nestjs/swagger`
schema chain. Pass a DTO class to `@AsyncApiMessage()` and the generator reuses
that exact chain to produce JSON Schema, so HTTP and event schemas come from the
same reflector.

Zod is supported as an optional application-owned path: convert a Zod schema
with `z.toJSONSchema()` and pass the resulting `{ name, schema }` to
`@AsyncApiMessage()`. The package does not introduce a parallel schema reflector
and does not make Zod a runtime dependency. See [Validation](validation.md).

## Security Boundary

This package generates documentation that may describe internal schemas and
broker locations. Keep these rules in reviews:

- Guard the docs route behind the same auth as any other internal surface — a
  spec can leak schema details that are not meant for unauthenticated readers.
- Keep secrets, tokens, and internal identifiers out of DTOs, example payloads,
  and `@AsyncApiServer` hosts.
- Treat `@AsyncApiServer` hosts as trusted configuration, not user input, to
  avoid URL injection in the rendered viewer.

See [Security](security.md) for the full checklist.
