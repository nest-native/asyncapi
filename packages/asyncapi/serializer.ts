import { AsyncApiDocument } from './document';

/**
 * Serialize an {@link AsyncApiDocument} to indented JSON.
 *
 * The document is plain JSON data, so this is a thin wrapper over
 * `JSON.stringify` with a stable two-space indent. It is the format the bundled
 * viewer consumes and the format served at the `*-json` docs route.
 */
export function toJson(document: AsyncApiDocument): string {
  return JSON.stringify(document, null, 2);
}

/**
 * Serialize an {@link AsyncApiDocument} to YAML.
 *
 * AsyncAPI tooling treats YAML as the canonical interchange format, so the docs
 * route exposes the document as YAML as well as JSON. The generated document is
 * plain JSON data — objects, arrays, strings, numbers, booleans, and `null`,
 * with no cycles or anchors — so a focused emitter covers it exactly without
 * pulling in a YAML runtime dependency (the package keeps `"dependencies": {}`).
 *
 * The emitter produces block-style YAML 1.2 that round-trips back to the same
 * value through any compliant parser, including `@asyncapi/parser`.
 */
export function toYaml(document: AsyncApiDocument): string {
  const lines = emitValue(document as unknown as YamlValue, 0);
  return `${lines.join('\n')}\n`;
}

/**
 * The JSON value space the document occupies. The document never contains
 * `undefined`, functions, or cyclic references, so this union is exhaustive.
 */
type YamlValue =
  | string
  | number
  | boolean
  | null
  | YamlValue[]
  | { [key: string]: YamlValue };

/**
 * Emit a value that appears as the right-hand side of a mapping key or an array
 * entry. Scalars are emitted inline on the parent line; non-empty containers are
 * emitted as indented blocks on the following lines.
 */
function emitValue(value: YamlValue, indent: number): string[] {
  if (Array.isArray(value)) {
    return value.length === 0 ? ['[]'] : emitArray(value, indent);
  }

  if (value !== null && typeof value === 'object') {
    const keys = Object.keys(value);
    return keys.length === 0 ? ['{}'] : emitMapping(value, keys, indent);
  }

  return [formatScalar(value)];
}

/**
 * Emit a non-empty mapping as a block of `key: value` lines. A scalar (or empty
 * container) value sits on the key's own line; a nested non-empty container is
 * pushed onto the following lines at a deeper indent.
 */
function emitMapping(
  value: { [key: string]: YamlValue },
  keys: string[],
  indent: number,
): string[] {
  const pad = '  '.repeat(indent);
  const lines: string[] = [];

  for (const key of keys) {
    const child = emitValue(value[key], indent + 1);
    const formattedKey = `${pad}${formatKey(key)}:`;

    if (isInline(value[key])) {
      lines.push(`${formattedKey} ${child[0]}`);
    } else {
      lines.push(formattedKey, ...child);
    }
  }

  return lines;
}

/**
 * Emit a non-empty array as a block of `- value` lines. A scalar (or empty
 * container) entry sits on the dash line; a nested non-empty container starts on
 * the dash line and continues indented beneath it.
 */
function emitArray(value: YamlValue[], indent: number): string[] {
  const pad = '  '.repeat(indent);
  const lines: string[] = [];

  for (const entry of value) {
    const child = emitValue(entry, indent + 1);

    if (isInline(entry)) {
      lines.push(`${pad}- ${child[0]}`);
    } else {
      lines.push(`${pad}- ${child[0].trimStart()}`, ...child.slice(1));
    }
  }

  return lines;
}

/**
 * A value renders inline (on its parent's `key:` or `-` line) only when it is a
 * scalar or an empty container (`[]` / `{}`). A non-empty container always
 * starts on its own following line(s), so its first emitted line is never
 * appended after the parent token.
 */
function isInline(value: YamlValue): boolean {
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (value !== null && typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  return true;
}

/**
 * Format a mapping key. Keys in an AsyncAPI document are component names,
 * channel ids, and spec keywords; quote any that are not plain enough to sit
 * unquoted so the output always parses back to the original string.
 */
function formatKey(key: string): string {
  return needsQuoting(key) ? quote(key) : key;
}

/**
 * Format a scalar leaf. Strings are quoted when ambiguous so they never parse
 * back as a number, boolean, null, or structural token; numbers, booleans, and
 * `null` use their canonical YAML spelling.
 */
function formatScalar(value: string | number | boolean | null): string {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'string') {
    return needsQuoting(value) ? quote(value) : value;
  }
  return String(value);
}

/**
 * A string needs quoting when it is empty, carries leading/trailing whitespace,
 * contains a character YAML treats structurally, or would otherwise be read back
 * as a non-string scalar (number, boolean, null, …).
 */
function needsQuoting(value: string): boolean {
  if (value === '' || value !== value.trim()) {
    return true;
  }
  if (/[:#,[\]{}&*!|>'"%@`?\n]/.test(value) || value.includes(': ')) {
    return true;
  }
  return looksLikeNonString(value);
}

/**
 * Whether an unquoted string would be re-read as a number, boolean, null, or a
 * YAML indicator, which would change its type on round-trip.
 */
function looksLikeNonString(value: string): boolean {
  const reserved = /^(?:null|~|true|false|yes|no|on|off)$/i;
  const numeric = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/;
  const indicator = /^[-?:]/;
  return reserved.test(value) || numeric.test(value) || indicator.test(value);
}

/**
 * Double-quote a string with the minimal escaping needed for a YAML double
 * quoted scalar: backslashes, double quotes, and newlines.
 */
function quote(value: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
  return `"${escaped}"`;
}
