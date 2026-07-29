import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';

const root = new URL('..', import.meta.url).pathname.replace(/^\/(.:)/, '$1');
const read = (path) => readFileSync(join(root, path), 'utf8');

describe('SEKAI Design page layout', () => {
  test('vendors the tagged page module', () => {
    assert.match(
      read('assets/css/sekai/page.css'),
      /^\/\* @sekai-vendor @sekai\/design@v0\.1\.0 css\/layout\/page\.css \*\//,
    );
  });

  test('page containers consume .sekai-page', () => {
    const html = read('index.html');
    assert.ok((html.match(/\bsekai-page\b/g) ?? []).length >= 5);
    assert.ok(html.indexOf('sekai/page.css') < html.indexOf('assets/css/style.css'));
  });

  test('local container only keeps the product padding override', () => {
    const block = /\.container\s*\{([^}]*)\}/.exec(read('assets/css/style.css'))?.[1] ?? '';
    assert.match(block, /padding:/);
    assert.doesNotMatch(block, /(?:width|max-width|margin)\s*:/);
  });
});
