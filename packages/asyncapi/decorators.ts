import {
  ASYNC_API_CHANNEL_METADATA,
  ASYNC_API_OPERATION_METADATA,
  AsyncApiAction,
  AsyncApiActionType,
} from './constants';

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
