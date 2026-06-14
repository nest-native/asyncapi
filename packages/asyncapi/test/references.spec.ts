import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildRef, escapeJsonPointerSegment } from '../references';

describe('escapeJsonPointerSegment', () => {
  it('leaves a plain segment untouched', () => {
    assert.equal(escapeJsonPointerSegment('orders'), 'orders');
  });

  it('escapes a forward slash as ~1', () => {
    assert.equal(
      escapeJsonPointerSegment('ms/create/feline'),
      'ms~1create~1feline',
    );
  });

  it('escapes a tilde as ~0', () => {
    assert.equal(escapeJsonPointerSegment('a~b'), 'a~0b');
  });

  it('escapes tildes before slashes so an encoded slash is not re-escaped', () => {
    // `~1` written literally must survive as `~01`, not collapse to `/`.
    assert.equal(escapeJsonPointerSegment('a~1b'), 'a~01b');
    assert.equal(escapeJsonPointerSegment('a/~b'), 'a~1~0b');
  });
});

describe('buildRef', () => {
  it('joins a base with no segments unchanged', () => {
    assert.equal(buildRef('#/channels'), '#/channels');
  });

  it('appends and escapes a single segment', () => {
    assert.equal(
      buildRef('#/channels', 'ms/create/feline'),
      '#/channels/ms~1create~1feline',
    );
  });

  it('appends and escapes several segments independently', () => {
    assert.equal(
      buildRef('#/channels', 'ms/journal', 'messages', 'Journal/Entry'),
      '#/channels/ms~1journal/messages/Journal~1Entry',
    );
  });

  it('does not escape the base fragment', () => {
    // The base already contains `/` separators that must stay structural.
    assert.equal(
      buildRef('#/components/messages', 'OrderPlaced'),
      '#/components/messages/OrderPlaced',
    );
  });
});
