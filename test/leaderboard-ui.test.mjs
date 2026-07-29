import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

describe('leaderboard center contract', () => {
  const html = read('index.html');
  const api = read('assets/js/api.js');
  const main = read('assets/js/main.js');

  test('offers the four registered 25ji boards', () => {
    for (const board of [
      '25ji-focus-weekly',
      '25ji-focus-monthly',
      '25ji-pomodoros-weekly',
      '25ji-focus-all-time',
    ]) {
      assert.match(html, new RegExp(`data-board-id="${board}"`));
    }
  });

  test('uses the authenticated gateway API and never requests arbitrary metrics', () => {
    assert.match(api, /\/user\/leaderboards\/\$\{encodeURIComponent\(boardId\)\}/);
    assert.match(api, /\/user\/leaderboard-profile/);
    assert.doesNotMatch(api, /metric_name=/);
  });

  test('renders anonymous entries without a user identifier', () => {
    assert.match(main, /entry\.is_public[^]*匿名用户/);
    assert.doesNotMatch(main, /entry\.user_id/);
  });
});
