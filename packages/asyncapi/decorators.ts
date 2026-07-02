import {
  AsyncApiChannelBindingsMap,
  AsyncApiMessageBindingsMap,
  AsyncApiOperationBindingsMap,
  AsyncApiServerBindingsMap,
} from './bindings';
import {
  ASYNC_API_CHANNEL_BINDINGS_METADATA,
  ASYNC_API_CHANNEL_METADATA,
  ASYNC_API_HEADERS_METADATA,
  ASYNC_API_MESSAGE_BINDINGS_METADATA,
  ASYNC_API_MESSAGE_METADATA,
  ASYNC_API_OPERATION_BINDINGS_METADATA,
  ASYNC_API_OPERATION_METADATA,
  ASYNC_API_SERVERS_METADATA,
  AsyncApiAction,
  AsyncApiActionType,
} from './constants';
import { SchemaSource } from './schema';

/**
 * Options accepted by {@link AsyncApiChannel}.
 *
 * These map directly onto the AsyncAPI 3.0 Channel Object. The channel id is
 * passed positionally (explicit by design — channel ids are never derived from
 * the class name) and these options describe the channel itself.
 */
export interface AsyncApiChannelOptions {
  /**
   * The channel address (topic, queue, or routing key). Defaults to the channel
   * id when omitted; pass `null` to mark an address that is unknown at design
   * time, as the specification allows.
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
 * The class-level metadata written by {@link AsyncApiChannel}.
 */
export interface AsyncApiChannelMetadata extends AsyncApiChannelOptions {
  /** The channel id used as the key in the generated `channels` map. */
  id: string;
}

/**
 * Options accepted by {@link AsyncApiPub} and {@link AsyncApiSub}.
 *
 * These map onto the AsyncAPI 3.0 Operation Object. The operation's `action`
 * is fixed by the decorator (`send` for pub, `receive` for sub) and is not
 * configurable here.
 */
export interface AsyncApiOperationOptions {
  /**
   * The operation id used as the key in the generated `operations` map.
   * Defaults to the decorated method name when omitted.
   */
  operationId?: string;
  /** A human-friendly title for the operation. */
  title?: string;
  /** A short summary of the operation. */
  summary?: string;
  /** A verbose explanation of the operation. */
  description?: string;
}

/**
 * The method-level metadata written by {@link AsyncApiPub} / {@link AsyncApiSub}.
 */
export interface AsyncApiOperationMetadata extends AsyncApiOperationOptions {
  /** Whether the operation sends or receives messages. */
  action: AsyncApiActionType;
}

/**
 * Declare the AsyncAPI 3.0 channel a handler class operates on.
 *
 * Apply at class level, mirroring how `@Controller('path')` declares the base
 * route for an HTTP controller. The channel id is explicit by design — the
 * generator never derives it from the class name (see the constitution's
 * design decisions). Every `@AsyncApiPub` / `@AsyncApiSub` method on the class
 * produces an operation bound to this channel.
 *
 * @param id      The channel id, used as the `channels` map key.
 * @param options Channel metadata (address, title, summary, description).
 */
export function AsyncApiChannel(
  id: string,
  options: AsyncApiChannelOptions = {},
): ClassDecorator {
  const metadata: AsyncApiChannelMetadata = { id, ...options };

  return (target) => {
    Reflect.defineMetadata(ASYNC_API_CHANNEL_METADATA, metadata, target);
  };
}

function createOperationDecorator(
  action: AsyncApiActionType,
  options: AsyncApiOperationOptions,
): MethodDecorator {
  const metadata: AsyncApiOperationMetadata = { action, ...options };

  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata(
      ASYNC_API_OPERATION_METADATA,
      metadata,
      descriptor.value as object,
    );
    return descriptor;
  };
}

/**
 * Declare a `send` (publish) operation on a channel handler method.
 *
 * Apply at method level on a class decorated with {@link AsyncApiChannel}. The
 * generated operation has `action: 'send'` and references the class's channel.
 *
 * @param options Operation metadata (operationId, title, summary, description).
 */
