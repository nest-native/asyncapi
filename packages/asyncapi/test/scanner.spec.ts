import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Type } from '@nestjs/common';
import { MetadataScanner } from '@nestjs/core';
import { AsyncApiDocumentScanner } from '../scanner';

interface FakeWrapper {
  instance?: unknown;
  metatype?: Type | Function | null;
}

class FakeModule {
  constructor(
    readonly providers: Map<unknown, FakeWrapper>,
    readonly controllers: Map<unknown, FakeWrapper>,
  ) {}
}

function fakeContainer(modules: FakeModule[]): Map<string, FakeModule> {
  const container = new Map<string, FakeModule>();
  modules.forEach((module, index) => container.set(`module-${index}`, module));
  return container;
}

class OrdersHandler {
  handleCreated(): void {}
  handleShipped(): void {}
}

class CatsController {
  findAll(): void {}
}

describe('AsyncApiDocumentScanner', () => {
  it('walks providers and controllers across every module', () => {
    const ordersInstance = new OrdersHandler();
    const catsInstance = new CatsController();

    const moduleA = new FakeModule(
      new Map<unknown, FakeWrapper>([
        ['orders', { instance: ordersInstance, metatype: OrdersHandler }],
      ]),
      new Map<unknown, FakeWrapper>(),
    );
    const moduleB = new FakeModule(
      new Map<unknown, FakeWrapper>(),
      new Map<unknown, FakeWrapper>([
        ['cats', { instance: catsInstance, metatype: CatsController }],
      ]),
    );

    const scanner = new AsyncApiDocumentScanner(
      fakeContainer([moduleA, moduleB]) as never,
      new MetadataScanner(),
    );

    const handlers = scanner.scan();

    assert.equal(handlers.length, 2);

    const orders = handlers.find((h) => h.metatype === OrdersHandler);
    assert.ok(orders);
    assert.deepEqual(orders.methodNames.sort(), [
      'handleCreated',
      'handleShipped',
    ]);

    const cats = handlers.find((h) => h.metatype === CatsController);
    assert.ok(cats);
    assert.deepEqual(cats.methodNames, ['findAll']);
  });

  it('skips wrappers without a resolvable instance or metatype', () => {
    const valid = new OrdersHandler();

    const module = new FakeModule(
      new Map<unknown, FakeWrapper>([
        // Missing instance (e.g. a value provider that is undefined).
        ['no-instance', { instance: undefined, metatype: OrdersHandler }],
        // Primitive instance (e.g. a string/number value provider).
        ['primitive', { instance: 'just-a-value', metatype: OrdersHandler }],
        // Missing metatype (e.g. a useValue provider).
        ['no-metatype', { instance: valid, metatype: null }],
        // A genuine handler that must be collected.
        ['ok', { instance: valid, metatype: OrdersHandler }],
      ]),
      new Map<unknown, FakeWrapper>(),
    );

    const scanner = new AsyncApiDocumentScanner(
      fakeContainer([module]) as never,
      new MetadataScanner(),
    );

    const handlers = scanner.scan();

    assert.equal(handlers.length, 1);
    assert.equal(handlers[0].metatype, OrdersHandler);
  });

  it('returns an empty list when there are no modules', () => {
    const scanner = new AsyncApiDocumentScanner(
      fakeContainer([]) as never,
      new MetadataScanner(),
    );

    assert.deepEqual(scanner.scan(), []);
  });
});
