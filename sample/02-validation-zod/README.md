# Sample 02 - Zod validation

Documents an AsyncAPI 3.0 message whose payload is described with Zod. The Zod
schema is passed directly to `@AsyncApiMessage({ name, schema })`; the
generator detects it and converts it with Zod 4's native `z.toJSONSchema()`
(loading `zod` lazily), so the event contract is written once. Pre-computed
JSON Schema (`{ name, schema: z.toJSONSchema(...) }`) remains supported when
custom conversion options are needed, and any Zod-to-JSON-Schema converter
still works through that escape hatch.

## What It Demonstrates

- A Zod schema passed directly to `@AsyncApiMessage({ name, schema })`
- The generator converting it natively with Zod 4's `z.toJSONSchema()`
- The schema becoming a `components.schemas` entry referenced from
  `components.messages`
- The generated document passing official `@asyncapi/parser` validation

## Commands

```bash
npm run test --workspace nest-native-asyncapi-sample-02-validation-zod
npm run start --workspace nest-native-asyncapi-sample-02-validation-zod
```

`test` typechecks the sample and runs a smoke script that boots the app,
generates the document, asserts the schema/message wiring, and validates the
output with `@asyncapi/parser`. `start` prints the generated document to stdout.
