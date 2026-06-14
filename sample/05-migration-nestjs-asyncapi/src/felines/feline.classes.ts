import { ApiProperty } from '@nestjs/swagger';

/**
 * The kinds of felines the sample documents. Ported verbatim from the
 * `nestjs-asyncapi` example so the migration is a like-for-like comparison.
 */
export enum GendersEnum {
  Male = 'male',
  Female = 'female',
}

/**
 * The base feline payload. In the original `nestjs-asyncapi` sample this was an
 * abstract `Feline` class whose subclasses were registered through
 * `extraModels`. `@nest-native/asyncapi` reuses the same `@nestjs/swagger` chain,
 * so the inheritance and `@ApiProperty` decorators carry over unchanged — the
 * difference is purely in how the document is assembled, not in how a DTO is
 * described.
 */
export class Feline {
  @ApiProperty({ description: 'Unique feline identifier.' })
  id!: number;

  @ApiProperty({ description: 'The feline name.', example: 'Whiskers' })
  name!: string;

  @ApiProperty({ description: 'Age in years.', minimum: 0 })
  age!: number;

  @ApiProperty({ enum: GendersEnum, enumName: 'GendersEnum' })
  gender!: GendersEnum;

  @ApiProperty({
    type: [String],
    description: 'Free-form tags attached to the feline.',
  })
  tags!: string[];
}

/**
 * A domestic cat — adds the cat-specific `breed`. Mirrors `Cat extends Feline`
 * in the original sample.
 */
export class Cat extends Feline {
  @ApiProperty({ example: 'Maine Coon', description: 'The cat breed.' })
  breed!: string;
}

/**
 * A lion — adds whether it leads a pride.
 */
export class Lion extends Feline {
  @ApiProperty({ description: 'Whether the lion leads a pride.' })
  leadsPride!: boolean;
}

/**
 * A tiger — adds the subspecies.
 */
export class Tiger extends Feline {
  @ApiProperty({ example: 'Bengal', description: 'The tiger subspecies.' })
  subspecies!: string;
}
