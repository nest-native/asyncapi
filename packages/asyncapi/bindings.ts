import { AsyncApiReference, AsyncApiSchemaObject } from './document';

/**
 * Typed models for the AsyncAPI 3.0 protocol bindings this package ships in v1:
 * Kafka, NATS, MQTT, and AMQP.
 *
 * A binding carries protocol-specific information that the core AsyncAPI objects
 * cannot express — a Kafka topic's partition count, an AMQP exchange's type, an
 * MQTT QoS level, and so on. AsyncAPI 3.0 attaches bindings at four scopes
 * (server, channel, operation, message); each scope owns a different set of
 * fields per protocol, mirrored here.
 *
 * Every interface keeps an index signature so a field the binding spec adds in a
 * future binding version still type-checks: we model the spec primitives we
 * document, never invent non-standard ones, and never block a user from a valid
 * spec field. The values are emitted verbatim into the document, so the
 * `@asyncapi/parser` is the source of truth for what is ultimately valid.
 *
 * @see https://github.com/asyncapi/bindings
 */

/**
 * The transport protocols `@nest-native/asyncapi` ships typed bindings for in
 * v1. These are the binding map keys AsyncAPI uses (`kafka`, `nats`, `mqtt`,
 * `amqp`).
 *
 * @see https://www.asyncapi.com/docs/reference/specification/v3.0.0#serverBindingsObject
 */
export const AsyncApiProtocol = {
  /** Apache Kafka. */
  Kafka: 'kafka',
  /** NATS. */
  Nats: 'nats',
  /** MQTT. */
  Mqtt: 'mqtt',
  /** AMQP 0-9-1 (RabbitMQ). */
  Amqp: 'amqp',
} as const;

/**
 * The string literal type of a supported transport protocol key.
 */
export type AsyncApiProtocolType =
  (typeof AsyncApiProtocol)[keyof typeof AsyncApiProtocol];

/**
 * The `bindingVersion` field every binding object carries. Defaults to `latest`
 * when omitted, but pinning the version is recommended for reproducible specs.
 */
interface WithBindingVersion {
  /** The version of the protocol binding (for example `0.5.0`). */
  bindingVersion?: string;
  /** Any other spec field, including `x-` specification extensions. */
  [field: string]: unknown;
}

// ---------------------------------------------------------------------------
// Kafka
// ---------------------------------------------------------------------------

/**
 * Kafka server binding — connection metadata for a Kafka broker that the core
 * Server Object cannot express.
 *
 * @see https://github.com/asyncapi/bindings/tree/master/kafka#server-binding-object
 */
export interface KafkaServerBinding extends WithBindingVersion {
  /** API URL for the Schema Registry used when producing Kafka messages. */
  schemaRegistryUrl?: string;
  /** The vendor of the Schema Registry and Kafka serdes library. */
  schemaRegistryVendor?: string;
}

/**
 * Kafka channel binding — the topic representation of a channel.
 *
 * @see https://github.com/asyncapi/bindings/tree/master/kafka#channel-binding-object
 */
export interface KafkaChannelBinding extends WithBindingVersion {
  /** Kafka topic name, if different from the channel address. */
  topic?: string;
  /** Number of partitions configured on the topic. */
  partitions?: number;
  /** Number of replicas configured on the topic. */
  replicas?: number;
  /** Topic configuration properties relevant for the API. */
  topicConfiguration?: Record<string, unknown>;
}

/**
 * Kafka operation binding — consumer group and client identity.
 *
 * @see https://github.com/asyncapi/bindings/tree/master/kafka#operation-binding-object
 */
export interface KafkaOperationBinding extends WithBindingVersion {
  /** Id of the consumer group, as a Schema Object. */
  groupId?: AsyncApiSchemaObject;
  /** Id of the consumer inside a consumer group, as a Schema Object. */
  clientId?: AsyncApiSchemaObject;
}

/**
 * Kafka message binding — message key and schema-registry lookup metadata.
 *
 * @see https://github.com/asyncapi/bindings/tree/master/kafka#message-binding-object
 */
export interface KafkaMessageBinding extends WithBindingVersion {
  /** The message key, as a Schema Object or a `$ref`. */
  key?: AsyncApiSchemaObject | AsyncApiReference;
  /** Where the schema id is stored when a Schema Registry is used. */
  schemaIdLocation?: 'header' | 'payload';
  /** Encoding of the schema id when stored in the payload. */
  schemaIdPayloadEncoding?: string;
  /** Naming strategy class used to look the schema up. */
  schemaLookupStrategy?: string;
}

