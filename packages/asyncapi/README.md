# @nest-native/asyncapi

<p align="center">Decorator-first AsyncAPI 3.0 documentation generator for NestJS event-driven services — the AsyncAPI counterpart to @nestjs/swagger.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@nest-native/asyncapi"><img src="https://img.shields.io/npm/v/@nest-native/asyncapi.svg" alt="NPM Version" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="Package License" /></a>
</p>

> [!WARNING]
> **Status: under construction.** The module
> (`AsyncApiModule.forRoot()` / `forRootAsync()`), the channel and operation
> decorators (`@AsyncApiChannel`, `@AsyncApiPub`, `@AsyncApiSub`), and document
> generation (`getAsyncApiDocument`) exist today. Message and header payloads
> (`@AsyncApiMessage`, `@AsyncApiHeaders`), transport bindings, the
> `@AsyncApiServer` decorator, and the hosted docs route land in later
> milestones. Do not depend on this in production yet.

## What This Is

`@nest-native/asyncapi` is a community NestJS integration that will make
AsyncAPI 3.0 documentation feel like a first-class Nest primitive — the
event/message counterpart to `@nestjs/swagger`. You decorate your
`@nestjs/microservices` handlers and message DTOs, and the package generates a
spec-compliant `asyncapi.json` / `asyncapi.yaml` served alongside an AsyncAPI
viewer.

It mirrors the mental model any Nest user already has from documenting an HTTP
API with `@nestjs/swagger`, while staying faithful to AsyncAPI 3.0's
channels/operations/messages separation. It is documentation only — not a
runtime transport.

## Compatibility

| Runtime | Supported line |
| --- | --- |
| Node.js | `>=20` |
| NestJS | `11.x` |
| AsyncAPI spec target | `3.0` (2.x: best-effort conversion only) |
| Transports | Kafka, NATS, MQTT, AMQP (bindings arrive in later milestones) |

The published package has no runtime dependencies. The NestJS packages are
declared as `peerDependencies`, and the AsyncAPI parser and viewer are optional
peers installed only when you need them.

## Installation

```bash
npm i @nest-native/asyncapi
```

Required peers:

```bash
npm i @nestjs/common @nestjs/core reflect-metadata rxjs
```

## Usage

Register the module, then declare channels and operations with decorators.
`@AsyncApiChannel` is the class-level counterpart to `@Controller('path')`, and
`@AsyncApiPub` / `@AsyncApiSub` are the method-level counterparts to the HTTP
verb decorators. `@AsyncApiPub` produces an AsyncAPI 3.0 `send` operation and
`@AsyncApiSub` produces a `receive` operation.

```ts
import { Module } from '@nestjs/common';
import {
  AsyncApiModule,
  AsyncApiChannel,
  AsyncApiPub,
  AsyncApiSub,
} from '@nest-native/asyncapi';

@AsyncApiChannel('orders', { address: 'orders.v1', title: 'Orders' })
class OrdersHandler {
  @AsyncApiPub({ operationId: 'orderPlaced' })
  publishOrderPlaced(): void {}

  @AsyncApiSub({ operationId: 'onOrderShipped' })
  handleOrderShipped(): void {}
}

@Module({
  imports: [
    AsyncApiModule.forRoot({
      defaultInfo: { title: 'Orders Service', version: '1.0.0' },
    }),
  ],
  controllers: [OrdersHandler],
})
export class AppModule {}
```

Generate the document from a running application — the AsyncAPI counterpart to
`SwaggerModule.createDocument`:

```ts
import { getAsyncApiDocument } from '@nest-native/asyncapi';

const document = getAsyncApiDocument(app, {
  title: 'Orders Service',
  version: '1.0.0',
});
```

Channel ids are explicit by design — they are never derived from the class name.
A channel's `address` defaults to its id; pass `address: null` to mark an
address that is unknown at design time, and operation ids default to the
decorated method name.

## Links

- Source and issues: [github.com/nest-native/asyncapi](https://github.com/nest-native/asyncapi)
- Changelog: [CHANGELOG.md](../../CHANGELOG.md)
- AsyncAPI 3.0 specification: [asyncapi.com](https://www.asyncapi.com/docs/reference/specification/v3.0.0)
- The nest-native family: [@nest-native/drizzle](https://www.npmjs.com/package/@nest-native/drizzle), [@nest-native/trpc](https://www.npmjs.com/package/@nest-native/trpc)
