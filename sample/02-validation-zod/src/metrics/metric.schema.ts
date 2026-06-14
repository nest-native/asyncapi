import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { JsonSchemaSource } from '@nest-native/asyncapi';

/**
 * The `metric reported` payload, described with Zod. `zod-to-json-schema`
 * converts the schema to JSON Schema, which the generator registers verbatim;
 * `@nest-native/asyncapi` never reflects over Zod itself.
 */
export const MetricReportedSchema = z.object({
  name: z.string().min(1),
  value: z.number(),
  unit: z.enum(['ms', 'count', 'bytes']),
  reportedAt: z.string().datetime(),
});

/**
 * The schema source handed to `@AsyncApiMessage` — a component name plus the
 * converted JSON Schema, inlined with `$refStrategy: 'none'`.
 */
export const metricReportedMessage: JsonSchemaSource = {
  name: 'MetricReported',
  schema: zodToJsonSchema(MetricReportedSchema, {
    $refStrategy: 'none',
    target: 'jsonSchema7',
  }),
};
