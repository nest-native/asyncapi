# Changelog

All notable user-facing changes to `@nest-native/asyncapi` are tracked here.

This project follows semantic versioning for the published package. Sample,
documentation, and CI-only changes may remain in `Unreleased` until the next
package release is useful for users.

## Unreleased

No user-facing changes yet.

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
