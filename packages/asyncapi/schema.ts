import { Type } from '@nestjs/common';
import { AsyncApiSchemaObject } from './document';
import { buildRef } from './references';

/**
 * A pre-computed JSON Schema together with the name it should be registered
 * under in `components.schemas`.
 *
 * This is the escape hatch for validation worlds the generator does not
 * convert natively: a hand-written JSON Schema, output of any schema-to-JSON
 * converter, or a Zod schema converted with explicit `z.toJSONSchema()`
 * options. The generator never introduces a parallel reflector for these — it
 * trusts the supplied schema and only registers it under
 * {@link JsonSchemaSource.name}.
 */
export interface JsonSchemaSource {
  /** The name used as the `components.schemas` key (and in the `$ref`). */
  name: string;
  /** The JSON Schema describing the payload or headers. */
  schema: AsyncApiSchemaObject;
}

/**
 * The minimal structural shape of a Standard Schema
 * (https://standardschema.dev) — the vendor-neutral marker interface Zod 4
 * implements on every schema instance.
 *
 * Typing the accepted Zod schema structurally keeps `zod` an optional peer:
 * consumers without Zod installed still typecheck against this shape, and a
 * real `ZodType` satisfies it without casts.
 */
export interface StandardSchemaLike {
  /** The Standard Schema marker carrying the implementing vendor's identity. */
  readonly '~standard': {
    /** The name of the vendor implementing the spec — `'zod'` for Zod. */
    readonly vendor: string;
    /** The version of the Standard Schema spec the vendor implements. */
    readonly version: number;
  };
}

/**
 * A Zod schema together with the name it should be registered under in
 * `components.schemas`.
 *
 * The generator converts the schema lazily with Zod 4's native
 * `z.toJSONSchema()` (using `target: 'draft-7'`, the JSON Schema dialect
 * AsyncAPI 3.0 documents default to) and registers the result exactly like a
 * {@link JsonSchemaSource}. `zod` stays an optional peer — it is required only
 * when a Zod source is actually registered, never at module load.
 */
export interface ZodSchemaSource {
  /** The name used as the `components.schemas` key (and in the `$ref`). */
  name: string;
  /** The Zod schema describing the payload or headers. */
  schema: StandardSchemaLike;
}

/**
 * Anything {@link AsyncApiMessage} / {@link AsyncApiHeaders} accepts as a schema:
 * a DTO class (resolved through the `@nestjs/swagger` chain, mirroring how
 * `@nestjs/swagger` turns a `@Controller` body DTO into JSON Schema), a
 * {@link ZodSchemaSource} carrying a Zod schema converted natively via
 * `z.toJSONSchema()`, or a {@link JsonSchemaSource} carrying an
 * already-computed JSON Schema.
 */
export type SchemaSource = Type | JsonSchemaSource | ZodSchemaSource;

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
 * The slice of Zod 4's native JSON Schema conversion the registry uses.
 * `target: 'draft-7'` keeps emitting the draft-07 dialect AsyncAPI 3.0
 * documents default to. Typing it locally keeps `zod` an optional peer that is
 * required lazily rather than imported at module load.
 */
type ZodToJsonSchema = (
  schema: StandardSchemaLike,
  options?: { target?: string },
) => AsyncApiSchemaObject;

/**
 * The minimal slice of the `zod` module the generator depends on. Zod 4 ships
 * JSON Schema generation in core as `z.toJSONSchema()`; older majors do not,
 * which is why the property is optional here and validated after loading.
 */
interface ZodModule {
  z: { toJSONSchema?: ZodToJsonSchema };
}

/**
 * Detect a value carrying the Standard Schema `~standard` marker. Hand-written
 * JSON Schema objects never carry it; live Zod schemas always do — and so does
 * the JSON Schema `z.toJSONSchema()` emits, which Zod 4.4+ tags with a
 * non-enumerable marker of its own. Presence alone therefore gates the
 * Standard Schema handling but does not yet prove the value is convertible.
 */
function isStandardSchemaLike(
  schema: AsyncApiSchemaObject | StandardSchemaLike,
): schema is StandardSchemaLike {
  return '~standard' in schema;
}

/**
 * Detect a live Zod schema *instance*, as opposed to the JSON Schema
 * `z.toJSONSchema()` emits (which carries the same `~standard` marker but no
 * validator surface). Both `zod` and `zod/mini` schemas expose `def` and a
 * `safeParse` function; emitted JSON Schema exposes neither, and top-level
 * `def`/`safeParse` are not JSON Schema keywords, so the duck-typing cannot
 * misfire on a pre-computed schema.
 */
function isZodSchemaInstance(
  schema: AsyncApiSchemaObject | StandardSchemaLike,
): schema is StandardSchemaLike {
  return (
    '~standard' in schema &&
    'def' in schema &&
    typeof (schema as { safeParse?: unknown }).safeParse === 'function'
  );
}

