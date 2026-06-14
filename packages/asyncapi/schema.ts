import { Type } from '@nestjs/common';
import { AsyncApiSchemaObject } from './document';
import { buildRef } from './references';

/**
 * A pre-computed JSON Schema together with the name it should be registered
 * under in `components.schemas`.
 *
 * This is the escape hatch for validation worlds other than `class-validator`:
 * a Zod schema converted with `zod-to-json-schema`, a hand-written JSON Schema,
 * or any other source the user already turned into JSON Schema. The generator
 * never introduces a parallel reflector for these — it trusts the supplied
 * schema and only registers it under {@link JsonSchemaSource.name}.
 */
export interface JsonSchemaSource {
  /** The name used as the `components.schemas` key (and in the `$ref`). */
  name: string;
  /** The JSON Schema describing the payload or headers. */
  schema: AsyncApiSchemaObject;
}

/**
 * Anything {@link AsyncApiMessage} / {@link AsyncApiHeaders} accepts as a schema:
 * either a DTO class (resolved through the `@nestjs/swagger` chain, mirroring
 * how `@nestjs/swagger` turns a `@Controller` body DTO into JSON Schema) or a
 * {@link JsonSchemaSource} carrying an already-computed JSON Schema.
 */
export type SchemaSource = Type | JsonSchemaSource;

/**
 * The minimal slice of `@nestjs/swagger` the generator depends on. Only
 * `generateSchema` is used; typing it locally keeps `@nestjs/swagger` an
 * optional peer that is required lazily rather than imported at module load.
 */
interface SwaggerSchemaModule {
  generateSchema(target: Type): {
    schema: AsyncApiSchemaObject;
    schemas: Record<string, AsyncApiSchemaObject>;
  };
}

/**
 * Narrow a {@link SchemaSource} to a {@link JsonSchemaSource}. A plain object
 * carrying a `name` and a `schema` is treated as pre-computed JSON Schema; a
 * function is treated as a DTO class.
 */
function isJsonSchemaSource(source: SchemaSource): source is JsonSchemaSource {
  return typeof source !== 'function';
}

/**
 * `@nestjs/swagger` emits `$ref`s rooted at `#/components/schemas/`, which is
 * also where AsyncAPI 3.0 keeps reusable schemas, so the references it produces
 * are valid in an AsyncAPI document without rewriting. Loading is lazy and the
 * absence of the optional peer is reported with an actionable message.
 */
function loadSwagger(): SwaggerSchemaModule {
  try {
    return require('@nestjs/swagger') as SwaggerSchemaModule;
  } catch {
    throw new Error(
      'Generating an AsyncAPI schema from a DTO class requires the optional ' +
        'peer dependency "@nestjs/swagger". Install it, or pass a ' +
        'pre-computed JSON Schema ({ name, schema }) instead — for example a ' +
        'Zod schema converted with "zod-to-json-schema".',
    );
  }
}

/**
 * Collects the JSON Schemas referenced by messages and hands back the
 * `components.schemas` map plus the `$ref` for each registered schema.
 *
 * DTO classes are converted once through `@nestjs/swagger`'s `generateSchema`
 * and cached by class, so a DTO reused across several messages is emitted a
 * single time. Pre-computed {@link JsonSchemaSource}s are registered under their
 * given name. A name reused for two structurally different schemas is a build
 * failure, surfacing accidental collisions instead of silently overwriting.
 */
export class AsyncApiSchemaRegistry {
  private readonly schemas: Record<string, AsyncApiSchemaObject> = {};
  private readonly refsByType = new Map<Type, string>();
  private swagger: SwaggerSchemaModule | undefined;

  /**
   * Register a schema source and return the JSON Reference pointing at it. The
   * reference always targets `#/components/schemas/<name>`.
   */
  register(source: SchemaSource): string {
    if (isJsonSchemaSource(source)) {
      return this.registerSchema(source.name, source.schema);
    }

    return this.registerType(source);
  }

  /**
   * The accumulated `components.schemas` map. The returned object is the live
   * registry; callers treat it as read-only.
   */
  getSchemas(): Record<string, AsyncApiSchemaObject> {
    return this.schemas;
  }

  private registerType(type: Type): string {
    const cached = this.refsByType.get(type);
    if (cached !== undefined) {
      return cached;
    }

    this.swagger ??= loadSwagger();
    const { schemas } = this.swagger.generateSchema(type);

    // `generateSchema` returns a flat `schemas` map that already includes the
    // target under its class name alongside every nested DTO it references, with
    // `$ref`s rooted at `#/components/schemas/`. Registering each entry preserves
    // those references; the target's own entry is the message payload schema.
    let ref = '';
    for (const [name, definition] of Object.entries(schemas)) {
      const registered = this.registerSchema(name, definition);
      if (name === type.name) {
        ref = registered;
      }
    }

    this.refsByType.set(type, ref);
    return ref;
  }

  private registerSchema(name: string, schema: AsyncApiSchemaObject): string {
    const existing = this.schemas[name];

    if (existing !== undefined && !sameSchema(existing, schema)) {
      throw new Error(
        `Conflicting AsyncAPI schema registered for "${name}": two different ` +
          'schemas share the same name. Rename one of the DTOs or schema ' +
          'sources so each component name is unique.',
      );
    }

    this.schemas[name] = schema;
    return buildRef('#/components/schemas', name);
  }
}

/**
 * Structural equality used to detect schema-name collisions. JSON Schemas are
 * plain JSON, so a stable stringify is an exact and cheap comparison.
 */
function sameSchema(
  left: AsyncApiSchemaObject,
  right: AsyncApiSchemaObject,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