export function AsyncApiPub(
  options: AsyncApiOperationOptions = {},
): MethodDecorator {
  return createOperationDecorator(AsyncApiAction.Send, options);
}

/**
 * Declare a `receive` (subscribe) operation on a channel handler method.
 *
 * Apply at method level on a class decorated with {@link AsyncApiChannel}. The
 * generated operation has `action: 'receive'` and references the class's
 * channel.
 *
 * @param options Operation metadata (operationId, title, summary, description).
 */
export function AsyncApiSub(
  options: AsyncApiOperationOptions = {},
): MethodDecorator {
  return createOperationDecorator(AsyncApiAction.Receive, options);
}

/**
 * Options accepted by {@link AsyncApiMessage}.
 *
 * These map onto the descriptive fields of the AsyncAPI 3.0 Message Object. The
 * payload schema itself comes from the first positional argument, not from here.
 */
export interface AsyncApiMessageOptions {
  /**
   * The message name used as the `components.messages` key and as the message's
   * `name` field. Defaults to the payload DTO's class name, or to a
   * `{ name, schema }` source's `name`.
   */
  name?: string;
  /** A human-friendly title for the message. */
  title?: string;
  /** A short summary of what the message is about. */
  summary?: string;
  /** A verbose explanation of the message. */
  description?: string;
  /**
   * The content type the payload is encoded with.
   *
   * @default 'application/json'
   */
  contentType?: string;
}

/**
 * The method-level metadata written by {@link AsyncApiMessage}.
 */
export interface AsyncApiMessageMetadata extends AsyncApiMessageOptions {
  /** The payload schema source (DTO class, Zod schema, or JSON Schema). */
  payload: SchemaSource;
}

/**
 * The method-level metadata written by {@link AsyncApiHeaders}.
 */
export interface AsyncApiHeadersMetadata {
  /** The headers schema source (DTO class, Zod schema, or JSON Schema). */
  headers: SchemaSource;
}

/**
 * Declare the payload of the message an operation sends or receives.
 *
 * Apply at method level alongside {@link AsyncApiPub} / {@link AsyncApiSub}. The
 * payload is a DTO class — turned into JSON Schema through the same
 * `@nestjs/swagger` chain that documents HTTP bodies — or a `{ name, schema }`
 * source whose `schema` is either a Zod schema (converted natively with Zod 4's
 * `z.toJSONSchema()`) or a pre-computed JSON Schema (registered verbatim). The
 * generated message is registered once in `components.messages` and referenced
 * from the channel and operation.
 *
 * @param payload The payload DTO class, Zod schema source, or JSON Schema source.
 * @param options Message metadata (name, title, summary, description, contentType).
 */
export function AsyncApiMessage(
  payload: SchemaSource,
  options: AsyncApiMessageOptions = {},
): MethodDecorator {
  const metadata: AsyncApiMessageMetadata = { payload, ...options };

  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata(
      ASYNC_API_MESSAGE_METADATA,
      metadata,
      descriptor.value as object,
    );
    return descriptor;
  };
}

/**
 * Declare the headers of the message an operation sends or receives.
 *
 * Apply at method level alongside {@link AsyncApiMessage}. The headers schema is
 * resolved exactly as the payload is — a DTO class through the `@nestjs/swagger`
 * chain, or a `{ name, schema }` source carrying a Zod schema or a pre-computed
 * JSON Schema.
 *
 * @param headers The headers DTO class, Zod schema source, or JSON Schema source.
 */
export function AsyncApiHeaders(headers: SchemaSource): MethodDecorator {
  const metadata: AsyncApiHeadersMetadata = { headers };

  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata(
      ASYNC_API_HEADERS_METADATA,
      metadata,
      descriptor.value as object,
    );
    return descriptor;
  };
}

/**
 * Options accepted by {@link AsyncApiServer}.
 *
 * These map onto the AsyncAPI 3.0 Server Object. A server declares a broker the
 * application connects to; its `protocol` (`kafka`, `nats`, `mqtt`, `amqp`, …)
 * and optional protocol `bindings` carry the transport identity and connection
 * metadata that the channels and operations are bound to.
 */
