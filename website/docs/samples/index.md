# Samples

Samples are the fastest way to understand how `@nest-native/asyncapi` is meant to
feel inside a real Nest application. Every sample generates an AsyncAPI 3.0
document and validates it with the official `@asyncapi/parser`.

Start with `00-showcase` when you want the full application shape, then use the
focused samples when you want one concept at a time:

- [Catalog](catalog.md) lists every runnable sample and what it demonstrates.

The showcase combines all five decorators, both the class-validator and Zod
validation paths, Kafka and NATS bindings, and the docs route with the viewer in
one reference app.

## Running The Samples

Run the whole matrix — the showcase plus every focused sample — with:

```bash
npm run ci:sample
```

Run just the focused samples:

```bash
npm run sample:focused
```

Or run a single sample by its workspace name, for example:

```bash
npm run test --workspace nest-native-asyncapi-sample-02-validation-zod
```

Each sample boots the Nest application, asserts the generated document, and (for
the docs-route samples) serves the spec over HTTP, then validates the output with
`@asyncapi/parser`. Samples are release blockers and run in the dedicated
`Sample validation` CI job. See [Quality and CI](../quality-and-ci.md).
