import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsUUID, Min } from 'class-validator';

/**
 * Message headers describing the originating partner.
 */
export class PaymentHeadersDto {
  @ApiProperty({ description: 'Identifier of the payment partner.' })
  @IsUUID()
  partnerId!: string;
}

/**
 * The `payment captured` payload, described with class-validator decorators and
 * `@ApiProperty`. The generator converts it to JSON Schema through the same
 * `@nestjs/swagger` chain used for HTTP bodies — no parallel reflector.
 */
export class PaymentCapturedDto {
  @ApiProperty({ description: 'Unique payment identifier.' })
  @IsUUID()
  id!: string;

  @ApiProperty({ minimum: 0, description: 'Captured amount in minor units.' })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({
    enum: ['EUR', 'USD', 'GBP'],
    description: 'ISO 4217 currency code.',
  })
  @IsIn(['EUR', 'USD', 'GBP'])
  currency!: string;
}
