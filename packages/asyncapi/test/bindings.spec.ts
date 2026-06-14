import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AsyncApiProtocol } from '../bindings';

describe('AsyncApiProtocol', () => {
  it('exposes the four v1 transport protocol keys', () => {
    assert.deepEqual(AsyncApiProtocol, {
      Kafka: 'kafka',
      Nats: 'nats',
      Mqtt: 'mqtt',
      Amqp: 'amqp',
    });
  });

  it('uses the protocol keys AsyncAPI binding maps are keyed by', () => {
    assert.equal(AsyncApiProtocol.Kafka, 'kafka');
    assert.equal(AsyncApiProtocol.Nats, 'nats');
    assert.equal(AsyncApiProtocol.Mqtt, 'mqtt');
    assert.equal(AsyncApiProtocol.Amqp, 'amqp');
  });
});
