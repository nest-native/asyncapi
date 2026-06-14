---
title: Introduction
description: What @nest-native/asyncapi does and does not own for NestJS event-driven services.
---

# Introduction

`@nest-native/asyncapi` is a community NestJS integration that generates
[AsyncAPI 3.0](https://www.asyncapi.com/docs/reference/specification/v3.0.0)
documentation for event-driven services. It is the event and message
counterpart to `@nestjs/swagger` for HTTP: you decorate your handlers and
message DTOs, and the package walks the same NestJS metadata `@nestjs/swagger`
uses to emit a spec-compliant `asyncapi.json` / `asyncapi.yaml`, served
alongside an AsyncAPI viewer.

The package is documentation only. It is not a runtime transport — keep using
`@nestjs/microservices` or `@nest-native/kafka` to actually send and receive
messages. This library describes those flows; it does not run them.

It supplies the Nest-facing integration layer:

- `AsyncApiModule.forRoot()` and `AsyncApiModule.forRootAsync()` for global configuration.
- `@AsyncApiChannel()` for the channel a handler class operates on.
- `@AsyncApiPub()` / `@AsyncApiSub()` for `send` / `receive` operations.
- `@AsyncApiMessage()` and `@AsyncApiHeaders()` for payload and headers schemas.
- `@AsyncApiServer()` for the brokers the application connects to.
- `getAsyncApiDocument()` to build the document, and `AsyncApiModule.setup()` to serve it.

## Design Goals

The package should feel native in NestJS projects and faithful to AsyncAPI 3.0:

- Nest owns dependency injection, module boundaries, and metadata discovery.
- AsyncAPI owns the channels, operations, and messages model — the package
  never hides those semantics behind a facade.
- Schemas reuse the `@nestjs/swagger` chain when class-validator DTOs are in
  play, so there is no parallel reflector.
- Optional integrations stay optional. The AsyncAPI parser, the viewer,
  `@nestjs/swagger`, Zod, and `zod-to-json-schema` are peer capabilities, not
  runtime dependencies pulled into every app.

## When To Use It

Use this package when your Nest application produces or consumes messages and
you want documentation that mirrors how you already document HTTP:

- You run `@nestjs/microservices` handlers (`@MessagePattern`, `@EventPattern`)
  or a broker integration and want them described as AsyncAPI channels and
  operations.
- You want a single generated spec that passes the official parser.
- You want a docs route with a working viewer, not a "wire it yourself"
  experience.
- You are moving off the abandoned `nestjs-asyncapi` 2.x package.

For the design tradeoffs, see [Why Native](why-native.md). For the first
runnable setup, continue with [Quick Start](quick-start.md).
