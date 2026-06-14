# @nest-native/asyncapi

<p align="center">Decorator-first AsyncAPI 3.0 documentation generator for NestJS event-driven services — the AsyncAPI counterpart to @nestjs/swagger.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@nest-native/asyncapi"><img src="https://img.shields.io/npm/v/@nest-native/asyncapi.svg" alt="NPM Version" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="Package License" /></a>
</p>

> [!WARNING]
> **Status: under construction.** The module
> (`AsyncApiModule.forRoot()` / `forRootAsync()`), the channel and operation
> decorators (`@AsyncApiChannel`, `@AsyncApiPub`, `@AsyncApiSub`), message and
> header payloads (`@AsyncApiMessage`, `@AsyncApiHeaders`) with DTO ↔ JSON Schema
> generation, and document generation (`getAsyncApiDocument`) exist today.
> Transport bindings, the `@AsyncApiServer` decorator, and the hosted docs route
> land in later milestones. Do not depend on this in production yet.

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

## Message payloads

Attach a payload (and optional headers) to an operation with `@AsyncApiMessage`
and `@AsyncApiHeaders`. The generated message lands in `components.messages`,
its schemas in `components.schemas`, and the operation references the channel's
message — exactly as AsyncAPI 3.0 prescribes. Every generated document passes
the official [`@asyncapi/parser`](https://www.npmjs.com/package/@asyncapi/parser).

Two validation worlds are supported, mirroring `@nestjs/swagger`'s dual posture:

**class-validator DTOs (default).** Pass a DTO class. The package reuses the
`@nestjs/swagger` chain to turn it into JSON Schema — no parallel reflector — so
install `@nestjs/swagger` as a peer when you use this path.

```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import {
  AsyncApiChannel,
  AsyncApiHeaders,
  AsyncApiMessage,
  AsyncApiPub,
} from '@nest-native/asyncapi';

class OrderHeadersDto {
  @ApiProperty()
  @IsUUID()
  traceId!: string;
}

class OrderPlacedDto {
  @ApiProperty()
  @IsUUID()
  id!: string;
}

@AsyncApiChannel('orders', { address: 'orders.v1' })
class OrdersHandler {
  @AsyncApiPub({ operationId: 'orderPlaced' })
  @AsyncApiMessage(OrderPlacedDto, { name: 'OrderPlaced' })
  @AsyncApiHeaders(OrderHeadersDto)
  publishOrderPlaced(): void {}
}
```

**Zod (optional).** Convert a Zod schema to JSON Schema with
[`zod-to-json-schema`](https://www.npmjs.com/package/zod-to-json-schema) and pass
it as a `{ name, schema }` source. The generator registers the schema verbatim
and never reflects over Zod, so any Zod-to-JSON-Schema converter works.

```ts
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { AsyncApiMessage } from '@nest-native/asyncapi';

const OrderShipped = z.object({ orderId: z.string().uuid() });

class ShipmentsHandler {
  @AsyncApiSub({ operationId: 'onOrderShipped' })
  @AsyncApiMessage({
    name: 'OrderShipped',
    schema: zodToJsonSchema(OrderShipped, { $refStrategy: 'none' }),
  })
  handleOrderShipped(): void {}
}
```

The message name defaults to the DTO class name (or the schema source `name`),
the content type defaults to `application/json`, and a payload DTO shared across
messages is emitted once under its class name.

## Links

- Source and issues: [github.com/nest-native/asyncapi](https://github.com/nest-native/asyncapi)
- Changelog: [CHANGELOG.md](../../CHANGELOG.md)
- AsyncAPI 3.0 specification: [asyncapi.com](https://www.asyncapi.com/docs/reference/specification/v3.0.0)
- The nest-native family: [@nest-native/drizzle](https://www.npmjs.com/package/@nest-native/drizzle), [@nest-native/trpc](https://www.npmjs.com/package/@nest-native/trpc)
