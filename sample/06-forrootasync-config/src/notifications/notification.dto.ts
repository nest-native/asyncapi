import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUUID } from 'class-validator';

/**
 * The `notification dispatched` payload, described with class-validator
 * decorators and `@ApiProperty`. The generator converts it to JSON Schema
 * through the same `@nestjs/swagger` chain used for HTTP bodies.
 */
export class NotificationDispatchedDto {
  @ApiProperty({ description: 'Unique notification identifier.' })
  @IsUUID()
  id!: string;

  @ApiProperty({ description: 'Identifier of the recipient.' })
  @IsUUID()
  recipientId!: string;

  @ApiProperty({
    enum: ['email', 'sms', 'push'],
    description: 'Delivery channel the notification was sent over.',
  })
  @IsIn(['email', 'sms', 'push'])
  channel!: string;
}
