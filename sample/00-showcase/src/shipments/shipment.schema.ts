import { z } from 'zod';
import { JsonSchemaSource } from '@nest-native/asyncapi';

/**
 * The `order shipped` payload, described with Zod — the optional validation
 * world. Zod 4's native `z.toJSONSchema()` converts the Zod schema to JSON
 * Schema, which `@nest-native/asyncapi` registers verbatim. The package never
 * reflects over Zod itself, so any Zod-to-JSON-Schema converter works here.
 */
export const OrderShippedSchema = z.object({
  orderId: z.uuid(),
  carrier: z.enum(['ups', 'fedex', 'dhl']),
  shippedAt: z.iso.datetime(),
});

/**
 * The schema source handed to `@AsyncApiMessage`: a name for the
 * `components.schemas` entry plus the converted JSON Schema. `target: 'draft-7'`
 * emits the draft-07 dialect AsyncAPI 3.0 documents, inlined so it stands alone
 * under its component name.
 */
export const orderShippedMessage: JsonSchemaSource = {
  name: 'OrderShipped',
  schema: z.toJSONSchema(OrderShippedSchema, { target: 'draft-7' }),
};
