import { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AsyncApiDocument } from './document';
import { toJson, toYaml } from './serializer';
import { AsyncApiViewerOptions, renderViewerHtml } from './viewer';

/**
 * Options for {@link setupAsyncApiDocs}, controlling the served routes and the
 * viewer page. Viewer presentation options ({@link AsyncApiViewerOptions}) are
 * forwarded to the HTML page renderer.
 */
export interface AsyncApiDocsOptions extends AsyncApiViewerOptions {
  /**
   * The route serving the raw document as JSON.
   *
   * @default `${path}-json`
   */
  jsonDocumentUrl?: string;

  /**
   * The route serving the raw document as YAML.
   *
   * @default `${path}-yaml`
   */
  yamlDocumentUrl?: string;
}

/**
 * The minimal HTTP adapter surface the docs routes depend on. Nest's
 * `AbstractHttpAdapter` exposes `get`, `getInstance`, and `getHttpServer`; typing
 * only what is used keeps this adapter-agnostic across Express and Fastify
 * without importing either framework's types.
 */
interface DocsHttpAdapter {
  get(path: string, handler: (req: unknown, res: HttpResponseLike) => void): void;
  getType?(): string;
}

/**
 * The slice of an HTTP response the handlers use. Express and Fastify diverge in
 * their response API, so each writer probes for the method it needs and falls
 * back across the alternatives, exactly as a transport-agnostic Nest integration
 * must.
 */
interface HttpResponseLike {
  type?(contentType: string): unknown;
  header?(name: string, value: string): unknown;
  setHeader?(name: string, value: string): unknown;
  send?(body: string): unknown;
  end?(body: string): unknown;
}

/**
 * The MIME type AsyncAPI tooling uses for a YAML document.
 */
const YAML_CONTENT_TYPE = 'application/yaml';

/**
 * Resolve the HTTP adapter from a running Nest application.
 *
 * The docs routes attach to the same HTTP server the application already runs
 * on, so a {@link HttpAdapterHost} with an initialized adapter is required.
 * Calling `setup` before the application is initialized (or on a microservice
 * with no HTTP server) is a configuration error surfaced with an actionable
 * message rather than a late `undefined` access.
 */
function resolveHttpAdapter(app: INestApplication): DocsHttpAdapter {
  const adapterHost = app.get(HttpAdapterHost, { strict: false });
  const httpAdapter = adapterHost?.httpAdapter as DocsHttpAdapter | undefined;

  if (!httpAdapter) {
    throw new Error(
      'AsyncApiModule.setup requires an initialized HTTP application. Call it ' +
        'after creating the app with an HTTP platform (e.g. ' +
        '@nestjs/platform-express) and before calling app.listen().',
    );
  }

  return httpAdapter;
}

/**
 * Set a response header through whichever API the underlying framework exposes.
 * Express offers `type`/`header`, Fastify offers `header`, and both expose the
 * Node `setHeader`; the first available wins.
 */
function setContentType(res: HttpResponseLike, contentType: string): void {
  if (typeof res.type === 'function') {
    res.type(contentType);
    return;
  }
  if (typeof res.header === 'function') {
    res.header('content-type', contentType);
    return;
  }
  res.setHeader?.('content-type', contentType);
}

/**
 * Write a response body through whichever API the underlying framework exposes.
 * Express and Fastify both provide `send`; the raw Node response provides `end`.
 */
function sendBody(res: HttpResponseLike, body: string): void {
  if (typeof res.send === 'function') {
    res.send(body);
    return;
  }
  res.end?.(body);
}

/**
 * Normalize a route to a single leading slash so the JSON/YAML defaults compose
 * predictably regardless of whether the caller passed `docs` or `/docs`.
 */
function normalizePath(path: string): string {
  return `/${path.replace(/^\/+/, '')}`;
}

/**
 * Serve an AsyncAPI document and its viewer over a running Nest application's
 * HTTP server.
 *
 * This is the AsyncAPI counterpart to `SwaggerModule.setup`: given the document
 * produced by {@link getAsyncApiDocument}, it registers three GET routes on the
 * application's existing HTTP adapter — the viewer page at `path`, the raw JSON
 * at `jsonDocumentUrl` (default `${path}-json`), and the raw YAML at
 * `yamlDocumentUrl` (default `${path}-yaml`). It is adapter-agnostic and works
 * on both `@nestjs/platform-express` and `@nestjs/platform-fastify`.
 *
 * The document is captured at setup time, mirroring `@nestjs/swagger`'s
 * generate-on-boot model, so the served spec is stable for the process lifetime.
 *
 * Call this before `app.listen()` (and before any explicit `app.init()`), the
 * same ordering `SwaggerModule.setup` requires: the routes attach to the HTTP
 * adapter before the server finalizes its routing table. The application's
 * modules are already discoverable after `NestFactory.create`, so
 * {@link getAsyncApiDocument} can build the document at that point.
 *
 * @returns The normalized routes the docs were mounted on.
 */
export function setupAsyncApiDocs(
  path: string,
  app: INestApplication,
  document: AsyncApiDocument,
  options: AsyncApiDocsOptions = {},
): { uiUrl: string; jsonUrl: string; yamlUrl: string } {
  const httpAdapter = resolveHttpAdapter(app);
  const uiUrl = normalizePath(path);
  const jsonUrl = normalizePath(options.jsonDocumentUrl ?? `${uiUrl}-json`);
  const yamlUrl = normalizePath(options.yamlDocumentUrl ?? `${uiUrl}-yaml`);

  const html = renderViewerHtml(document, options);
  const json = toJson(document);
  const yaml = toYaml(document);

  httpAdapter.get(jsonUrl, (_req, res) => {
    setContentType(res, 'application/json');
    sendBody(res, json);
  });

  httpAdapter.get(yamlUrl, (_req, res) => {
    setContentType(res, YAML_CONTENT_TYPE);
    sendBody(res, yaml);
  });

  httpAdapter.get(uiUrl, (_req, res) => {
    setContentType(res, 'text/html');
    sendBody(res, html);
  });

  return { uiUrl, jsonUrl, yamlUrl };
}
