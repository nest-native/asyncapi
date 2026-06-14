import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Cat, Feline, Lion, Tiger } from './feline.classes';

/**
 * The message envelope shared by every feline event. Mirrors the abstract
 * `Message<T>` base class in the `nestjs-asyncapi` sample: a correlation id, a
 * semantic version, a timestamp, and a polymorphic `payload`.
 *
 * The original sample exposed the `oneOf` of `Cat` / `Lion` / `Tiger` through
 * `@ApiProperty({ oneOf: [...] })` and registered the concrete classes via the
 * builder's `extraModels: [Cat, Lion, Tiger]`. `@nest-native/asyncapi` has no
 * separate `extraModels` step on the document builder, but it does not need one:
 * the builder-level list maps directly to the standard `@nestjs/swagger`
 * `@ApiExtraModels(...)` decorator on the DTO. Because `@AsyncApiMessage(...)`
 * walks the same `@nestjs/swagger` schema chain, the decorated subtypes are
 * emitted into `components.schemas` and the `getSchemaPath` references resolve.
 */
@ApiExtraModels(Cat, Lion, Tiger)
export class FelineEventDto {
  @ApiProperty({ format: 'uuid', description: 'Correlates related messages.' })
  correlationId!: string;

  @ApiProperty({ example: '1.0.1', description: 'Message schema version.' })
  version!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'When the event was produced.',
  })
  timestamp!: string;

  @ApiProperty({
    description: 'The feline the event is about.',
    oneOf: [
      { $ref: getSchemaPath(Cat) },
      { $ref: getSchemaPath(Lion) },
      { $ref: getSchemaPath(Tiger) },
    ],
  })
  payload!: Feline;
}

/**
 * The journaling message. The original sample used a `Record<string, unknown>`
 * payload; here it is a typed object so the generated schema is meaningful while
 * staying faithful to the "log an arbitrary event" intent.
 */
export class JournalEntryDto {
  @ApiProperty({ format: 'uuid', description: 'Correlates related messages.' })
  correlationId!: string;

  @ApiProperty({ description: 'The event that was journaled.' })
  event!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'When the entry was recorded.',
  })
  recordedAt!: string;
}
