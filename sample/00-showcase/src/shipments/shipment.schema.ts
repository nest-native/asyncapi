import { z } from 'zod';
import { ZodSchemaSource } from '@nest-native/asyncapi';

/**
 * The `order shipped` payload, described with Zod — the optional validation
 * world. The Zod schema is handed to `@AsyncApiMessage` as-is: the generator
 * detects it and converts it lazily with Zod 4's native `z.toJSONSchema()`
 * (in the draft-07 dialect AsyncAPI 3.0 documents default to), so the event
 * contract is written exactly once. Passing pre-computed JSON Schema
 * (`{ name, schema: z.toJSONSchema(...) }`) remains supported when custom
 * conversion options are needed.
 */
export const OrderShippedSchema = z.object({
  orderId: z.uuid(),
  carrier: z.enum(['ups', 'fedex', 'dhl']),
  shippedAt: z.iso.datetime(),
});

/**
 * The schema source handed to `@AsyncApiMessage`: a name for the
 * `components.schemas` entry plus the Zod schema itself.
 */
export const orderShippedMessage: ZodSchemaSource = {
  name: 'OrderShipped',
  schema: OrderShippedSchema,
};
