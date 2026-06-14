# Sample 04 - Docs Route with Viewer

Demonstrates serving generated AsyncAPI documentation over a running NestJS HTTP
server with `AsyncApiModule.setup` — the AsyncAPI counterpart to
`SwaggerModule.setup`.

`setup` mounts three GET routes on the application's existing HTTP adapter:

- `/<path>` — an HTML page rendering the `@asyncapi/react-component` viewer with
  the generated spec embedded inline
- `/<path>-json` — the raw document as JSON (`application/json`)
- `/<path>-yaml` — the raw document as YAML (`application/yaml`), the canonical
  AsyncAPI interchange format

The viewer assets load from a CDN by default and are overridable for air-gapped
deployments (`scriptUrl` / `stylesUrl`), so the package itself ships no viewer
runtime dependency.

## What It Demonstrates

- `AsyncApiModule.setup(path, app, document, options)` wiring the viewer and the
  JSON/YAML spec routes after the HTTP app is created
- The viewer page embedding the spec inline (no second request, no CORS boundary)
- The served JSON and YAML documents both passing `@asyncapi/parser` validation
- Customizing the page title via `options.title`

## Commands

```bash
npm run test --workspace nest-native-asyncapi-sample-04-docs-route
npm run start --workspace nest-native-asyncapi-sample-04-docs-route
```

`test` typechecks the sample and runs a smoke script that boots the application
over a real HTTP server, fetches the viewer page and the JSON/YAML spec routes,
and validates the served documents with `@asyncapi/parser`. `start` serves the
docs at `http://localhost:3000/async-docs`.

## Main Files

- `src/main.ts`: creates the HTTP app, generates the document, and calls
  `AsyncApiModule.setup`.
- `src/orders/orders.handler.ts`: the channel handler rendered by the viewer.
- `src/asyncapi.ts`: builds the AsyncAPI document from the running application.
- `scripts/smoke.ts`: boots the app over HTTP and asserts the three routes serve
  a valid document.
