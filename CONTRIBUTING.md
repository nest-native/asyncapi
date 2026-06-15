# Contributing

Thanks for helping improve `@nest-native/asyncapi`.

## Project Status

This package is at `v0.1.x` — stable, with the v1 surface complete. The public
AsyncAPI decorators (`@AsyncApiChannel`, `@AsyncApiPub`, `@AsyncApiSub`,
`@AsyncApiMessage`, `@AsyncApiHeaders`, `@AsyncApiServer`) and binding
decorators, the `getAsyncApiDocument()` generator, the docs route with viewer,
the `nestjs-asyncapi` migration guide, and the sample catalog have all landed.
Contributions now focus on hardening the public API, expanding the samples and
docs, and keeping every generated document valid against `@asyncapi/parser`. As
a 0.x release the public API may still evolve.

## Sample Work Must Stay Separate From Library Fixes

Once samples exist, sample PRs are allowed to change sample code, docs, CI
wiring, and release checks that are directly needed for samples. They must not
include changes under `packages/asyncapi/**`.

If a sample exposes a package bug, stop the sample PR and use this workflow:

1. Stash the sample and docs work, including untracked files:

   ```bash
   git stash push -u -m "sample work before library fix"
   ```

2. Create a separate library-fix branch from `main`.
3. Fix the package bug with focused regression tests.
4. Run the package validation commands for that fix.
5. Open and merge the library-fix PR first.
6. Return to the sample branch and re-apply the stash:

   ```bash
   git stash pop
   ```

7. Before committing the sample PR, verify the touched package files list is
   empty:

   ```bash
   git diff --name-only main...HEAD -- packages/asyncapi
   git diff --cached --name-only -- packages/asyncapi
   ```

If either command prints files, split those package changes into a dedicated
library-fix PR before continuing the sample PR.

## Local Validation

Run the full local gate before opening a PR:

```bash
npm run ci
```

This runs typecheck, coverage (enforced at 100%), cognitive complexity checks,
release checks (README links and package tarball), and the supply-chain audit.

## Library-Fix PR Checklist

- The PR includes a regression test under `packages/asyncapi/test`.
- The PR does not include sample implementation work.
- `npm run test:cov` passes at 100% coverage.
- `npm run complexity:check` and `npm run complexity:report` pass when package
  source files are touched.
- The PR body includes a short security pass, reviewing any dependency or
  `peerDependencies` changes (the published `dependencies` must stay `{}`).
