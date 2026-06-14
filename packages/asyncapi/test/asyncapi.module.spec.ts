import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  ASYNC_API_MODULE_OPTIONS,
  AsyncApiModule,
} from '../asyncapi.module';
import { AsyncApiModuleOptions } from '../interfaces';

@Injectable()
class MarkerProvider {
  readonly name = 'marker';
}

describe('AsyncApiModule', () => {
  it('provides default options when forRoot is called without arguments', async () => {
    const module = await Test.createTestingModule({
      imports: [AsyncApiModule.forRoot()],
    }).compile();

    assert.deepEqual(
      module.get<AsyncApiModuleOptions>(ASYNC_API_MODULE_OPTIONS),
      {},
    );
  });

  it('provides the supplied options through forRoot', async () => {
    const options: AsyncApiModuleOptions = {
      defaultInfo: { title: 'Orders API' },
    };

    const module = await Test.createTestingModule({
      imports: [AsyncApiModule.forRoot(options)],
    }).compile();

    assert.equal(
      module.get<AsyncApiModuleOptions>(ASYNC_API_MODULE_OPTIONS),
      options,
    );
  });

  it('is global by default and allows explicit opt-out via forRoot', () => {
    assert.equal(AsyncApiModule.forRoot().global, true);
    assert.equal(AsyncApiModule.forRoot({ isGlobal: true }).global, true);
    assert.equal(AsyncApiModule.forRoot({ isGlobal: false }).global, false);
  });

  it('resolves options through forRootAsync useFactory', async () => {
    const options: AsyncApiModuleOptions = {
      defaultInfo: { title: 'Async Orders API' },
    };

    const module = await Test.createTestingModule({
      imports: [
        AsyncApiModule.forRootAsync({
          useFactory: async () => options,
        }),
      ],
    }).compile();

    assert.equal(
      module.get<AsyncApiModuleOptions>(ASYNC_API_MODULE_OPTIONS),
      options,
    );
  });

  it('injects dependencies and registers extra providers in forRootAsync', async () => {
    const module = await Test.createTestingModule({
      imports: [
        AsyncApiModule.forRootAsync({
          imports: [],
          inject: [MarkerProvider],
          extraProviders: [MarkerProvider],
          useFactory: (marker: MarkerProvider) => ({
            defaultInfo: { title: marker.name },
          }),
        }),
      ],
    }).compile();

    assert.deepEqual(
      module.get<AsyncApiModuleOptions>(ASYNC_API_MODULE_OPTIONS),
      {
        defaultInfo: { title: 'marker' },
      },
    );
    assert.equal(module.get(MarkerProvider).name, 'marker');
  });

  it('is global by default and allows explicit opt-out via forRootAsync', () => {
    const defaulted = AsyncApiModule.forRootAsync({
      useFactory: () => ({}),
    });
    const explicitTrue = AsyncApiModule.forRootAsync({
      isGlobal: true,
      useFactory: () => ({}),
    });
    const explicitFalse = AsyncApiModule.forRootAsync({
      isGlobal: false,
      useFactory: () => ({}),
    });

    assert.equal(defaulted.global, true);
    assert.deepEqual(defaulted.imports, []);
    assert.equal(explicitTrue.global, true);
    assert.equal(explicitFalse.global, false);
  });
});
