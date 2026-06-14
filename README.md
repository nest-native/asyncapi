# @nest-native/asyncapi

<p align="center">Decorator-first AsyncAPI 3.0 documentation generator for NestJS event-driven services — the AsyncAPI counterpart to @nestjs/swagger.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@nest-native/asyncapi"><img src="https://img.shields.io/npm/v/@nest-native/asyncapi.svg" alt="NPM Version" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="Package License" /></a>
  <img src="https://img.shields.io/badge/coverage-100%25-brightgreen.svg" alt="Test Coverage" />
  <img src="https://img.shields.io/badge/status-alpha-orange.svg" alt="Status: alpha" />
</p>

> [!WARNING]
> **Status: under construction.** The npm workspace builds, typechecks, tests at
> 100% coverage, and is CI-green. `AsyncApiModule.forRoot()` /
> `AsyncApiModule.forRootAsync()` and the spec-generator skeleton
> (`getAsyncApiDocument()`) exist: the generator walks NestJS metadata exactly as
> `@nestjs/swagger` walks controllers and emits an empty but valid AsyncAPI 3.0
> document. The AsyncAPI decorators (`@AsyncApiChannel`, `@AsyncApiPub`,
> `@AsyncApiSub`, `@AsyncApiMessage`, `@AsyncApiHeaders`, `@AsyncApiServer`) that
> populate channels and operations, and the sample catalog, arrive in later
> milestones. Do not depend on this in production yet.

## What This Is

