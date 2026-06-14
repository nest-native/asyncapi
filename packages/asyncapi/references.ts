/**
 * Helpers for building the JSON References (`$ref`) that wire an AsyncAPI 3.0
 * document together.
 *
 * AsyncAPI `$ref` values are URI fragments whose path is a JSON Pointer
 * (RFC 6901). Channel ids, message names, and schema names become individual
 * pointer segments, and a segment that itself contains `/` or `~` must be
 * escaped — `~` as `~0` and `/` as `~1` — or the pointer would be read as a
 * deeper path. Microservice channel ids such as `ms/create/feline` (common when
 * migrating from `nestjs-asyncapi`, whose channels mirror `@EventPattern`
 * strings) contain `/`, so building references by raw string interpolation
 * produces pointers that resolve to the wrong (non-existent) location and fail
 * `@asyncapi/parser` validation.
 *
 * @see https://www.asyncapi.com/docs/reference/specification/v3.0.0#referenceObject
 * @see https://datatracker.ietf.org/doc/html/rfc6901
 */

/**
 * Escape a single JSON Pointer reference token per RFC 6901: `~` becomes `~0`
 * and `/` becomes `~1`. The `~` replacement runs first so a literal `/` encoded
 * to `~1` is not then re-escaped.
 */
export function escapeJsonPointerSegment(segment: string): string {
  return segment.replace(/~/g, '~0').replace(/\//g, '~1');
}

/**
 * Build a `$ref` string from a base location and one or more pointer segments,
 * escaping each segment so ids and names containing `/` or `~` resolve to the
 * exact key they name rather than a nested path.
 *
 * @param base     The leading fragment, e.g. `#/channels` or `#/components/messages`.
 * @param segments The pointer segments appended after the base, in order.
 */
export function buildRef(base: string, ...segments: string[]): string {
  return [base, ...segments.map(escapeJsonPointerSegment)].join('/');
}
