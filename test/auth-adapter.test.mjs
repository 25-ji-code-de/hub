/*
 * hub 认证适配层的契约测试。
 *
 * 重点不是测 SDK（上游有 42 个测试），而是钉住迁移不能破坏的两件事：
 *   1. storage key 与迁移前**逐字一致** —— 变了就会把所有已登录用户登出
 *   2. api.js / main.js / callback.html 调用的方法名与语义不变
 *
 * hub 是纯浏览器 ESM、没有构建步骤，所以这里手工搭一个最小的
 * window / localStorage / fetch 环境再动态 import。
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

class MemoryStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(k) {
    return this.map.has(k) ? this.map.get(k) : null;
  }
  setItem(k, v) {
    this.map.set(k, String(v));
  }
  removeItem(k) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
}

const local = new MemoryStorage();
const session = new MemoryStorage();
let redirectedTo = '';

globalThis.localStorage = local;
globalThis.sessionStorage = session;
globalThis.location = {
  origin: 'https://hub.nightcord.de5.net',
  search: '',
  get href() {
    return redirectedTo;
  },
  set href(v) {
    redirectedTo = v;
  },
};
globalThis.window = globalThis;

const { default: Auth } = await import('../assets/js/auth.js');
const { default: CONFIG } = await import('../assets/js/config.js');

function stubFetch(queue) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    const next = queue.shift();
    if (!next) throw new Error(`unexpected fetch: ${url}`);
    return {
      ok: next.status === undefined || (next.status >= 200 && next.status < 300),
      status: next.status ?? 200,
      json: async () => next.body,
      text: async () => JSON.stringify(next.body),
    };
  };
  return calls;
}

beforeEach(() => {
  local.clear();
  session.clear();
  redirectedTo = '';
});

describe('storage key 与迁移前逐字一致', () => {
  // 这五个名字是从迁移前的 hub/assets/js/auth.js 抄下来的。
  // 任何一个变了，线上已登录的用户都会被登出。
  test('token 相关的三个 key', () => {
    assert.equal(Auth.sdk.keys.accessToken, 'sekai_access_token');
    assert.equal(Auth.sdk.keys.refreshToken, 'sekai_refresh_token');
    assert.equal(Auth.sdk.keys.expiresAt, 'sekai_token_expires_at');
  });

  test('PKCE 的两个 session key', () => {
    assert.equal(Auth.sdk.keys.codeVerifier, 'sekai_code_verifier');
    assert.equal(Auth.sdk.keys.state, 'sekai_auth_state');
  });

  test('真的能读到迁移前写下的 token', async () => {
    // 模拟一个升级前就已登录的浏览器
    local.setItem('sekai_access_token', 'OLD_TOKEN');
    local.setItem('sekai_refresh_token', 'OLD_REFRESH');
    local.setItem('sekai_token_expires_at', String(Date.now() + 60 * 60 * 1000));

    assert.equal(Auth.isAuthenticated(), true, '升级后不得把已登录用户视为未登录');
    assert.equal(await Auth.getValidAccessToken(), 'OLD_TOKEN');
  });
});

describe('CONFIG 映射', () => {
  test('端点来自 config.js', async () => {
    const endpoints = await Auth.sdk.getEndpoints();
    assert.equal(endpoints.authorize, CONFIG.authEndpoint);
    assert.equal(endpoints.token, CONFIG.tokenEndpoint);
    assert.equal(endpoints.userinfo, CONFIG.userInfoEndpoint);
  });

  test('clientId / redirectUri / scope 来自 config.js', () => {
    assert.equal(Auth.sdk.clientId, 'sekai_hub_client');
    assert.equal(Auth.sdk.redirectUri, 'https://hub.nightcord.de5.net/callback');
    assert.equal(Auth.sdk.scope, 'openid profile email');
  });
});

describe('调用点依赖的方法', () => {
  test('api.js 用的 getValidAccessToken 在且未登录时返回 null', async () => {
    assert.equal(typeof Auth.getValidAccessToken, 'function');
    assert.equal(await Auth.getValidAccessToken(), null);
  });

  test('main.js 用的 isAuthenticated / getUserInfo / login / logout 都在', () => {
    for (const name of ['isAuthenticated', 'getUserInfo', 'login', 'logout']) {
      assert.equal(typeof Auth[name], 'function', name);
    }
  });

  test('callback.html 用的 handleCallback 接受 (code, state)', async () => {
    session.setItem('sekai_auth_state', 'S1');
    session.setItem('sekai_code_verifier', 'V1');
    const calls = stubFetch([
      { body: { access_token: 'AT', refresh_token: 'RT', expires_in: 3600 } },
    ]);

    await Auth.handleCallback('CODE', 'S1');

    assert.equal(local.getItem('sekai_access_token'), 'AT');
    assert.equal(local.getItem('sekai_refresh_token'), 'RT');
    assert.ok(Number(local.getItem('sekai_token_expires_at')) > Date.now());
    assert.equal(calls[0].url, CONFIG.tokenEndpoint);
    assert.equal(calls[0].init.body.get('code_verifier'), 'V1');
  });

  test('handleCallback 在 state 不匹配时抛异常（callback.html 会 catch 并展示）', async () => {
    session.setItem('sekai_auth_state', 'S1');
    session.setItem('sekai_code_verifier', 'V1');
    stubFetch([]);
    await assert.rejects(() => Auth.handleCallback('CODE', 'WRONG'), /state/i);
  });

  test('getUserInfo 未登录时返回 null 而不抛（迁移前也是这个语义）', async () => {
    stubFetch([]);
    assert.equal(await Auth.getUserInfo(), null);
  });
});

describe('login 跳转', () => {
  test('构造 S256 授权 URL 并写入 PKCE 状态', async () => {
    await Auth.login();

    const url = new URL(redirectedTo);
    assert.equal(url.origin + url.pathname, CONFIG.authEndpoint);
    assert.equal(url.searchParams.get('client_id'), 'sekai_hub_client');
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
    assert.equal(url.searchParams.get('redirect_uri'), 'https://hub.nightcord.de5.net/callback');
    // PKCE 机密必须落在 sessionStorage 而不是 localStorage
    assert.ok(session.getItem('sekai_code_verifier'));
    assert.equal(local.getItem('sekai_code_verifier'), null);
    assert.equal(url.searchParams.get('state'), session.getItem('sekai_auth_state'));
  });
});

describe('logout', () => {
  test('清空 token 并跳回首页（与迁移前一致）', async () => {
    local.setItem('sekai_access_token', 'AT');
    local.setItem('sekai_refresh_token', 'RT');
    stubFetch([{ body: {} }, { body: {} }]);

    await Auth.logout();

    assert.equal(local.getItem('sekai_access_token'), null);
    assert.equal(local.getItem('sekai_refresh_token'), null);
    assert.equal(redirectedTo, '/');
  });

  test('revoke 打到从 token 端点推导出的 /oauth/revoke', async () => {
    local.setItem('sekai_access_token', 'AT');
    const calls = stubFetch([{ body: {} }]);

    await Auth.logout();

    assert.equal(calls[0].url, 'https://id.nightcord.de5.net/oauth/revoke');
  });
});
