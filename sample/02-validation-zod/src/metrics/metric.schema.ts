import { z } from 'zod';
import { ZodSchemaSource } from '@nest-native/asyncapi';

/**
 * The `metric reported` payload, described with Zod. The Zod schema is handed
 * to `@AsyncApiMessage` as-is: the generator detects it and converts it with
 * Zod 4's native `z.toJSONSchema()` (in the draft-07 dialect AsyncAPI 3.0
 * documents default to), loading `zod` lazily only when a Zod source is
 * registered. The event contract is written exactly once.
 */
export const MetricReportedSchema = z.object({
  name: z.string().min(1),
  value: z.number(),
  unit: z.enum(['ms', 'count', 'bytes']),
  reportedAt: z.iso.datetime(),
});

/**
 * The schema source handed to `@AsyncApiMessage` — a component name plus the
 * Zod schema itself. Pre-computed JSON Schema
 * (`{ name, schema: z.toJSONSchema(MetricReportedSchema, options) }`) remains
 * supported when custom conversion options are needed.
 */
export const metricReportedMessage: ZodSchemaSource = {
  name: 'MetricReported',
  schema: MetricReportedSchema,
};
