import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ASYNC_API_VERSION, AsyncApiDocument } from '../document';
import {
  DEFAULT_VIEWER_SCRIPT_URL,
  DEFAULT_VIEWER_STYLES_URL,
  DEFAULT_VIEWER_TITLE,
  renderViewerHtml,
} from '../viewer';

function baseDocument(): AsyncApiDocument {
  return {
    asyncapi: ASYNC_API_VERSION,
    info: { title: 'Orders Service', version: '1.0.0' },
    channels: {},
    operations: {},
    components: {},
  };
}

describe('renderViewerHtml', () => {
  it('embeds the spec as a JSON string handed to the standalone viewer', () => {
    const html = renderViewerHtml(baseDocument());

    assert.match(html, /<!DOCTYPE html>/);
    assert.match(html, /AsyncApiStandalone\.render\(/);
    assert.match(html, /document\.getElementById\('asyncapi'\)/);
    // The spec is embedded as a JSON-encoded string literal, not an object.
    assert.match(html, /schema: "\{\\n {2}\\"asyncapi\\": \\"3.0.0\\"/);
  });

  it('defaults the title and the CDN asset URLs', () => {
    const html = renderViewerHtml(baseDocument());

    assert.match(html, new RegExp(`<title>${DEFAULT_VIEWER_TITLE}</title>`));
    assert.ok(html.includes(`href="${DEFAULT_VIEWER_STYLES_URL}"`));
    assert.ok(html.includes(`src="${DEFAULT_VIEWER_SCRIPT_URL}"`));
  });

  it('honors a custom title and self-hosted asset URLs', () => {
    const html = renderViewerHtml(baseDocument(), {
      title: 'Orders Events',
      scriptUrl: 'https://assets.example.com/asyncapi/standalone.js',
      stylesUrl: 'https://assets.example.com/asyncapi/styles.css',
    });

    assert.match(html, /<title>Orders Events<\/title>/);
    assert.ok(html.includes('src="https://assets.example.com/asyncapi/standalone.js"'));
    assert.ok(
      html.includes('href="https://assets.example.com/asyncapi/styles.css"'),
    );
  });

  it('escapes HTML metacharacters in the title and asset URLs', () => {
    const html = renderViewerHtml(baseDocument(), {
      title: 'A & B <script>',
      scriptUrl: 'https://x/?a=1&b="2"',
      stylesUrl: "https://x/?c='3'",
    });

    assert.ok(html.includes('<title>A &amp; B &lt;script&gt;</title>'));
    assert.ok(html.includes('src="https://x/?a=1&amp;b=&quot;2&quot;"'));
    assert.ok(html.includes("href=\"https://x/?c=&#39;3&#39;\""));
    assert.ok(!html.includes('<title>A & B <script>'));
  });

  it('neutralizes a closing script tag hidden inside the spec', () => {
    const document = baseDocument();
    document.info.description = 'pwn </script><img src=x onerror=alert(1)>';

    const html = renderViewerHtml(document);

    assert.ok(!html.includes('</script><img'));
    assert.ok(html.includes('\\u003c/script>'));
  });
});
