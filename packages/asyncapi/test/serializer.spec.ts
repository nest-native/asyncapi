import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Parser } from '@asyncapi/parser';
import { ASYNC_API_VERSION, AsyncApiDocument } from '../document';
import { toJson, toYaml } from '../serializer';

const parser = new Parser();

/**
 * Build a minimal-but-valid AsyncAPI 3.0 document the serializer round-trips.
 */
function baseDocument(): AsyncApiDocument {
  return {
    asyncapi: ASYNC_API_VERSION,
    info: { title: 'Orders Service', version: '1.0.0' },
    channels: {},
    operations: {},
    components: {},
  };
}

/**
 * Serialize a JSON-shaped value as the right-hand side of a single mapping key
 * so individual emitter branches can be asserted without a whole document.
 */
function yamlOf(value: unknown): string {
  const document = baseDocument() as unknown as Record<string, unknown>;
  document.probe = value;
  return toYaml(document as unknown as AsyncApiDocument);
}

describe('toJson', () => {
  it('serializes a document as two-space indented JSON', () => {
    const json = toJson(baseDocument());

    assert.equal(json, JSON.stringify(baseDocument(), null, 2));
    assert.deepEqual(JSON.parse(json), baseDocument());
  });
});

describe('toYaml', () => {
  it('emits block mappings with a trailing newline', () => {
    const yaml = toYaml(baseDocument());

    assert.ok(yaml.endsWith('\n'));
    assert.match(yaml, /^asyncapi: 3\.0\.0$/m);
    assert.match(yaml, /^info:$/m);
    assert.match(yaml, /^ {2}title: Orders Service$/m);
    assert.match(yaml, /^ {2}version: 1\.0\.0$/m);
  });

  it('emits empty mappings and arrays inline', () => {
    const yaml = toYaml(baseDocument());

    assert.match(yaml, /^channels: \{\}$/m);
    assert.match(yaml, /^operations: \{\}$/m);
    assert.match(yaml, /^components: \{\}$/m);
    assert.match(yamlOf([]), /^probe: \[\]$/m);
  });

  it('nests non-empty mappings as indented blocks', () => {
    const yaml = yamlOf({ nested: { leaf: 'value' } });

    assert.match(yaml, /^probe:$/m);
    assert.match(yaml, /^ {2}nested:$/m);
    assert.match(yaml, /^ {4}leaf: value$/m);
  });

  it('emits arrays of scalars as dash entries', () => {
    const yaml = yamlOf(['a', 'b']);

    assert.match(yaml, /^probe:$/m);
    assert.match(yaml, /^ {2}- a$/m);
    assert.match(yaml, /^ {2}- b$/m);
  });

  it('emits arrays of nested objects with the first key on the dash line', () => {
    const yaml = yamlOf([{ one: 1, two: 2 }]);

    assert.match(yaml, /^ {2}- one: 1$/m);
    assert.match(yaml, /^ {4}two: 2$/m);
  });

  it('emits arrays of single-key objects inline on the dash line', () => {
    const yaml = yamlOf([{ $ref: '#/components/messages/OrderPlaced' }]);

    assert.match(yaml, /^ {2}- \$ref: "#\/components\/messages\/OrderPlaced"$/m);
  });

  it('renders numbers, booleans, and null with canonical spelling', () => {
    const yaml = yamlOf({ count: 3, enabled: true, disabled: false, missing: null });

    assert.match(yaml, /^ {2}count: 3$/m);
    assert.match(yaml, /^ {2}enabled: true$/m);
    assert.match(yaml, /^ {2}disabled: false$/m);
    assert.match(yaml, /^ {2}missing: null$/m);
  });

  it('leaves plain strings unquoted', () => {
    assert.match(yamlOf('plain'), /^probe: plain$/m);
  });

  it('quotes empty and whitespace-padded strings', () => {
    assert.match(yamlOf(''), /^probe: ""$/m);
    assert.match(yamlOf(' padded'), /^probe: " padded"$/m);
    assert.match(yamlOf('trailing '), /^probe: "trailing "$/m);
  });

  it('quotes strings carrying YAML structural characters', () => {
    assert.match(yamlOf('a: b'), /^probe: "a: b"$/m);
    assert.match(yamlOf('has#hash'), /^probe: "has#hash"$/m);
    assert.match(yamlOf('a,b'), /^probe: "a,b"$/m);
  });

  it('quotes strings that would otherwise parse as a non-string scalar', () => {
    assert.match(yamlOf('true'), /^probe: "true"$/m);
    assert.match(yamlOf('NO'), /^probe: "NO"$/m);
    assert.match(yamlOf('null'), /^probe: "null"$/m);
    assert.match(yamlOf('~'), /^probe: "~"$/m);
    assert.match(yamlOf('42'), /^probe: "42"$/m);
    assert.match(yamlOf('-1.5e3'), /^probe: "-1\.5e3"$/m);
  });

  it('quotes strings beginning with a YAML indicator character', () => {
    assert.match(yamlOf('-leading'), /^probe: "-leading"$/m);
    assert.match(yamlOf('?leading'), /^probe: "\?leading"$/m);
    assert.match(yamlOf(':leading'), /^probe: ":leading"$/m);
  });

  it('escapes backslashes, quotes, and newlines inside quoted strings', () => {
    // A string that needs quoting (it has a quote) and also carries a backslash
    // exercises the backslash escape inside a double-quoted scalar.
    assert.match(yamlOf('a\\"b'), /probe: "a\\\\\\"b"/);
    assert.match(yamlOf('say "hi"'), /probe: "say \\"hi\\""/);
    assert.match(yamlOf('line1\nline2'), /probe: "line1\\nline2"/);
  });

  it('quotes mapping keys that would not round-trip unquoted', () => {
    const yaml = yamlOf({ 'a#b': 1, 'a:b': 2, 'order.placed': 3 });

    assert.match(yaml, /^ {2}"a#b": 1$/m);
    assert.match(yaml, /^ {2}"a:b": 2$/m);
    // A dotted channel id is a valid plain key and stays unquoted.
    assert.match(yaml, /^ {2}order\.placed: 3$/m);
  });

  it('round-trips a full document through @asyncapi/parser', async () => {
    const document: AsyncApiDocument = {
      asyncapi: ASYNC_API_VERSION,
      info: {
        title: 'Orders Service',
        version: '1.0.0',
        description: 'Event-driven orders, documented with AsyncAPI 3.0.',
      },
      servers: {
        kafka: { host: 'broker:9092', protocol: 'kafka' },
      },
      channels: {
        orders: {
          address: 'orders.v1',
          messages: { OrderPlaced: { $ref: '#/components/messages/OrderPlaced' } },
        },
      },
      operations: {
        publishOrder: {
          action: 'send',
          channel: { $ref: '#/channels/orders' },
          messages: [{ $ref: '#/channels/orders/messages/OrderPlaced' }],
        },
      },
      components: {
        messages: {
          OrderPlaced: {
            name: 'OrderPlaced',
            contentType: 'application/json',
            payload: { $ref: '#/components/schemas/OrderPlaced' },
          },
        },
        schemas: {
          OrderPlaced: {
            type: 'object',
            properties: { id: { type: 'string' } },
            required: ['id'],
          },
        },
      },
    };

    const yaml = toYaml(document);
    const { document: parsed, diagnostics } = await parser.parse(yaml);
    const errors = diagnostics.filter((diagnostic) => diagnostic.severity === 0);

    assert.deepEqual(errors, []);
    assert.ok(parsed, 'the YAML parses into a document model');
    assert.equal(parsed?.info().title(), 'Orders Service');
  });
});
