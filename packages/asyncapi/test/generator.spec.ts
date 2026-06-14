import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Controller, Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ASYNC_API_VERSION } from '../document';
import {
  buildAsyncApiDocument,
  DEFAULT_DOCUMENT_TITLE,
  DEFAULT_DOCUMENT_VERSION,
  getAsyncApiDocument,
} from '../generator';
import { AsyncApiModule } from '../asyncapi.module';
import { ScannedHandler } from '../scanner';

@Injectable()
class OrdersService {
  emit(): void {}
}

@Controller()
class OrdersController {
  handle(): void {}
}

describe('buildAsyncApiDocument', () => {
  it('emits an empty valid AsyncAPI 3.0 document with defaults', () => {
    const document = buildAsyncApiDocument({}, []);

    assert.deepEqual(document, {
      asyncapi: ASYNC_API_VERSION,
      info: {
        title: DEFAULT_DOCUMENT_TITLE,
        version: DEFAULT_DOCUMENT_VERSION,
      },
      channels: {},
      operations: {},
      components: {},
    });
  });

  it('targets AsyncAPI specification version 3.0.0', () => {
    assert.equal(ASYNC_API_VERSION, '3.0.0');
    assert.equal(buildAsyncApiDocument({}, []).asyncapi, '3.0.0');
  });

  it('copies through every supplied info field', () => {
    const document = buildAsyncApiDocument(
      {
        title: 'Orders API',
        version: '2.3.4',
        description: 'Order lifecycle events',
        termsOfService: 'https://example.com/tos',
        contact: { name: 'Platform', email: 'platform@example.com' },
        license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
      },
      [],
    );

    assert.deepEqual(document.info, {
      title: 'Orders API',
      version: '2.3.4',
      description: 'Order lifecycle events',
      termsOfService: 'https://example.com/tos',
      contact: { name: 'Platform', email: 'platform@example.com' },
      license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
    });
  });

  it('omits optional info fields that are not provided', () => {
    const document = buildAsyncApiDocument({ title: 'Only Title' }, []);

    assert.deepEqual(document.info, {
      title: 'Only Title',
      version: DEFAULT_DOCUMENT_VERSION,
    });
    assert.ok(!('description' in document.info));
    assert.ok(!('termsOfService' in document.info));
    assert.ok(!('contact' in document.info));
    assert.ok(!('license' in document.info));
  });

  it('ignores discovered handlers until decorators are introduced', () => {
    const handlers: ScannedHandler[] = [
      { metatype: OrdersService, methodNames: ['emit'] },
    ];

    const document = buildAsyncApiDocument({}, handlers);

    assert.deepEqual(document.channels, {});
    assert.deepEqual(document.operations, {});
  });
});

describe('getAsyncApiDocument', () => {
  it('walks a running application and emits an empty valid document', async () => {
    const app = await Test.createTestingModule({
      imports: [AsyncApiModule.forRoot({ defaultInfo: { title: 'Orders' } })],
      controllers: [OrdersController],
      providers: [OrdersService],
    }).compile();
    await app.init();

    try {
      const document = getAsyncApiDocument(app, {
        title: 'Orders API',
        version: '1.2.3',
      });

      assert.equal(document.asyncapi, ASYNC_API_VERSION);
      assert.equal(document.info.title, 'Orders API');
      assert.equal(document.info.version, '1.2.3');
      assert.deepEqual(document.channels, {});
      assert.deepEqual(document.operations, {});
      assert.deepEqual(document.components, {});
    } finally {
      await app.close();
    }
  });

  it('defaults the document config when none is supplied', async () => {
    const app = await Test.createTestingModule({
      providers: [OrdersService],
    }).compile();
    await app.init();

    try {
      const document = getAsyncApiDocument(app);

      assert.equal(document.info.title, DEFAULT_DOCUMENT_TITLE);
      assert.equal(document.info.version, DEFAULT_DOCUMENT_VERSION);
    } finally {
      await app.close();
    }
  });
});
