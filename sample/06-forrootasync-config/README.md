# Sample 06 - forRootAsync configuration

Registers `@nest-native/asyncapi` with `AsyncApiModule.forRootAsync`, resolving
the AsyncAPI document defaults asynchronously from an injected provider instead
of inlining them. This is the pattern an application uses to seed its AsyncAPI
metadata from environment variables, a secrets manager, or a remote config
server.

## What It Demonstrates

- `AsyncApiModule.forRootAsync({ imports, inject, useFactory })` awaiting a
  `ConfigService` to produce the module's `defaultInfo`
- Reading the resolved options back from the DI container under
  `ASYNC_API_MODULE_OPTIONS` and feeding them into `getAsyncApiDocument`
- The generated document's `info.title` / `info.version` coming entirely from
  the async-resolved config (`Notifications Service` / `2.1.0`)
- A `@AsyncApiChannel` handler with a class-validator `@AsyncApiMessage` payload,
  proving the decorators are independent of how the module was registered
- The generated document passing official `@asyncapi/parser` validation

## Commands

```bash
npm run test --workspace nest-native-asyncapi-sample-06-forrootasync-config
npm run start --workspace nest-native-asyncapi-sample-06-forrootasync-config
```

`test` typechecks the sample and runs a smoke script that boots the app,
generates the document, asserts the async config seeded the `info` block and the
channel/message wiring, and validates the output with `@asyncapi/parser`.
`start` prints the generated document to stdout.

## Main Files

- `src/config/config.service.ts`: the async configuration provider.
- `src/config/config.module.ts`: exports `ConfigService` for injection.
- `src/app.module.ts`: imports `AsyncApiModule.forRootAsync`, injecting
  `ConfigService` into the options factory.
- `src/notifications/notifications.handler.ts`: the channel handler.
- `src/notifications/notification.dto.ts`: the class-validator payload DTO.
- `src/asyncapi.ts`: reads the resolved module options and builds the document.
- `scripts/smoke.ts`: boots the app, asserts the wiring, and validates with
  `@asyncapi/parser`.
