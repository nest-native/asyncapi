import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsNumber, IsString, IsUUID, Min } from 'class-validator';

/**
 * Message headers shared by the orders channel. Documented with `@ApiProperty`
 * exactly as an HTTP DTO would be for `@nestjs/swagger`; `@nest-native/asyncapi`
 * reuses the same chain to turn it into JSON Schema.
 */
export class OrderHeadersDto {
  @ApiProperty({ description: 'Correlation id propagated across services.' })
  @IsUUID()
  traceId!: string;
}

/**
 * The payload of the `order placed` message, described with class-validator
 * decorators and `@ApiProperty`. This is the default validation world — the
 * generator converts it to JSON Schema through the `@nestjs/swagger` chain.
 */
export class OrderPlacedDto {
  @ApiProperty({ description: 'Unique order identifier.' })
  @IsUUID()
  id!: string;

  @ApiProperty({ description: 'Customer who placed the order.' })
  @IsString()
  customer!: string;

  @ApiProperty({ minimum: 0, description: 'Order total in minor units.' })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ description: 'When the order was placed (ISO 8601).' })
  @IsISO8601()
  placedAt!: string;
}