export interface AsyncApiServerOptions {
  /** The protocol version used for connection. */
  protocolVersion?: string;
  /** The path to a resource in the host. */
  pathname?: string;
  /** A human-friendly title for the server. */
  title?: string;
  /** A brief summary of the server. */
  summary?: string;
  /** A longer description of the server. */
  description?: string;
  /** Protocol-specific connection bindings, keyed by protocol. */
  bindings?: AsyncApiServerBindingsMap;
}

/**
 * The class-level metadata written by one {@link AsyncApiServer} application.
 */
export interface AsyncApiServerMetadata extends AsyncApiServerOptions {
  /** The server name, used as the key in the generated `servers` map. */
  name: string;
  /** The server host name. It MAY include the port. */
  host: string;
  /** The protocol this server supports for connection. */
  protocol: string;
}

/**
 * Declare a server (message broker) the application connects to.
 *
 * Apply at class level. The decorator is repeatable — stacking it declares
 * several brokers — and every declaration across the application is merged into
 * the document's `servers` map. The `protocol` and the optional protocol
 * `bindings` are where a transport's identity and connection metadata live, so
 * this is the AsyncAPI counterpart to documenting the base URL and security of
 * an HTTP server.
 *
 * @param name     The server name, used as the `servers` map key.
 * @param host     The server host (it MAY include the port).
 * @param protocol The connection protocol (`kafka`, `nats`, `mqtt`, `amqp`, …).
 * @param options  Server metadata (title, description, bindings, …).
 */
export function AsyncApiServer(
  name: string,
  host: string,
  protocol: string,
  options: AsyncApiServerOptions = {},
): ClassDecorator {
  const metadata: AsyncApiServerMetadata = { name, host, protocol, ...options };

  return (target) => {
    const existing =
      (Reflect.getMetadata(ASYNC_API_SERVERS_METADATA, target) as
        | AsyncApiServerMetadata[]
        | undefined) ?? [];
    Reflect.defineMetadata(
      ASYNC_API_SERVERS_METADATA,
      [...existing, metadata],
      target,
    );
  };
}

/**
 * Attach protocol-specific bindings to a channel.
 *
 * Apply at class level alongside {@link AsyncApiChannel}. The bindings map is
 * keyed by protocol (`kafka`, `amqp`, …) and emitted verbatim onto the channel's
 * `bindings`, carrying topic/exchange/queue details the core Channel Object
 * cannot express.
 *
 * @param bindings The protocol-keyed channel bindings.
 */
export function AsyncApiChannelBindings(
  bindings: AsyncApiChannelBindingsMap,
): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(
      ASYNC_API_CHANNEL_BINDINGS_METADATA,
      bindings,
      target,
    );
  };
}

/**
 * Attach protocol-specific bindings to an operation.
 *
 * Apply at method level alongside {@link AsyncApiPub} / {@link AsyncApiSub}. The
 * bindings map is keyed by protocol (`kafka`, `nats`, `mqtt`, `amqp`) and emitted
 * verbatim onto the operation's `bindings`, carrying consumer-group, queue, QoS,
 * and delivery details.
 *
 * @param bindings The protocol-keyed operation bindings.
 */
export function AsyncApiOperationBindings(
  bindings: AsyncApiOperationBindingsMap,
): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata(
      ASYNC_API_OPERATION_BINDINGS_METADATA,
      bindings,
      descriptor.value as object,
    );
    return descriptor;
  };
}

/**
 * Attach protocol-specific bindings to a message.
 *
 * Apply at method level alongside {@link AsyncApiMessage}. The bindings map is
 * keyed by protocol (`kafka`, `mqtt`, `amqp`) and emitted verbatim onto the
 * generated message's `bindings`, carrying message-key, content-encoding, and
 * payload-format details.
 *
 * @param bindings The protocol-keyed message bindings.
 */
export function AsyncApiMessageBindings(
  bindings: AsyncApiMessageBindingsMap,
): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata(
      ASYNC_API_MESSAGE_BINDINGS_METADATA,
      bindings,
      descriptor.value as object,
    );
    return descriptor;
  };
}
