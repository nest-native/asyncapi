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
 * An AsyncAPI 3.0 Channel Object.
 *
 * A channel is an addressable component where messages flow. The 3.0
 * specification decouples channels (the "where") from operations (the
 * "send/receive" actions), so a channel never declares a direction itself.
 *
 * @see https://www.asyncapi.com/docs/reference/specification/v3.0.0#channelObject
 */
export interface AsyncApiChannelObject {
  /**
   * The channel address (for example a topic, queue, or routing key). `null`
   * marks an address that is unknown at design time, per the specification.
   */
  address?: string | null;
  /** A human-friendly title for the channel. */
  title?: string;
  /** A short summary of the channel. */
  summary?: string;
  /** A verbose explanation of the channel. */
  description?: string;
}

/**
 * A reference to an AsyncAPI Operation's target channel, expressed as a JSON
 * Reference into the document's `channels` section.
 *
 * @see https://www.asyncapi.com/docs/reference/specification/v3.0.0#referenceObject
 */
export interface AsyncApiChannelReference {
  /** A `#/channels/<id>` JSON pointer to the operation's channel. */
  $ref: string;
}

/**
 * An AsyncAPI 3.0 Operation Object.
 *
 * Operations declare what an application does with a channel: `send` to
 * produce messages, `receive` to consume them. The operation points at its
 * channel through a reference rather than nesting under it.
 *
 * @see https://www.asyncapi.com/docs/reference/specification/v3.0.0#operationObject
 */
export interface AsyncApiOperationObject {
  /** Whether the application sends or receives messages on the channel. */
  action: 'send' | 'receive';
  /** A reference to the channel this operation acts upon. */
  channel: AsyncApiChannelReference;
  /** A human-friendly title for the operation. */
  title?: string;
  /** A short summary of the operation. */
  summary?: string;
  /** A verbose explanation of the operation. */
  description?: string;
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
  /** Addresses where messages are exchanged, keyed by channel id. */
  channels: Record<string, AsyncApiChannelObject>;
  /** Send/receive actions over the declared channels, keyed by operation id. */
  operations: Record<string, AsyncApiOperationObject>;
  /** Reusable definitions referenced from the rest of the document. */
  components: AsyncApiComponents;
}
