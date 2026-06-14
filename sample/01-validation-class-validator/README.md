# Sample 01 - class-validator validation

Documents an AsyncAPI 3.0 message whose payload and headers are described with
class-validator DTOs. The generator turns them into JSON Schema through the same
`@nestjs/swagger` chain that documents HTTP bodies — the default validation
world, with no parallel schema reflector.

## What It Demonstrates

- `@AsyncApiMessage(PaymentCapturedDto)` attaching a class-validator payload DTO
- `@AsyncApiHeaders(PaymentHeadersDto)` attaching a headers DTO
- DTOs becoming `components.schemas` entries referenced from `components.messages`
- The generated document passing official `@asyncapi/parser` validation

## Commands

```bash
npm run test --workspace nest-native-asyncapi-sample-01-validation-class-validator
npm run start --workspace nest-native-asyncapi-sample-01-validation-class-validator
```

`test` typechecks the sample and runs a smoke script that boots the app,
generates the document, asserts the schema/message wiring, and validates the
output with `@asyncapi/parser`. `start` prints the generated document to stdout.
