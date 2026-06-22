# Validation

`@AsyncApiMessage` and `@AsyncApiHeaders` turn a payload into JSON Schema for the
generated document. The package supports both validation worlds Nest users
already use, and never introduces a parallel schema reflector.

## class-validator DTOs (default)

Pass a DTO class. The generator resolves it through the same `@nestjs/swagger`
chain that documents HTTP bodies, so the event-side schema matches the HTTP-side
schema for the same DTO. Document the DTO with `@ApiProperty` (and validate at
runtime with `class-validator` as usual).

```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class OrderPlacedDto {
  @ApiProperty()
  @IsString()
  orderId!: string;

  @ApiProperty()
  @IsNumber()
  total!: number;
}
```

```ts
@AsyncApiMessage(OrderPlacedDto, { name: 'OrderPlaced' })
@AsyncApiHeaders(OrderHeadersDto)
publishOrderPlaced(): void {}
```

The DTO is registered once under `components.schemas`, including any nested DTOs
it references, and the message's `payload` is a `$ref` to it. A DTO reused across
several messages is emitted a single time.

This path requires the optional peer `@nestjs/swagger`. If it is missing, the
generator throws an actionable error telling you to install it or pass a
pre-computed schema instead.

## Zod payloads (optional)

For applications using Zod, convert the schema once with Zod 4's native
`z.toJSONSchema()` and pass the resulting `{ name, schema }` source. The
generator registers the schema verbatim — it never reflects over Zod itself.

```ts
import { z } from 'zod';
import { JsonSchemaSource } from '@nest-native/asyncapi';

export const MetricReportedSchema = z.object({
  name: z.string().min(1),
  value: z.number(),
  unit: z.enum(['ms', 'count', 'bytes']),
  reportedAt: z.iso.datetime(),
});

export const metricReportedMessage: JsonSchemaSource = {
  name: 'MetricReported',
  schema: z.toJSONSchema(MetricReportedSchema, { target: 'draft-7' }),
};
```

```ts
@AsyncApiMessage(metricReportedMessage, { summary: 'A single metric sample.' })
publishMetricReported(): void {}
```

`zod` is an optional peer. It is only needed in application code that produces
the schema source — the package itself never imports it.

## Mixing Both

Both styles coexist in one application. The showcase sample uses
class-validator DTOs for orders and a Zod payload for shipments, in the same
document. Pick per message based on how that part of the application already
validates.

## Name Collisions

Schema and message names must be unique. Registering two structurally different
schemas (or messages) under the same name is a build failure, surfacing an
accidental collision instead of silently overwriting a definition. Rename one of
the DTOs or schema sources so each component name is unique.

## Content Type

`@AsyncApiMessage` defaults `contentType` to `application/json`. Override it when
a message uses a different encoding:

```ts
@AsyncApiMessage(AvroPayloadDto, { contentType: 'application/avro' })
publishAvro(): void {}
```

For runnable examples, see
[`sample/01-validation-class-validator`](https://github.com/nest-native/asyncapi/tree/main/sample/01-validation-class-validator)
and
[`sample/02-validation-zod`](https://github.com/nest-native/asyncapi/tree/main/sample/02-validation-zod).
