# Changelog

All notable user-facing changes to `@nest-native/asyncapi` are tracked here.

This project follows semantic versioning for the published package. Sample,
documentation, and CI-only changes may remain in `Unreleased` until the next
package release is useful for users.

## 0.1.1 - 2026-06-15

A documentation-truth and samples release. No runtime behavior changed; the
published package keeps `"dependencies": {}`.

### Added

- `sample/06-forrootasync-config`: a focused sample that registers the module
  with `AsyncApiModule.forRootAsync`, resolving the document defaults
  asynchronously from an injected `ConfigService` before generating the
  document. Its smoke test asserts the async-resolved config seeds the
  generated `info` block and validates the document with `@asyncapi/parser`.
  Wired into the sample matrix and the sample catalog.

### Docs

- Dropped the "under construction" framing now that the v1 surface is complete.
  The package README's `[!WARNING]` status block is replaced with a `[!NOTE]`
  "v0.1.x — stable, v1 surface complete" block, and the stale "scaffold" /
  "later milestones" language in `CONTRIBUTING.md`, the `AsyncApiModule` and
  `interfaces` JSDoc, the scanner and document-model JSDoc, and the showcase
  sample README is corrected to the shipped reality.

## 0.1.0 - 2026-06-14

First public release of `@nest-native/asyncapi`. The package generates AsyncAPI
3.0 documentation from decorated NestJS handlers, mirroring `@nestjs/swagger` for
the event and message side, and ships a docs route with the AsyncAPI viewer.

### Added

- Documentation site built with Docusaurus under `website/`, covering getting
  started, the five decorators, document generation, the docs route, transport
  bindings, the public API reference, validation (class-validator and Zod), the
  `nestjs-asyncapi` migration, the sample catalog, and project reference pages
  (support policy, quality and CI, security, release, contributing, roadmap). A
  `docs-site` CI job builds the site (`onBrokenLinks: throw`), a
  `deploy-docs.yml` workflow publishes it to GitHub Pages, and `npm run ci` now
  includes `ci:docs` plus a docs supply-chain audit.

This release rolls up the v0.0.x development line:

- `AsyncApiModule.forRoot()` / `forRootAsync()` for global configuration and
  `AsyncApiModule.setup()` for serving the viewer.
- The five decorators (`@AsyncApiChannel`, `@AsyncApiPub` / `@AsyncApiSub`,
  `@AsyncApiMessage`, `@AsyncApiHeaders`, `@AsyncApiServer`) plus the binding
  decorators (`@AsyncApiChannelBindings`, `@AsyncApiOperationBindings`,
  `@AsyncApiMessageBindings`).
- `getAsyncApiDocument()` metadata discovery, DTO and Zod schema generation
  through the `@nestjs/swagger` chain, JSON/YAML serializers, RFC 6901 reference
  helpers, and typed Kafka, NATS, MQTT, and AMQP bindings.
- A migration guide from `nestjs-asyncapi`, validated by a ported sample app, and
  a sample catalog whose every generated document passes `@asyncapi/parser`.

Detailed entries from the development line, rolled into this release:

- Spec-generator skeleton. `getAsyncApiDocument(app, config)` — the AsyncAPI
  counterpart to `SwaggerModule.createDocument` — walks the running
  application's NestJS metadata (the same `ModulesContainer` and
  `MetadataScanner` `@nestjs/swagger` uses for controllers) and emits a valid
  AsyncAPI 3.0 document.
- The `@AsyncApiChannel`, `@AsyncApiPub` / `@AsyncApiSub`, `@AsyncApiMessage`,
  `@AsyncApiHeaders`, and `@AsyncApiServer` decorators that populate channels,
  operations, messages, and servers from handler metadata.
- DTO ↔ JSON Schema integration through the `@nestjs/swagger` chain, with a Zod
  path via `zod-to-json-schema`, and output validated against `@asyncapi/parser`.
- Typed Kafka, NATS, MQTT, and AMQP transport bindings at the server, channel,
  operation, and message scopes, attached with `@AsyncApiChannelBindings`,
  `@AsyncApiOperationBindings`, and `@AsyncApiMessageBindings`.
- The docs route: `AsyncApiModule.setup()` serves the AsyncAPI viewer plus the
  raw JSON and YAML over the application's existing HTTP server, adapter-agnostic
  across Express and Fastify.
- Migration guide from `nestjs-asyncapi`
  (`docs/migration-from-nestjs-asyncapi.md`), mapping every 2.x decorator and the
  `AsyncApiDocumentBuilder` flow onto the AsyncAPI 3.0 model. Validated by
  `sample/05-migration-nestjs-asyncapi`, which ports the `nestjs-asyncapi`
  "felines" sample app and validates the result with `@asyncapi/parser`.
- `escapeJsonPointerSegment` and `buildRef` reference helpers (RFC 6901),
  exported for advanced use, so generated `$ref`s JSON-Pointer-escape each
  segment (`/` → `~1`, `~` → `~0`) — channel ids containing `/`, common when
  channels mirror `@EventPattern` strings such as `ms/create/feline`, resolve and
  pass `@asyncapi/parser` validation.

The published package keeps `"dependencies": {}`. The NestJS packages are
declared as `peerDependencies`, and the AsyncAPI parser, viewer, `@nestjs/swagger`,
and validation libraries are optional peers.

## 0.0.0 - 2026-06-13

### Added

- Initial repository scaffold (`v0.0.1-scaffold` milestone).
- npm workspace skeleton for `@nest-native/asyncapi` with `node:test` + `c8`
  coverage (enforced at 100%), ESLint + SonarJS cognitive-complexity gate
  (threshold `15`), `tsc`-only build, package tarball validation, README link
  validation, and a high-severity supply-chain audit.
- `AsyncApiModule` shell exposing `AsyncApiModule.forRoot()` and
  `AsyncApiModule.forRootAsync()`, each returning a global `DynamicModule` that
  provides the resolved module options. The AsyncAPI decorators
  (`@AsyncApiChannel`, `@AsyncApiPub`, `@AsyncApiSub`, `@AsyncApiMessage`,
  `@AsyncApiHeaders`, `@AsyncApiServer`) and the document generator are
  intentionally not yet implemented.
- CI for build, typecheck, and coverage on Node.js 20 and 22, sticky PR
  comments for coverage, test performance, and cognitive complexity, plus
  release and supply-chain checks.

The published package keeps `"dependencies": {}`. The NestJS packages are
declared as `peerDependencies`, and the AsyncAPI parser and viewer are optional
peers.
