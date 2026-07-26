/*
 * Copyright 2026 The 25-ji-code-de Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 设计 token 的回归测试。
 *
 * 本仓的 `:root` 此前顶着「SEKAI Pass Theme Variables」的注释，
 * 内容是**从 sekai-pass 复制粘贴**的十个 hex。复制粘贴的问题不是难看，
 * 是没有任何机制会发现两边什么时候开始不一样了 —— 这批测试就是那个机制的
 * 本仓一半（另一半是等 sekai-design 上 GitHub 后的跨仓漂移检查）。
 *
 * 最要紧的一条：迁移不能悄悄改颜色。下面把迁移前的每个 hex 都钉死。
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const tokens = read('assets/css/sekai-tokens.css');
const styles = read('assets/css/style.css');

/** 读一个 `--name: value;` 声明（从 `from` 起的第一处）。 */
function tokenValue(css, name, from = 0) {
  const m = new RegExp(`--${name}\\s*:\\s*([^;]+);`).exec(css.slice(from));
  return m ? m[1].trim().replace(/\s*\/\*[\s\S]*$/, '').trim() : null;
}

const hexOf = (triplet) =>
  '#' +
  triplet
    .trim()
    .split(/\s+/)
    .map((n) => Number(n).toString(16).padStart(2, '0'))
    .join('');

describe('vendored 的 token 文件', () => {
  test('四层都在', () => {
    assert.match(tokens, /Layer 0: Primitives/);
    assert.match(tokens, /Layer 1: The semantic contract/);
    assert.match(tokens, /World: SYSTEM/i);
    assert.match(tokens, /World: NIGHT/i);
  });

  test('记了上游 commit，并说明取自提交树', () => {
    const header = tokens.slice(0, tokens.indexOf('Layer 0: Primitives'));
    assert.ok(/sekai-design[^\n]*@\s*[0-9a-f]{7,}/.test(header), '没记录上游 commit');
    assert.match(tokens, /提交树/);
  });

  test('两个 world 都是类作用域', () => {
    // world-night 排在后面。它要是写成裸 :root，本仓会被整个盖掉，且不报错
    for (const world of ['SYSTEM', 'NIGHT']) {
      const at = tokens.indexOf(`World: ${world}`);
      assert.ok(at > 0, `找不到 World: ${world}`);
      const selector = /\n([^\n{}]+)\{/.exec(tokens.slice(at))?.[1] ?? '';
      assert.match(selector, /\.world-(system|night)/, `不是类作用域：${selector.trim()}`);
    }
  });
});

describe('迁移没有改变任何颜色', () => {
  /** 迁移前 style.css 里写死的值。改这张表 = 改线上颜色。 */
  const BEFORE = {
    '--bg-color': ['#0b0b0e', 'sekai-canvas'],
    '--card-bg': ['#17171c', 'sekai-surface'],
    '--primary-color': ['#a48cd6', 'sekai-accent'],
    '--primary-hover': ['#bda6e8', 'sekai-accent-hover'],
    '--text-main': ['#e2e2e6', 'sekai-fg'],
    '--text-muted': ['#75757a', 'sekai-fg-muted'],
    '--border-color': ['#2a2a30', 'sekai-line'],
    // 这两个迁移前是 hex，而 sekai-pass 那边是三元组 —— 同一个颜色两种拼写，
    // 正是 sekai-pass CSS_REFACTOR_PLAN.md 记录的那条漂移，它一直活在本仓
    '--error-color': ['#e57373', 'sekai-danger'],
    '--success-color': ['#81c784', 'sekai-success'],
  };

  const contractAt = tokens.indexOf('Layer 1: The semantic contract');

  for (const [alias, [hex, token]] of Object.entries(BEFORE)) {
    test(`${alias} 仍然是 ${hex}`, () => {
      const triplet = tokenValue(tokens, token, contractAt);
      assert.ok(triplet, `token --${token} 不存在`);
      assert.match(triplet, /^\d{1,3} \d{1,3} \d{1,3}$/, `--${token} 不是三元组：${triplet}`);
      assert.equal(hexOf(triplet), hex);
    });
  }

  test(':root 里不再有任何裸 hex', () => {
    const block = /:root\s*\{([\s\S]*?)\n\}/.exec(styles)?.[1] ?? '';
    assert.ok(block, '找不到 :root 块');
    const literals = [...block.matchAll(/^\s*(--[\w-]+)\s*:\s*(#[0-9a-f]{3,8})/gim)];
    assert.deepEqual(
      literals.map((m) => `${m[1]}: ${m[2]}`),
      [],
      '这些别名还写着裸 hex，会与 token 漂移',
    );
  });

  test('每个别名都指向 token 或另一个别名', () => {
    const block = /:root\s*\{([\s\S]*?)\n\}/.exec(styles)?.[1] ?? '';
    const bad = [];
    for (const m of block.matchAll(/^\s*(--[\w-]+)\s*:\s*([^;]+);/gm)) {
      if (!/var\(--/.test(m[2])) bad.push(`${m[1]}: ${m[2].trim()}`);
    }
    assert.deepEqual(bad, [], '这些别名不是从别的变量派生的');
  });

  test('原来那条复制粘贴的注释已经没了', () => {
    // 只找原样的 `/* SEKAI Pass Theme Variables */`。
    // 讲述这段历史的说明文字里也会出现这几个词，那是有意保留的。
    assert.ok(
      !/\/\*\s*SEKAI Pass Theme Variables\s*\*\//.test(styles),
      '那条注释还在，说明这块没真的换成引用',
    );
  });
});

describe('token 表在业务样式之前加载', () => {
  test('index.html', () => {
    const html = read('index.html');
    const t = html.indexOf('assets/css/sekai-tokens.css');
    const s = html.indexOf('assets/css/style.css');
    assert.ok(t >= 0, '没有引入 sekai-tokens.css');
    assert.ok(s >= 0, '没有引入 style.css');
    assert.ok(t < s, 'sekai-tokens.css 必须在 style.css 之前');
  });

  test('callback/index.html 用同一套 token，不再自带一套配色', () => {
    const html = read('callback/index.html');
    assert.match(html, /assets\/css\/sekai-tokens\.css/, '没有引入 token 表');
    // 登录跳转中间闪一下别的产品的配色，是这一页此前的样子
    const style = /<style>([\s\S]*?)<\/style>/.exec(html)?.[1] ?? '';
    assert.ok(style, '找不到内联样式块');
    const hexes = [...style.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((m) => m[0]);
    assert.deepEqual(hexes, [], `内联样式里还有硬编码颜色：${hexes.join(', ')}`);
    assert.match(style, /--sekai-canvas/);
    assert.match(style, /--sekai-danger/);
  });
});
