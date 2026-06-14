import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HttpAdapterHost } from '@nestjs/core';
import { AsyncApiModule } from '../asyncapi.module';
import { setupAsyncApiDocs } from '../docs';
import { ASYNC_API_VERSION, AsyncApiDocument } from '../document';

function baseDocument(): AsyncApiDocument {
  return {
    asyncapi: ASYNC_API_VERSION,
    info: { title: 'Orders Service', version: '1.0.0' },
    channels: {},
    operations: {},
    components: {},
  };
}

interface RegisteredRoute {
  path: string;
  handler: (req: unknown, res: unknown) => void;
}

/**
 * A fake HTTP adapter that records the GET routes registered against it. Each
 * test invokes the recorded handler with a fake response to assert what was
 * written for that route.
 */
class FakeAdapter {
  readonly routes: RegisteredRoute[] = [];

  get(path: string, handler: (req: unknown, res: unknown) => void): void {
    this.routes.push({ path, handler });
  }

  route(path: string): RegisteredRoute {
    const found = this.routes.find((route) => route.path === path);
    assert.ok(found, `route ${path} was registered`);
    return found;
  }
}

/**
 * A fake Nest application exposing only the `get(HttpAdapterHost)` lookup the
 * docs setup performs, wired to the supplied adapter (or none).
 */
function appWithAdapter(httpAdapter: unknown): any {
  return {
    get(token: unknown, _options?: unknown) {
      if (token === HttpAdapterHost) {
        return { httpAdapter };
      }
      return undefined;
    },
  };
}

/**
 * An Express-style response: `type()` sets the content type and `send()` writes
 * the body.
 */
function expressResponse(): {
  contentType?: string;
  body?: string;
  type(value: string): void;
  send(value: string): void;
} {
  return {
    type(value: string) {
      this.contentType = value;
    },
    send(value: string) {
      this.body = value;
    },
  };
}

describe('setupAsyncApiDocs', () => {
  it('registers the viewer, JSON, and YAML routes with default URLs', () => {
    const adapter = new FakeAdapter();
    const result = setupAsyncApiDocs(
      'docs',
      appWithAdapter(adapter),
      baseDocument(),
    );

    assert.deepEqual(result, {
      uiUrl: '/docs',
      jsonUrl: '/docs-json',
      yamlUrl: '/docs-yaml',
    });
    assert.deepEqual(
      adapter.routes.map((route) => route.path),
      ['/docs-json', '/docs-yaml', '/docs'],
    );
  });

  it('normalizes a leading slash on the base path', () => {
    const adapter = new FakeAdapter();
    const result = setupAsyncApiDocs(
      '/async-docs',
      appWithAdapter(adapter),
      baseDocument(),
    );

    assert.equal(result.uiUrl, '/async-docs');
    assert.equal(result.jsonUrl, '/async-docs-json');
  });

  it('honors custom JSON and YAML document URLs', () => {
    const adapter = new FakeAdapter();
    const result = setupAsyncApiDocs(
      'docs',
      appWithAdapter(adapter),
      baseDocument(),
      { jsonDocumentUrl: 'spec.json', yamlDocumentUrl: '/spec.yaml' },
    );

    assert.equal(result.jsonUrl, '/spec.json');
    assert.equal(result.yamlUrl, '/spec.yaml');
    adapter.route('/spec.json');
    adapter.route('/spec.yaml');
  });

  it('serves JSON with the application/json content type', () => {
    const adapter = new FakeAdapter();
    setupAsyncApiDocs('docs', appWithAdapter(adapter), baseDocument());

    const res = expressResponse();
    adapter.route('/docs-json').handler({}, res);

    assert.equal(res.contentType, 'application/json');
    assert.deepEqual(JSON.parse(res.body ?? ''), baseDocument());
  });

  it('serves YAML with the application/yaml content type', () => {
    const adapter = new FakeAdapter();
    setupAsyncApiDocs('docs', appWithAdapter(adapter), baseDocument());

    const res = expressResponse();
    adapter.route('/docs-yaml').handler({}, res);

    assert.equal(res.contentType, 'application/yaml');
    assert.match(res.body ?? '', /^asyncapi: 3\.0\.0$/m);
  });

  it('serves the viewer page with the text/html content type', () => {
    const adapter = new FakeAdapter();
    setupAsyncApiDocs('docs', appWithAdapter(adapter), baseDocument());

    const res = expressResponse();
    adapter.route('/docs').handler({}, res);

    assert.equal(res.contentType, 'text/html');
    assert.match(res.body ?? '', /AsyncApiStandalone\.render\(/);
  });

  it('sets the content type via header() when type() is unavailable', () => {
    const adapter = new FakeAdapter();
    setupAsyncApiDocs('docs', appWithAdapter(adapter), baseDocument());

    let header: { name: string; value: string } | undefined;
    let body: string | undefined;
    adapter.route('/docs-json').handler(
      {},
      {
        header(name: string, value: string) {
          header = { name, value };
        },
        send(value: string) {
          body = value;
        },
      },
    );

    assert.deepEqual(header, { name: 'content-type', value: 'application/json' });
    assert.deepEqual(JSON.parse(body ?? ''), baseDocument());
  });

  it('falls back to setHeader() and end() on a bare Node response', () => {
    const adapter = new FakeAdapter();
    setupAsyncApiDocs('docs', appWithAdapter(adapter), baseDocument());

    const headers: Record<string, string> = {};
    let body: string | undefined;
    adapter.route('/docs-yaml').handler(
      {},
      {
        setHeader(name: string, value: string) {
          headers[name] = value;
        },
        end(value: string) {
          body = value;
        },
      },
    );

    assert.equal(headers['content-type'], 'application/yaml');
    assert.match(body ?? '', /^asyncapi: 3\.0\.0$/m);
  });

  it('throws an actionable error when the app has no HTTP adapter', () => {
    assert.throws(
      () => setupAsyncApiDocs('docs', appWithAdapter(undefined), baseDocument()),
      /requires an initialized HTTP application/,
    );
  });

  it('throws when the HttpAdapterHost itself is absent', () => {
    const app: any = { get: () => undefined };
    assert.throws(
      () => setupAsyncApiDocs('docs', app, baseDocument()),
      /requires an initialized HTTP application/,
    );
  });
});

describe('AsyncApiModule.setup', () => {
  it('delegates to setupAsyncApiDocs and returns the mounted routes', () => {
    const adapter = new FakeAdapter();
    const result = AsyncApiModule.setup(
      'docs',
      appWithAdapter(adapter),
      baseDocument(),
    );

    assert.deepEqual(result, {
      uiUrl: '/docs',
      jsonUrl: '/docs-json',
      yamlUrl: '/docs-yaml',
    });
  });
});
