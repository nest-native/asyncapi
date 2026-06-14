# Release Guide

Use this checklist when publishing `@nest-native/asyncapi`. A release is worth
doing when the package metadata, README, public API, files shipped in the npm
tarball, or runtime behavior has changed in a way users benefit from.

Sample-only and docs-site-only changes can usually wait for the next package
release unless they also fix package documentation, release metadata, or
published files.

## Before Bumping

Confirm the package is ready:

```bash
npm run ci
npm run security:audit
```

Review the diff for:

- `CHANGELOG.md` entries that describe user-facing changes
- public API changes
- dependency and lockfile churn
- install or lifecycle scripts
- docs examples that expose secrets or unsafe server hosts
- sample changes that reveal a package bug

The published package must keep `"dependencies": {}` empty. Runtime integrations
belong in `peerDependencies`; package-local tooling belongs in
`devDependencies`.

## Version Sync

When bumping `packages/asyncapi/package.json`, update every sample dependency on
`@nest-native/asyncapi` to the exact same version:

```bash
npm install
npm run release:check:sample-versions
```

`npm install` refreshes the workspace lockfile so samples resolve the same
version that will be packed. Version drift between `packages/asyncapi` and
`sample/*` is a release blocker.

Move relevant `CHANGELOG.md` entries from `Unreleased` into the new version
section before opening the release PR.

## Release Checks

Run the release gate before publishing:

```bash
npm run release:check
npm ls @nest-native/asyncapi --workspaces --depth=0
npm run ci
```

`release:check` validates README/docs links, sample version sync, and the
package tarball.

## Publish

Publish from a clean, reviewed, merged `main` branch:

```bash
git status --short --branch
npm publish --workspace @nest-native/asyncapi --access public
```

Do not publish from a feature branch or with uncommitted files.

## Tag

After the registry version is confirmed, tag the exact release commit:

```bash
git tag v<version>
git push origin v<version>
```

## Post-Publish Verification

Re-run the full CI with samples pinned to the published version, in a clean
consumer, so the checks cannot pass through a local workspace link. Confirm the
published tarball exposes the package entrypoints and that a clean consumer can
compile a Nest testing module with the package.
