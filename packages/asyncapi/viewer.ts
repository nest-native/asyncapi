import { AsyncApiDocument } from './document';
import { toJson } from './serializer';

/**
 * Default CDN locations for the `@asyncapi/react-component` standalone bundle.
 *
 * The viewer is a React application and is heavy to bundle into a non-React Nest
 * service, so by default the docs page loads the official standalone assets from
 * a CDN — the same posture `@nestjs/swagger` takes for swagger-ui assets. Both
 * URLs are overridable through {@link AsyncApiViewerOptions} for air-gapped
 * deployments that self-host the assets, and the package itself ships no viewer
 * runtime dependency (`"dependencies": {}` stays empty).
 *
 * @see https://github.com/asyncapi/asyncapi-react/blob/master/docs/usage/standalone-bundle.md
 */
export const DEFAULT_VIEWER_SCRIPT_URL =
  'https://unpkg.com/@asyncapi/react-component@2.6.4/browser/standalone/index.js';

/**
 * Default CDN location for the viewer stylesheet that pairs with
 * {@link DEFAULT_VIEWER_SCRIPT_URL}.
 */
export const DEFAULT_VIEWER_STYLES_URL =
  'https://unpkg.com/@asyncapi/react-component@2.6.4/styles/default.min.css';

/**
 * The default browser document title for the docs page.
 */
export const DEFAULT_VIEWER_TITLE = 'AsyncAPI';

/**
 * Options controlling the rendered docs page.
 */
export interface AsyncApiViewerOptions {
  /**
   * The `<title>` of the docs page and the heading shown above the viewer.
   *
   * @default 'AsyncAPI'
   */
  title?: string;

  /**
   * URL of the `@asyncapi/react-component` standalone script. Override to
   * self-host the viewer assets instead of loading them from the default CDN.
   *
   * @default {@link DEFAULT_VIEWER_SCRIPT_URL}
   */
  scriptUrl?: string;

  /**
   * URL of the viewer stylesheet. Override to self-host the viewer assets.
   *
   * @default {@link DEFAULT_VIEWER_STYLES_URL}
   */
  stylesUrl?: string;
}

/**
 * Escape a string for safe interpolation into HTML text or a double-quoted
 * attribute. The title and asset URLs are author-controlled, but escaping them
 * keeps the page well-formed and forecloses HTML injection if any value is later
 * sourced from configuration that an attacker can influence.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Serialize the document for safe embedding inside a `<script>` block. The
 * viewer reads the spec as an inline JSON string, so the document is JSON
 * encoded and then the `<` of any `</script>` sequence is neutralized so a
 * crafted string inside the spec cannot break out of the script element. No
 * secrets ever belong in a generated AsyncAPI document, but this keeps a
 * user-supplied example payload from corrupting the page or injecting markup.
 */
function encodeSpecForScript(document: AsyncApiDocument): string {
  return JSON.stringify(toJson(document)).replace(/</g, '\\u003c');
}

/**
 * Build the standalone HTML page that renders the AsyncAPI viewer for a
 * generated document.
 *
 * The page loads the standalone viewer assets (script + stylesheet) from the
 * configured URLs and hands the inlined spec to `AsyncApiStandalone.render`. The
 * spec is embedded as a string rather than fetched, so the page renders without
 * a second request and without any CORS or auth boundary between the page and
 * the spec endpoint.
 */
export function renderViewerHtml(
  document: AsyncApiDocument,
  options: AsyncApiViewerOptions = {},
): string {
  const title = escapeHtml(options.title ?? DEFAULT_VIEWER_TITLE);
  const scriptUrl = escapeHtml(options.scriptUrl ?? DEFAULT_VIEWER_SCRIPT_URL);
  const stylesUrl = escapeHtml(options.stylesUrl ?? DEFAULT_VIEWER_STYLES_URL);
  const spec = encodeSpecForScript(document);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <link rel="stylesheet" href="${stylesUrl}" />
  </head>
  <body>
    <div id="asyncapi"></div>
    <script src="${scriptUrl}"></script>
    <script>
      AsyncApiStandalone.render(
        {
          schema: ${spec},
          config: { show: { sidebar: true, errors: true } },
        },
        document.getElementById('asyncapi'),
      );
    </script>
  </body>
</html>
`;
}