/**
 * Reject a live Standard Schema from a vendor the registry cannot convert.
 * Only Zod is converted natively; embedding another vendor's schema instance
 * verbatim would serialize a live object graph into the document, so the
 * failure points at the pre-computed {@link JsonSchemaSource} escape hatch
 * instead. Values without the marker (plain JSON Schema) and Zod's own emitted
 * JSON Schema (marker vendor `zod`) pass through untouched.
 */
function assertConvertibleStandardSchema(
  name: string,
  schema: AsyncApiSchemaObject | StandardSchemaLike,
): void {
  if (!isStandardSchemaLike(schema)) {
    return;
  }

  const { vendor } = schema['~standard'];
  if (vendor !== 'zod') {
    throw new Error(
      `The schema source "${name}" implements Standard Schema for vendor ` +
        `"${vendor}", but only Zod schemas are converted natively. Convert ` +
        "it to JSON Schema with your library's exporter and pass the " +
        'result as a pre-computed { name, schema } instead.',
    );
  }
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
        'Zod schema converted with "z.toJSONSchema()".',
    );
  }
}

/**
 * Load Zod 4's native `z.toJSONSchema()`. Loading is lazy — `zod` is touched
 * only when a Zod schema source is actually registered — and both failure
 * modes (`zod` not installed, or an older major without `z.toJSONSchema()`)
 * are reported with the same actionable message.
 */
function loadZodToJsonSchema(): ZodToJsonSchema {
  let toJSONSchema: ZodToJsonSchema | undefined;

  try {
    toJSONSchema = (require('zod') as ZodModule).z.toJSONSchema;
    // Stryker disable next-line BlockStatement: `toJSONSchema` is already
    // `undefined` from its declaration, so clearing it here is behaviorally
    // redundant — the `typeof` guard below reports the missing peer either way.
  } catch {
    toJSONSchema = undefined;
  }

  if (typeof toJSONSchema !== 'function') {
    throw new Error(
      'Generating an AsyncAPI schema from a Zod schema requires the optional ' +
        'peer dependency "zod" version 4 or newer (its native ' +
        '"z.toJSONSchema()" performs the conversion). Install zod@^4, or ' +
        'convert the schema yourself and pass a pre-computed JSON Schema ' +
        '({ name, schema }) instead.',
    );
  }

  return toJSONSchema;
}

/**
 * Collects the JSON Schemas referenced by messages and hands back the
 * `components.schemas` map plus the `$ref` for each registered schema.
 *
 * DTO classes are converted once through `@nestjs/swagger`'s `generateSchema`
 * and cached by class, so a DTO reused across several messages is emitted a
 * single time. Zod schemas ({@link ZodSchemaSource}) are converted with Zod 4's
 * native `z.toJSONSchema()` and registered under their given name; pre-computed
 * {@link JsonSchemaSource}s are registered verbatim. A name reused for two
 * structurally different schemas is a build failure, surfacing accidental
 * collisions instead of silently overwriting.
 */
export class AsyncApiSchemaRegistry {
  private readonly schemas: Record<string, AsyncApiSchemaObject> = {};
  private readonly refsByType = new Map<Type, string>();
  private swagger: SwaggerSchemaModule | undefined;
  private zodToJsonSchema: ZodToJsonSchema | undefined;

  /**
   * Register a schema source and return the JSON Reference pointing at it. The
   * reference always targets `#/components/schemas/<name>`.
   */
  register(source: SchemaSource): string {
    if (typeof source === 'function') {
      return this.registerType(source);
    }

    return this.registerNamedSource(source);
  }

  /**
   * The accumulated `components.schemas` map. The returned object is the live
   * registry; callers treat it as read-only.
   */
  getSchemas(): Record<string, AsyncApiSchemaObject> {
    return this.schemas;
  }

  /**
   * Register a named `{ name, schema }` source. A live Zod schema — detected
   * through its Standard Schema marker plus its validator surface — is
   * converted to JSON Schema first; anything else (a hand-written JSON Schema
   * or one already emitted by `z.toJSONSchema()`) is trusted as pre-computed
   * JSON Schema and registered verbatim.
   */
  private registerNamedSource(
    source: JsonSchemaSource | ZodSchemaSource,
  ): string {
    const { name, schema } = source;
    assertConvertibleStandardSchema(name, schema);

    if (isZodSchemaInstance(schema)) {
      return this.registerSchema(name, this.convertZodSchema(schema));
    }

    return this.registerSchema(name, schema);
  }

  /**
   * Convert a live Zod schema with Zod 4's native `z.toJSONSchema()`, loaded
   * lazily on first use and cached. `target: 'draft-7'` keeps the conversion
   * on the JSON Schema dialect AsyncAPI 3.0 documents default to.
   */
  private convertZodSchema(schema: StandardSchemaLike): AsyncApiSchemaObject {
    this.zodToJsonSchema ??= loadZodToJsonSchema();
    return this.zodToJsonSchema(schema, { target: 'draft-7' });
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
