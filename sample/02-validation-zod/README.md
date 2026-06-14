# Sample 02 - Zod validation

Documents an AsyncAPI 3.0 message whose payload is described with Zod and
converted to JSON Schema with `zod-to-json-schema`. The generator registers the
converted schema verbatim — it never reflects over Zod itself, so any
Zod-to-JSON-Schema converter works.

## What It Demonstrates

- A Zod schema converted to JSON Schema with `zod-to-json-schema`
- `@AsyncApiMessage({ name, schema })` attaching a pre-computed JSON Schema
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
