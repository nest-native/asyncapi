import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsNumber, IsString, IsUUID, Min } from 'class-validator';

/**
 * The payload of the `order placed` message, described with class-validator
 * decorators and `@ApiProperty` so the generator turns it into JSON Schema
 * through the `@nestjs/swagger` chain.
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
