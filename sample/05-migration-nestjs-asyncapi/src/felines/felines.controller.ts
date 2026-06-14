import { Controller, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import {
  AsyncApiChannel,
  AsyncApiMessage,
  AsyncApiOperationBindings,
  AsyncApiPub,
  AsyncApiServer,
  AsyncApiSub,
} from '@nest-native/asyncapi';
import { FelineEventDto, JournalEntryDto } from './feline.messages';

/**
 * The channel addresses, kept as constants exactly as the original
 * `nestjs-asyncapi` sample did, so the `@EventPattern` transport and the
 * `@AsyncApiChannel` documentation always agree on the address.
 */
const Channels = {
  CreateFeline: 'ms/create/feline',
  Journal: 'ms/journal',
} as const;

/**
 * The `ms/create/feline` channel handler, ported from the `nestjs-asyncapi`
 * felines microservice controller.
 *
 * In `nestjs-asyncapi` (2.x) a single method stacked `@AsyncApiSend` and
 * `@AsyncApiReceive`, each carrying its own `{ channel, message }`. AsyncAPI 3.0
 * separates the channel (the address) from the operations (the send/receive
 * actions), so the migration is mechanical:
 *
 * - the shared `channel` moves up to a class-level `@AsyncApiChannel('id')`;
 * - `@AsyncApiSend({ message: { payload } })` becomes a method-level
 *   `@AsyncApiPub()` + `@AsyncApiMessage(Dto)`;
 * - `@AsyncApiReceive({ message: { payload } })` becomes `@AsyncApiSub()` +
 *   `@AsyncApiMessage(Dto)`.
 *
 * The `@EventPattern` microservice binding is untouched — `@nest-native/asyncapi`
 * documents the handler without taking over its transport.
 */
@Controller()
@AsyncApiServer('felines-broker', 'tcp://localhost:4001', 'tcp', {
  title: 'Felines microservice',
  description:
    'The TCP microservice the felines events flow over. In nestjs-asyncapi ' +
    'this was declared with AsyncApiDocumentBuilder().addServers(); here it is ' +
    'a class-level @AsyncApiServer decorator.',
})
@AsyncApiChannel(Channels.CreateFeline, {
  title: 'Create feline',
  description: 'Requests to create a feline and the resulting feline events.',
})
export class CreateFelineController {
  private readonly logger = new Logger(CreateFelineController.name);

  /**
   * Publish a "create feline" command. Was `@AsyncApiSend` on the original
   * `createFeline` method.
   */
  @AsyncApiPub({
    operationId: 'publishCreateFeline',
    summary: 'Request that a feline be created.',
  })
  @AsyncApiMessage(FelineEventDto, {
    name: 'FelineEvent',
    summary: 'A feline create request or result.',
  })
  @AsyncApiOperationBindings({
    amqp: { deliveryMode: 2, bindingVersion: '0.3.0' },
  })
  publishCreateFeline(): void {
    // Transport is out of scope for @nest-native/asyncapi; a real service emits
    // through @nestjs/microservices (the @EventPattern below) here.
  }

  /**
   * Consume "create feline" events. Was `@AsyncApiReceive` + `@EventPattern` on
   * the original `createFeline` method.
   */
  @AsyncApiSub({
    operationId: 'onCreateFeline',
    summary: 'React to a feline being created.',
  })
  @AsyncApiMessage(FelineEventDto, {
    name: 'FelineEvent',
    summary: 'A feline create request or result.',
  })
  @EventPattern(Channels.CreateFeline)
  handleCreateFeline(event: FelineEventDto): void {
    this.logger.log(`feline created: ${event.payload.name}`);
  }
}

/**
 * The `ms/journal` channel handler. Ported from the original `journal`
 * `@EventPattern` + `@AsyncApiReceive` method — a pure receive channel.
 */
@Controller()
@AsyncApiChannel(Channels.Journal, {
  title: 'Journal',
  description: 'An audit log of feline lifecycle events.',
})
export class JournalController {
  private readonly logger = new Logger(JournalController.name);

  /**
   * Consume journal entries. Was `@AsyncApiReceive` + `@EventPattern`.
   */
  @AsyncApiSub({
    operationId: 'onJournalEntry',
    summary: 'Record a journal entry.',
  })
  @AsyncApiMessage(JournalEntryDto, {
    name: 'JournalEntry',
    summary: 'A single audit-log entry.',
  })
  @EventPattern(Channels.Journal)
  handleJournalEntry(entry: JournalEntryDto): void {
    this.logger.log(`journaled: ${entry.event}`);
  }
}
