# Quick Start

Install the package:

```bash
npm i @nest-native/asyncapi
```

Install the required Nest peers:

```bash
npm i @nestjs/common @nestjs/core reflect-metadata rxjs
```

Generating JSON Schema from DTO classes uses the same chain as `@nestjs/swagger`,
so install it (and a validation library) when you document DTO payloads:

```bash
npm i @nestjs/swagger class-validator class-transformer
```

To serve the docs route you also need an HTTP platform, and to validate the
generated document you can install the official parser:

```bash
npm i @nestjs/platform-express
npm i -D @asyncapi/parser
```

## Register The Module

`AsyncApiModule.forRoot()` wires global configuration. It returns a global
`DynamicModule` by default; pass `isGlobal: false` to scope it.

```ts
import { Module } from '@nestjs/common';
import { AsyncApiModule } from '@nest-native/asyncapi';

@Module({
  imports: [
    AsyncApiModule.forRoot({
      defaultInfo: { title: 'Orders Service', version: '1.0.0' },
    }),
  ],
})
export class AppModule {}
```

## Decorate A Handler

Declare the channel at the class level and the operations at the method level.
The channel id is explicit by design — the generator never derives it from the
class name.

```ts
import { Controller } from '@nestjs/common';
import {
  AsyncApiChannel,
  AsyncApiMessage,
  AsyncApiPub,
  AsyncApiSub,
} from '@nest-native/asyncapi';
import { OrderPlacedDto } from './order.dto';

@Controller()
@AsyncApiChannel('orders', {
  address: 'orders.v1',
  description: 'Lifecycle events for customer orders.',
})
export class OrdersHandler {
  @AsyncApiPub({ operationId: 'orderPlaced' })
  @AsyncApiMessage(OrderPlacedDto)
  publishOrderPlaced(): void {
    // Transport is out of scope; emit through @nestjs/microservices here.
  }

  @AsyncApiSub({ operationId: 'onOrderPlaced' })
  @AsyncApiMessage(OrderPlacedDto)
  handleOrderPlaced(): void {
    // A real subscriber updates read models or notifies the customer here.
  }
}
```

The DTO is an ordinary class documented with `@nestjs/swagger`:

```ts
import { ApiProperty } from '@nestjs/swagger';

export class OrderPlacedDto {
  @ApiProperty()
  orderId!: string;

  @ApiProperty()
  total!: number;
}
```

## Generate The Document

`getAsyncApiDocument()` is the AsyncAPI counterpart to
`SwaggerModule.createDocument`. It walks the running application's NestJS
metadata and returns a spec-compliant AsyncAPI 3.0 document.

```ts
import { NestFactory } from '@nestjs/core';
import { getAsyncApiDocument } from '@nest-native/asyncapi';
import { AppModule } from './app.module';

const app = await NestFactory.create(AppModule);

const document = getAsyncApiDocument(app, {
  title: 'Orders Service',
  version: '1.0.0',
  description: 'Event-driven order lifecycle, documented with AsyncAPI 3.0.',
});
```

## Serve The Docs Route

`AsyncApiModule.setup()` mirrors `SwaggerModule.setup`: it mounts the viewer
page and the raw JSON and YAML on the application's existing HTTP server. Call it
before `app.listen()`.

```ts
AsyncApiModule.setup('async-docs', app, document, {
  title: 'Orders Service — AsyncAPI',
});

await app.listen(3000);
// Viewer:  http://localhost:3000/async-docs
// JSON:    http://localhost:3000/async-docs-json
// YAML:    http://localhost:3000/async-docs-yaml
```

## Next Steps

- Read [Decorators](decorators.md) for every decorator and its options.
- Read [Document Generation](document-generation.md) for the metadata walk.
- Read [Docs Route](docs-route.md) for route options and adapter support.
- Read [Bindings](bindings.md) to add Kafka, NATS, MQTT, or AMQP metadata.
- Use the [Samples](samples/index.md) for runnable examples of each feature.
