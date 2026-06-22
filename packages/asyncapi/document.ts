/**
 * Minimal type model for an AsyncAPI 3.0 document.
 *
 * These interfaces describe the slice of the AsyncAPI 3.0 specification that the
 * generator emits — channels, operations, messages, schemas, servers, and
 * transport bindings. The spec is large; we model only what the generator
 * produces and never invent non-standard fields — every property here maps
 * directly to an AsyncAPI 3.0 spec primitive.
 *
 * @see https://www.asyncapi.com/docs/reference/specification/v3.0.0
 */

import {
  AsyncApiChannelBindingsMap,
  AsyncApiMessageBindingsMap,
  AsyncApiOperationBindingsMap,
  AsyncApiServerBindingsMap,
} from './bindings';

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
 * A JSON Reference into the document, used wherever AsyncAPI permits a
 * `$ref` in place of an inline object.
 *
 * @see https://www.asyncapi.com/docs/reference/specification/v3.0.0#referenceObject
 */
export interface AsyncApiReference {
  /** A JSON pointer such as `#/components/schemas/OrderPlaced`. */
  $ref: string;
}

/**
 * A JSON Schema describing a message payload or its headers.
 *
 * AsyncAPI 3.0 uses JSON Schema (draft 7 compatible) for `payload` and
 * `headers`, the same schema dialect `@nestjs/swagger` emits for HTTP bodies,
 * so a schema produced by the `@nestjs/swagger` chain or by `z.toJSONSchema()`
 * drops in unchanged. The type stays intentionally open — JSON Schema is large
 * and the generator never rewrites the schemas it is handed.
 *
 * @see https://www.asyncapi.com/docs/reference/specification/v3.0.0#schemaObject
 */
export interface AsyncApiSchemaObject {
  /** A `$ref` to a reusable schema, when the schema is a reference. */
  $ref?: string;
  /** Any other JSON Schema keyword (`type`, `properties`, `required`, …). */
  [keyword: string]: unknown;
}

/**
 * An AsyncAPI 3.0 Message Object.
 *
 * A message couples a payload schema with optional headers and human-readable
 * metadata. Messages live in `components.messages`; channels reference them and
 * operations reference the channel's messages, keeping a single definition
 * reusable across the document.
 *
 * @see https://www.asyncapi.com/docs/reference/specification/v3.0.0#messageObject
 */
export interface AsyncApiMessageObject {
  /** A machine-friendly name for the message. */
  name?: string;
  /** A human-friendly title for the message. */
  title?: string;
  /** A short summary of what the message is about. */
  summary?: string;
  /** A verbose explanation of the message. */
  description?: string;
  /** The content type the payload is encoded with (e.g. `application/json`). */
  contentType?: string;
  /** A schema (or `$ref`) describing the message payload. */
  payload?: AsyncApiSchemaObject;
  /** A schema (or `$ref`) describing the message headers. */
  headers?: AsyncApiSchemaObject;
  /** Protocol-specific bindings for the message, keyed by protocol. */
  bindings?: AsyncApiMessageBindingsMap;
}

/**
 * An AsyncAPI 3.0 Server Object — a message broker the application connects to.
 *
 * `host` and `protocol` are the only required fields per the specification. The
 * server's `bindings` carry protocol-specific connection metadata (schema
 * registry URLs, MQTT client ids, …) that the core fields cannot express.
 *
 * @see https://www.asyncapi.com/docs/reference/specification/v3.0.0#serverObject
 */
export interface AsyncApiServerObject {
  /** The server host name. It MAY include the port. */
  host: string;
  /** The protocol this server supports for connection (e.g. `kafka`). */
  protocol: string;
  /** The version of the protocol used for connection. */
  protocolVersion?: string;
  /** The path to a resource in the host. */
  pathname?: string;
  /** A human-friendly title for the server. */
  title?: string;
  /** A brief summary of the server. */
  summary?: string;
  /** A longer description of the server. */
  description?: string;
  /** Protocol-specific bindings for the server, keyed by protocol. */
  bindings?: AsyncApiServerBindingsMap;
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
  /**
   * The messages this channel carries, keyed by a channel-local message key.
   * Each entry references a reusable message in `components.messages`. Operations
   * point at these entries rather than at the components directly, as AsyncAPI
   * 3.0 prescribes.
   */
  messages?: Record<string, AsyncApiReference>;
  /**
   * The servers this channel is available on, each a `#/servers/<name>`
   * reference. When omitted the channel is available on every declared server.
   */
  servers?: AsyncApiReference[];
  /** Protocol-specific bindings for the channel, keyed by protocol. */
  bindings?: AsyncApiChannelBindingsMap;
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
  /**
   * The messages this operation sends or receives, each referencing one of the
   * channel's messages (`#/channels/<id>/messages/<key>`). AsyncAPI 3.0 keeps
   * the operation's messages a subset of its channel's messages.
   */
  messages?: AsyncApiReference[];
  /** Protocol-specific bindings for the operation, keyed by protocol. */
  bindings?: AsyncApiOperationBindingsMap;
}

/**
 * The reusable definitions container of an AsyncAPI 3.0 document. `messages`
 * and `schemas` are populated from `@AsyncApiMessage` / `@AsyncApiHeaders`
 * metadata; the open index signature leaves room for any other spec-defined
 * `components` sub-section.
 */
export interface AsyncApiComponents {
  /** Reusable Message Objects referenced by channels, keyed by message name. */
  messages?: Record<string, AsyncApiMessageObject>;
  /** Reusable JSON Schemas referenced by messages, keyed by schema name. */
  schemas?: Record<string, AsyncApiSchemaObject>;
  /** Any other spec-defined `components` sub-section. */
  [section: string]:
    | Record<string, AsyncApiMessageObject>
    | Record<string, AsyncApiSchemaObject>
    | Record<string, unknown>
    | undefined;
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
  /**
   * The brokers the application connects to, keyed by server name. Emitted only
   * when at least one {@link AsyncApiServer} is declared, since `servers` is
   * optional in AsyncAPI 3.0.
   */
  servers?: Record<string, AsyncApiServerObject>;
  /** Addresses where messages are exchanged, keyed by channel id. */
  channels: Record<string, AsyncApiChannelObject>;
  /** Send/receive actions over the declared channels, keyed by operation id. */
  operations: Record<string, AsyncApiOperationObject>;
  /** Reusable definitions referenced from the rest of the document. */
  components: AsyncApiComponents;
}
