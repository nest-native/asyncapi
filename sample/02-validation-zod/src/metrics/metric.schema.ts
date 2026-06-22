import { z } from 'zod';
import { JsonSchemaSource } from '@nest-native/asyncapi';

/**
 * The `metric reported` payload, described with Zod. Zod 4's native
 * `z.toJSONSchema()` converts the schema to JSON Schema, which the generator
 * registers verbatim; `@nest-native/asyncapi` never reflects over Zod itself.
 */
export const MetricReportedSchema = z.object({
  name: z.string().min(1),
  value: z.number(),
  unit: z.enum(['ms', 'count', 'bytes']),
  reportedAt: z.iso.datetime(),
});

/**
 * The schema source handed to `@AsyncApiMessage` — a component name plus the
 * converted JSON Schema, emitted in the draft-07 dialect AsyncAPI 3.0 uses.
 */
export const metricReportedMessage: JsonSchemaSource = {
  name: 'MetricReported',
  schema: z.toJSONSchema(MetricReportedSchema, { target: 'draft-7' }),
};
