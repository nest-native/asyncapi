import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { JsonSchemaSource } from '@nest-native/asyncapi';

/**
 * The `order shipped` payload, described with Zod — the optional validation
 * world. `zod-to-json-schema` converts the Zod schema to JSON Schema, which
 * `@nest-native/asyncapi` registers verbatim. The package never reflects over
 * Zod itself, so any Zod-to-JSON-Schema converter works here.
 */
export const OrderShippedSchema = z.object({
  orderId: z.string().uuid(),
  carrier: z.enum(['ups', 'fedex', 'dhl']),
  shippedAt: z.string().datetime(),
});

/**
 * The schema source handed to `@AsyncApiMessage`: a name for the
 * `components.schemas` entry plus the converted JSON Schema. `$refStrategy:
 * 'none'` inlines the schema so it stands alone under its component name.
 */
export const orderShippedMessage: JsonSchemaSource = {
  name: 'OrderShipped',
  schema: zodToJsonSchema(OrderShippedSchema, {
    $refStrategy: 'none',
    target: 'jsonSchema7',
  }),
};