// ---------------------------------------------------------------------------
// NATS
// ---------------------------------------------------------------------------

/**
 * NATS operation binding — the queue group an operation subscribes with. NATS
 * only defines an operation-scoped binding.
 *
 * @see https://github.com/asyncapi/bindings/tree/master/nats#operation-binding-object
 */
export interface NatsOperationBinding extends WithBindingVersion {
  /** The queue group name. It MUST NOT exceed 255 characters. */
  queue?: string;
}

// ---------------------------------------------------------------------------
// MQTT
// ---------------------------------------------------------------------------

/**
 * MQTT Last Will and Testament configuration carried on the server binding.
 */
export interface MqttLastWill {
  /** The topic the LWT message is sent to. */
  topic?: string;
  /** Quality of Service for the LWT message (0, 1, or 2). */
  qos?: 0 | 1 | 2;
  /** The LWT message body. */
  message?: string;
  /** Whether the broker retains the LWT message. */
  retain?: boolean;
}

/**
 * MQTT server binding — connection-level client configuration.
 *
 * @see https://github.com/asyncapi/bindings/tree/master/mqtt#server-binding-object
 */
export interface MqttServerBinding extends WithBindingVersion {
  /** The client identifier. */
  clientId?: string;
  /** Whether the connection is non-persistent (`clean start` in MQTTv5). */
  cleanSession?: boolean;
  /** Last Will and Testament configuration. */
  lastWill?: MqttLastWill;
  /** Keep-alive interval in seconds. */
  keepAlive?: number;
  /** Session expiry interval in seconds, or a Schema Object. */
  sessionExpiryInterval?: number | AsyncApiSchemaObject;
  /** Maximum packet size in bytes the client accepts, or a Schema Object. */
  maximumPacketSize?: number | AsyncApiSchemaObject;
}

/**
 * MQTT operation binding — delivery semantics for the message flow.
 *
 * @see https://github.com/asyncapi/bindings/tree/master/mqtt#operation-binding-object
 */
export interface MqttOperationBinding extends WithBindingVersion {
  /** Quality of Service level (0, 1, or 2). */
  qos?: 0 | 1 | 2;
  /** Whether the broker retains the message. */
  retain?: boolean;
  /** Lifetime of the message in seconds, or a Schema Object. */
  messageExpiryInterval?: number | AsyncApiSchemaObject;
}

/**
 * MQTT message binding — payload-format and request/response metadata.
 *
 * @see https://github.com/asyncapi/bindings/tree/master/mqtt#message-binding-object
 */
export interface MqttMessageBinding extends WithBindingVersion {
  /** 1 if the payload is UTF-8 text, 0 if unspecified. */
  payloadFormatIndicator?: 0 | 1;
  /** Correlation data, as a Schema Object or a `$ref`. */
  correlationData?: AsyncApiSchemaObject | AsyncApiReference;
  /** Content type of the message payload. */
  contentType?: string;
  /** Topic to send a response message to, or a Schema Object. */
  responseTopic?: string | AsyncApiSchemaObject;
}

// ---------------------------------------------------------------------------
// AMQP
// ---------------------------------------------------------------------------

/**
 * AMQP exchange definition used by a channel bound as a routing key.
 */
export interface AmqpExchange {
  /** The exchange name (max 255 characters). */
  name?: string;
  /** The exchange type. */
  type?: 'topic' | 'direct' | 'fanout' | 'default' | 'headers';
  /** Whether the exchange survives broker restarts. */
  durable?: boolean;
  /** Whether the exchange is deleted when the last queue unbinds. */
  autoDelete?: boolean;
  /** The virtual host of the exchange. Defaults to `/`. */
  vhost?: string;
}

/**
 * AMQP queue definition used by a channel bound as a queue.
 */
export interface AmqpQueue {
  /** The queue name (max 255 characters). */
  name?: string;
  /** Whether the queue survives broker restarts. */
  durable?: boolean;
  /** Whether the queue is used by only one connection. */
  exclusive?: boolean;
  /** Whether the queue is deleted when the last consumer unsubscribes. */
  autoDelete?: boolean;
  /** The virtual host of the queue. Defaults to `/`. */
  vhost?: string;
}

/**
 * AMQP channel binding — whether the channel is a queue or a routing key, plus
 * the exchange or queue definition.
 *
 * @see https://github.com/asyncapi/bindings/tree/master/amqp#channel-binding-object
 */