`@nest-native/asyncapi` is a community NestJS integration that generates
[AsyncAPI 3.0](https://www.asyncapi.com/docs/reference/specification/v3.0.0)
documentation for event-driven services. The goal is a decorator-first,
Nest-native experience — the event/message counterpart to `@nestjs/swagger` for
HTTP. You decorate your `@nestjs/microservices` handlers and message DTOs, and
the package walks the same NestJS metadata `@nestjs/swagger` uses to emit a
spec-compliant `asyncapi.json` / `asyncapi.yaml`, served alongside an AsyncAPI
viewer.

It uses AsyncAPI spec primitives only; it does not hide AsyncAPI semantics
behind a facade. It is documentation only — not a runtime transport.

## Why

AsyncAPI documentation for NestJS is effectively unserved today:

- `nestjs-asyncapi` is the de-facto generator and is effectively abandoned:
  AsyncAPI 3.0 was requested in Dec 2023 with no progress
  ([`#518`](https://github.com/flamewow/nestjs-asyncapi/issues/518)), it breaks
  on current Node and `@nestjs/swagger`
  ([`#596`](https://github.com/flamewow/nestjs-asyncapi/issues/596)), and users
  openly ask whether it is still maintained
  ([`#578`](https://github.com/flamewow/nestjs-asyncapi/issues/578)).
- There is no official `@nestjs/asyncapi` to replace it.

This package's headline differentiators:

- **AsyncAPI 3.0 native** — built around the channels/operations/messages model
  that 3.0 introduced, not a 2.x port.
- **`@nestjs/swagger` mental model** — the same decorator-first, generate-on-build
  flow any Nest user already knows from documenting an HTTP API.
- **Validated output** — every generated spec is treated as valid only when it
  passes the official `@asyncapi/parser`.
- **A working docs route** — the viewer comes wired, not "bring your own".

## Compatibility

| Runtime | Supported line |
| --- | --- |
| Node.js | `>=20` |
| NestJS | `11.x` |
| AsyncAPI spec target | `3.0` (2.x: best-effort conversion only) |
| Transports | Kafka, NATS, MQTT, AMQP (bindings arrive in later milestones) |
| Validation | Zod and class-validator, both app-owned |

The published package keeps `"dependencies": {}`. The NestJS packages are
declared as `peerDependencies`, and the AsyncAPI parser and viewer are optional
peers, so applications install only the ecosystems they actually use.

## Repository Layout

This repository contains:

- [`packages/asyncapi`](packages/asyncapi): the `@nest-native/asyncapi` integration package
- [`scripts`](scripts): quality, coverage, complexity, and release-check helpers
- [`CONTRIBUTING.md`](CONTRIBUTING.md): contributor workflow, including the
  sample/library PR separation rule
- [`CHANGELOG.md`](CHANGELOG.md): release history and unreleased changes
- [`SECURITY.md`](SECURITY.md): vulnerability reporting and project security boundaries

Samples and a documentation site are part of the public learning path and arrive
in later milestones.

## Installation

```bash
npm i @nest-native/asyncapi
```

Required peers:

```bash
npm i @nestjs/common @nestjs/core reflect-metadata rxjs
```

## Usage (preview)

Register the module to wire global configuration:

```ts
import { Module } from '@nestjs/common';
import { AsyncApiModule } from '@nest-native/asyncapi';

@Module({
  imports: [
    AsyncApiModule.forRoot({
      defaultInfo: { title: 'Orders Service', version: '1.0.0' },
    }),
  ],
})
export class AppModule {}
```

Async configuration is supported through `AsyncApiModule.forRootAsync()`:

```ts
AsyncApiModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    defaultInfo: { title: config.getOrThrow('SERVICE_NAME') },
  }),
});
```

Both registrations return a global `DynamicModule` by default. Pass
`isGlobal: false` to scope it to a single module boundary.

### Generating a document

`getAsyncApiDocument()` is the AsyncAPI counterpart to
`SwaggerModule.createDocument`. It walks the running application's NestJS
metadata — the same `ModulesContainer` and `MetadataScanner` `@nestjs/swagger`
uses for controllers — and returns a spec-compliant AsyncAPI 3.0 document. Until
the decorator milestones land, the discovered handlers contribute no channels or
operations, so the result is an empty but valid 3.0 document:

```ts
import { NestFactory } from '@nestjs/core';
import { getAsyncApiDocument } from '@nest-native/asyncapi';

const app = await NestFactory.create(AppModule);

const document = getAsyncApiDocument(app, {
  title: 'Orders Service',
  version: '1.0.0',
});
// => { asyncapi: '3.0.0', info: { title, version }, channels: {}, operations: {}, components: {} }
```

## Migrating from `nestjs-asyncapi`

If you are moving off the abandoned 2.x
[`nestjs-asyncapi`](https://github.com/flamewow/nestjs-asyncapi), the
[migration guide](docs/migration-from-nestjs-asyncapi.md) maps every 2.x
decorator and the `AsyncApiDocumentBuilder` flow onto this package's AsyncAPI 3.0
model. It is validated end-to-end by porting the `nestjs-asyncapi` "felines"
sample app in
[`sample/05-migration-nestjs-asyncapi`](sample/05-migration-nestjs-asyncapi),
whose smoke test asserts the migration is faithful and validates the result with
the official `@asyncapi/parser`.

## Quality Gates

The repository ships the same review posture as its sibling `@nest-native`
packages, using `node:test` and `c8`:

- package build, typecheck, and coverage on Node.js 20 and 22
- coverage with `c8`, enforced at 100% for statements, branches, functions, and lines
- sticky PR comments for coverage, test performance, and cognitive complexity
- cognitive complexity enforcement with SonarJS threshold `15`
- package tarball validation and README link validation
- supply-chain audit for high-severity issues

Run the local gate with:

```bash
npm run ci
```

## Status and Roadmap

The spec-generator skeleton has landed. The planned path:

1. ~~**Bootstrap** — repo skeleton, empty package, CI green.~~ ✅
2. **Spec generator skeleton: walks NestJS metadata, emits an empty valid 3.0
   doc.** ✅ (current)
3. `@AsyncApiChannel` + `@AsyncApiPub` / `@AsyncApiSub` with a showcase sample.
4. DTO ↔ JSON Schema integration, validated against `@asyncapi/parser`.
5. Transport bindings for Kafka, NATS, MQTT, AMQP.
6. Docs route with the AsyncAPI viewer.
7. Migration guide from `nestjs-asyncapi`.
8. Documentation site. Release `v0.1`.

See [CHANGELOG.md](CHANGELOG.md) for what has landed.

## License

[MIT](LICENSE) © 2026 Rodrigo Nogueira.

Part of the [nest-native](https://github.com/nest-native) family, alongside
[@nest-native/drizzle](https://github.com/nest-native/drizzle) and
[@nest-native/trpc](https://github.com/nest-native/trpc).
