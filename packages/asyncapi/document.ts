/**
 * Minimal type model for an AsyncAPI 3.0 document.
 *
 * These interfaces describe only the slice of the AsyncAPI 3.0 specification
 * that the generator emits today. The spec is large; we grow this model as
 * later milestones add channels, operations, messages, schemas, servers, and
 * transport bindings. We never invent non-standard fields — every property
 * here maps directly to an AsyncAPI 3.0 spec primitive.
 *
 * @see https://www.asyncapi.com/docs/reference/specification/v3.0.0
 */

/**
 * The fixed AsyncAPI specification version this generator targets.
 */
export const ASYNC_API_VERSION = '3.0.0';

/**
 * Contact information for the exposed API, mirroring the AsyncAPI `info.contact`
 * object.
 */
export interface AsyncApiContact {
  /** Identifying name of the contact person or organization. */
  name?: string;
  /** URL pointing to the contact information. */
  url?: string;
  /** Email address of the contact person or organization. */
  email?: string;
}

/**
 * License information for the exposed API, mirroring the AsyncAPI `info.license`
 * object.
 */
export interface AsyncApiLicense {
  /** The license name used for the API. */
  name: string;
  /** URL to the license used for the API. */
  url?: string;
}

/**
 * The `info` object of an AsyncAPI 3.0 document. `title` and `version` are the
 * only required fields per the specification.
 */
export interface AsyncApiInfo {
  /** The title of the application. */
  title: string;
  /** The version of this document (distinct from the AsyncAPI spec version). */
  version: string;
  /** A short description of the application. */
  description?: string;
  /** A URL to the Terms of Service for the API. */
  termsOfService?: string;
  /** Contact information for the exposed API. */
  contact?: AsyncApiContact;
  /** License information for the exposed API. */
  license?: AsyncApiLicense;
}

/**
 * The reusable definitions container of an AsyncAPI 3.0 document. Sub-sections
 * are added as later milestones introduce messages, schemas, and bindings.
 */
export interface AsyncApiComponents {
  [section: string]: Record<string, unknown> | undefined;
}

/**
 * An AsyncAPI 3.0 document.
 *
 * The 3.0 specification separates `channels` (where messages flow) from
 * `operations` (send/receive actions). Both are emitted as empty objects until
 * the decorator-driven milestones populate them, which is still a valid 3.0
 * document.
 */
export interface AsyncApiDocument {
  /** The AsyncAPI specification version, fixed at {@link ASYNC_API_VERSION}. */
  asyncapi: typeof ASYNC_API_VERSION;
  /** Metadata about the API. */
  info: AsyncApiInfo;
  /** Addresses where messages are exchanged. Empty until channels are declared. */
  channels: Record<string, unknown>;
  /** Send/receive actions over the declared channels. Empty until declared. */
  operations: Record<string, unknown>;
  /** Reusable definitions referenced from the rest of the document. */
  components: AsyncApiComponents;
}