export interface AmqpChannelBinding extends WithBindingVersion {
  /** Whether the channel is a `queue` or a `routingKey` (default). */
  is?: 'queue' | 'routingKey';
  /** The exchange definition, when `is` is `routingKey`. */
  exchange?: AmqpExchange;
  /** The queue definition, when `is` is `queue`. */
  queue?: AmqpQueue;
}

/**
 * AMQP operation binding — per-message delivery options.
 *
 * @see https://github.com/asyncapi/bindings/tree/master/amqp#operation-binding-object
 */
export interface AmqpOperationBinding extends WithBindingVersion {
  /** TTL for the message in milliseconds (>= 0). */
  expiration?: number;
  /** User who sent the message. */
  userId?: string;
  /** Routing keys the message is also routed to. */
  cc?: string[];
  /** A priority for the message. */
  priority?: number;
  /** Delivery mode: 1 (transient) or 2 (persistent). */
  deliveryMode?: 1 | 2;
  /** Whether the message is mandatory. */
  mandatory?: boolean;
  /** Like `cc`, but consumers do not receive this information. */
  bcc?: string[];
  /** Whether the message includes a timestamp. */
  timestamp?: boolean;
  /** Whether the consumer acks the message. */
  ack?: boolean;
}

/**
 * AMQP message binding — content encoding and application message type.
 *
 * @see https://github.com/asyncapi/bindings/tree/master/amqp#message-binding-object
 */
export interface AmqpMessageBinding extends WithBindingVersion {
  /** A MIME encoding for the message content. */
  contentEncoding?: string;
  /** Application-specific message type. */
  messageType?: string;
}

// ---------------------------------------------------------------------------
// Binding maps (one per AsyncAPI binding scope)
// ---------------------------------------------------------------------------

/**
 * A protocol-keyed map of server bindings, attached to a server with
 * {@link AsyncApiServer}. Typed for Kafka and MQTT (the protocols that define a
 * server binding) while staying open for other protocols' spec primitives.
 *
 * @see https://www.asyncapi.com/docs/reference/specification/v3.0.0#serverBindingsObject
 */
export interface AsyncApiServerBindingsMap {
  /** Kafka server binding. */
  kafka?: KafkaServerBinding;
  /** MQTT server binding. */
  mqtt?: MqttServerBinding;
  /** Any other protocol binding, emitted verbatim. */
  [protocol: string]: Record<string, unknown> | undefined;
}

/**
 * A protocol-keyed map of channel bindings, attached with
 * {@link AsyncApiChannelBindings}. Typed for Kafka and AMQP (the protocols that
 * define a channel binding) while staying open for other protocols.
 *
 * @see https://www.asyncapi.com/docs/reference/specification/v3.0.0#channelBindingsObject
 */
export interface AsyncApiChannelBindingsMap {
  /** Kafka channel binding. */
  kafka?: KafkaChannelBinding;
  /** AMQP channel binding. */
  amqp?: AmqpChannelBinding;
  /** Any other protocol binding, emitted verbatim. */
  [protocol: string]: Record<string, unknown> | undefined;
}

/**
 * A protocol-keyed map of operation bindings, attached with
 * {@link AsyncApiOperationBindings}. Typed for all four v1 protocols, which each
 * define an operation binding, while staying open for other protocols.
 *
 * @see https://www.asyncapi.com/docs/reference/specification/v3.0.0#operationBindingsObject
 */
export interface AsyncApiOperationBindingsMap {
  /** Kafka operation binding. */
  kafka?: KafkaOperationBinding;
  /** NATS operation binding. */
  nats?: NatsOperationBinding;
  /** MQTT operation binding. */
  mqtt?: MqttOperationBinding;
  /** AMQP operation binding. */
  amqp?: AmqpOperationBinding;
  /** Any other protocol binding, emitted verbatim. */
  [protocol: string]: Record<string, unknown> | undefined;
}

/**
 * A protocol-keyed map of message bindings, attached with
 * {@link AsyncApiMessageBindings}. Typed for Kafka, MQTT, and AMQP (the v1
 * protocols that define a message binding) while staying open for other
 * protocols.
 *
 * @see https://www.asyncapi.com/docs/reference/specification/v3.0.0#messageBindingsObject
 */
export interface AsyncApiMessageBindingsMap {
  /** Kafka message binding. */
  kafka?: KafkaMessageBinding;
  /** MQTT message binding. */
  mqtt?: MqttMessageBinding;
  /** AMQP message binding. */
  amqp?: AmqpMessageBinding;
  /** Any other protocol binding, emitted verbatim. */
  [protocol: string]: Record<string, unknown> | undefined;
}
