# Changelog

All notable user-facing changes to `@nest-native/asyncapi` are tracked here.

This project follows semantic versioning for the published package. Sample,
documentation, and CI-only changes may remain in `Unreleased` until the next
package release is useful for users.

## Unreleased

### Added

- Migration guide from `nestjs-asyncapi`
  (`docs/migration-from-nestjs-asyncapi.md`), mapping every 2.x decorator and the
  `AsyncApiDocumentBuilder` flow onto the AsyncAPI 3.0 model. Validated by
  `sample/05-migration-nestjs-asyncapi`, which ports the `nestjs-asyncapi`
  "felines" sample app and validates the result with `@asyncapi/parser`.
- `escapeJsonPointerSegment` and `buildRef` reference helpers (RFC 6901) are
  exported for advanced use.

### Fixed

- Generated `$ref`s now JSON-Pointer-escape each segment (`/` → `~1`, `~` → `~0`),
  so channel ids containing `/` — common when channels mirror
  `@nestjs/microservices` `@EventPattern` strings such as `ms/create/feline` —
  produce references that resolve and pass `@asyncapi/parser` validation.

### Added

- Spec-generator skeleton. `getAsyncApiDocument(app, config)` — the AsyncAPI
  counterpart to `SwaggerModule.createDocument` — walks the running
  application's NestJS metadata (the same `ModulesContainer` and
  `MetadataScanner` `@nestjs/swagger` uses for controllers) and emits an empty
  but valid AsyncAPI 3.0 document.
- `AsyncApiDocument` type model for the emitted document, an `AsyncApiDocumentConfig`
  for document-level `info` metadata, and an `AsyncApiDocumentScanner` that
  performs the metadata walk. Channels, operations, and components are emitted
  empty until the decorator milestones populate them.

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
