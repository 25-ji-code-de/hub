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

/** vendored 的四个 token 文件，与上游 tokens/ 一一对应。 */
const LAYERS = ['primitives', 'contract', 'world-system', 'world-night'];
const layer = Object.fromEntries(
  LAYERS.map((name) => [name, read(`assets/css/sekai/${name}.css`)]),
);
const styles = read('assets/css/style.css');

/** 读一个 `--name: value;` 声明。 */
function tokenValue(css, name) {
  const m = new RegExp(`--${name}\\s*:\\s*([^;]+);`).exec(css);
  return m ? m[1].trim().replace(/\s*\/\*[\s\S]*$/, '').trim() : null;
}

/** 取某个选择器块里定义的全部 `--name: value`。 */
function blockTokens(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(?:^|\\n)[^\\n{}]*${escaped}[^\\n{}]*\\{([\\s\\S]*?)\\n\\}`).exec(css);
  const out = new Map();
  if (!m) return out;
  for (const d of m[1].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    out.set(d[1], d[2].trim().replace(/\s*\/\*[\s\S]*$/, '').trim());
  }
  return out;
}

const hexOf = (triplet) =>
  '#' +
  triplet
    .trim()
    .split(/\s+/)
    .map((n) => Number(n).toString(16).padStart(2, '0'))
    .join('');

describe('vendored 的 token 文件', () => {
  test('四个文件与上游 tokens/ 一一对应', () => {
    // 分开放而不是拼成一个文件：@sekai-vendor 的漂移检查是
    // "一个文件 ↔ 一个上游路径"，拼接之后没法逐字比对
    assert.match(layer.primitives, /Layer 0: Primitives/);
    assert.match(layer.contract, /Layer 1: The semantic contract/);
    assert.match(layer['world-system'], /World: SYSTEM/i);
    assert.match(layer['world-night'], /World: NIGHT/i);
  });

  for (const name of LAYERS) {
    test(`${name}.css 记了上游 commit 与来源文件`, () => {
      const header = layer[name].slice(0, 800);
      assert.ok(
        new RegExp(`tokens/${name}\\.css\\s*@\\s*[0-9a-f]{7,}`).test(header),
        '头部没写清楚对应哪个上游文件、哪个 commit',
      );
      assert.match(header, /提交树/, '没说明取自提交树而非工作区');
    });
  }

  test('两个 world 都是类作用域', () => {
    // world-night 排在后面加载。它要是写成裸 :root，本仓（world-system）
    // 会被整个盖掉，而且不会有任何报错，只是颜色全变了
    for (const name of ['world-system', 'world-night']) {
      const selectors = [...layer[name].matchAll(/\n([^\n{}]+)\{/g)].map((m) => m[1].trim());
      assert.ok(selectors.length > 0, `${name}.css 里找不到选择器`);
      for (const s of selectors) {
        if (s.startsWith('@')) continue; // @media 之类
        assert.match(s, /\.world-(system|night)/, `${name}.css 有非类作用域的选择器：${s}`);
      }
    }
  });

  test('contract 的 :root 兜底与 world-system 逐项一致', () => {
    // 分叉了的话，同一个页面加不加 class="world-system" 会渲染成两个样子
    const fallback = blockTokens(layer.contract, ':root');
    const system = blockTokens(layer['world-system'], ':root.world-system');

    assert.ok(fallback.has('sekai-accent'), 'contract 的 :root 没解析出调色板');
    assert.ok(system.has('sekai-accent'), 'world-system 没解析出 --sekai-accent');

    const shared = [...system.keys()].filter((k) => fallback.has(k));
    assert.ok(shared.length > 10, `两边只有 ${shared.length} 个同名 token，比对不成立`);

    const mismatched = shared
      .filter((k) => fallback.get(k) !== system.get(k))
      .map((k) => `--${k}: 兜底 ${fallback.get(k)} ≠ world-system ${system.get(k)}`);
    assert.deepEqual(mismatched, []);
  });

  /** contract 里必须齐全的调色板角色。 */
  const PALETTE = [
    'sekai-canvas', 'sekai-surface', 'sekai-surface-raised', 'sekai-surface-sunken',
    'sekai-line', 'sekai-fg', 'sekai-fg-muted', 'sekai-accent', 'sekai-accent-hover',
    'sekai-accent-deep', 'sekai-danger', 'sekai-success', 'sekai-warning', 'sekai-info',
  ];

  test('contract 的调色板齐全，且一律是三元组', () => {
    for (const t of PALETTE) {
      const v = tokenValue(layer.contract, t);
      assert.ok(v, `contract.css 缺少 --${t}`);
      assert.match(v, /^\d{1,3} \d{1,3} \d{1,3}$/, `--${t} 不是三元组：${v}`);
    }
  });

  test('world 覆盖的那些也是三元组，没有 hex 孪生', () => {
    /*
     * world 只覆盖**随世界变化**的角色。danger / success 这类信号色
     * 只在 contract 里定义，两个世界共用 —— contract 说得很直白：
     * "a system whose danger changes hue per theme is two systems"。
     * 所以这里只检查它确实覆盖了的那些。
     */
    for (const name of ['world-system', 'world-night']) {
      const defined = PALETTE.filter((t) => tokenValue(layer[name], t) !== null);
      assert.ok(defined.length > 5, `${name}.css 只覆盖了 ${defined.length} 个调色板角色`);
      for (const t of defined) {
        const v = tokenValue(layer[name], t);
        assert.match(v, /^\d{1,3} \d{1,3} \d{1,3}$/, `${name}.css 的 --${t} 不是三元组：${v}`);
      }
    }
  });

  test('信号色只在 contract 里定义，两个世界不各来一份', () => {
    for (const t of ['sekai-danger', 'sekai-success', 'sekai-warning', 'sekai-info', 'sekai-signal']) {
      assert.ok(tokenValue(layer.contract, t), `contract.css 缺少 --${t}`);
      for (const name of ['world-system', 'world-night']) {
        assert.equal(
          tokenValue(layer[name], t),
          null,
          `${name}.css 重新定义了 --${t} —— 信号色按设计是跨世界一致的`,
        );
      }
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

  for (const [alias, [hex, token]] of Object.entries(BEFORE)) {
    test(`${alias} 仍然是 ${hex}`, () => {
      const triplet = tokenValue(layer.contract, token);
      assert.ok(triplet, `token --${token} 不存在`);
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

describe('加载顺序', () => {
  /** 四层必须按 primitives → contract → world 的顺序，且都在业务样式之前。 */
  function assertOrder(html, businessCss) {
    const at = LAYERS.map((name) => {
      const i = html.indexOf(`sekai/${name}.css`);
      assert.ok(i >= 0, `没有引入 sekai/${name}.css`);
      return i;
    });
    for (let i = 1; i < at.length; i++) {
      assert.ok(at[i] > at[i - 1], `${LAYERS[i]}.css 必须排在 ${LAYERS[i - 1]}.css 之后`);
    }
    if (businessCss) {
      const b = html.indexOf(businessCss);
      assert.ok(b >= 0, `没有引入 ${businessCss}`);
      assert.ok(Math.max(...at) < b, `token 必须全部排在 ${businessCss} 之前`);
    }
  }

  test('index.html', () => {
    assertOrder(read('index.html'), 'assets/css/style.css');
  });

  test('callback/index.html 用同一套 token，不再自带一套配色', () => {
    const html = read('callback/index.html');
    assertOrder(html, null);
    // 登录跳转中间闪一下别的产品的配色，是这一页此前的样子
    const style = /<style>([\s\S]*?)<\/style>/.exec(html)?.[1] ?? '';
    assert.ok(style, '找不到内联样式块');
    const hexes = [...style.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((m) => m[0]);
    assert.deepEqual(hexes, [], `内联样式里还有硬编码颜色：${hexes.join(', ')}`);
    assert.match(style, /--sekai-canvas/);
    assert.match(style, /--sekai-danger/);
  });
});
