/**
 * Reflection metadata keys used by the AsyncAPI decorators.
 *
 * The generator reads these keys off decorated classes and methods exactly as
 * `@nestjs/swagger` reads its own metadata off `@Controller` classes. Keys are
 * namespaced under `asyncapi:` so they never collide with NestJS core metadata
 * (`@MessagePattern`, `@EventPattern`) that may sit on the same handler.
 */

/**
 * Class-level metadata key holding the {@link AsyncApiChannelMetadata} written
 * by {@link AsyncApiChannel}.
 */
export const ASYNC_API_CHANNEL_METADATA = 'asyncapi:channel';

/**
 * Method-level metadata key holding the {@link AsyncApiOperationMetadata}
 * written by {@link AsyncApiPub} and {@link AsyncApiSub}.
 */
export const ASYNC_API_OPERATION_METADATA = 'asyncapi:operation';

/**
 * AsyncAPI 3.0 operation actions.
 *
 * In AsyncAPI 3.0 an operation declares its direction with `action`: an
 * application that produces messages onto a channel uses `send`, and one that
 * consumes them uses `receive`. `@AsyncApiPub` maps to `send` and
 * `@AsyncApiSub` maps to `receive`.
 *
 * @see https://www.asyncapi.com/docs/reference/specification/v3.0.0#operationObject
 */
export const AsyncApiAction = {
  /** The application sends (publishes) a message to the channel. */
  Send: 'send',
  /** The application receives (subscribes to) a message from the channel. */
  Receive: 'receive',
} as const;

/**
 * The string literal type of an AsyncAPI 3.0 operation `action`.
 */
export type AsyncApiActionType =
  (typeof AsyncApiAction)[keyof typeof AsyncApiAction];
