// SEKAI Pass 认证 —— 实现已移至 @25-ji-code-de/sekai-auth。
//
// 这个文件此前与 25ji-sagyo/js/utils/auth.js 是近乎逐字相同的两份拷贝，
// nightcord 与 stickers-maker 又各有一份独立实现，四份行为已经开始漂移。
//
// 本文件现在只做三件事：
//   1. 把 hub 的 CONFIG 映射成 SDK 的构造参数
//   2. 锁住 hub 历史上的 storage key（否则升级会把所有人登出）
//   3. 保留原有的方法名，让 api.js / main.js / callback.html 无需改动
//
// vendor/sekai-auth.js 是从上游 tag 原样复制的，请勿手工编辑。

import CONFIG from './config.js';
import { SekaiAuth } from './vendor/sekai-auth.js';

const auth = new SekaiAuth({
    clientId: CONFIG.clientId,
    redirectUri: CONFIG.redirectUri,
    scope: CONFIG.scope,
    endpoints: {
        authorize: CONFIG.authEndpoint,
        token: CONFIG.tokenEndpoint,
        userinfo: CONFIG.userInfoEndpoint,
        // CONFIG 里没有 revoke；SDK 会从 token 端点推导出 /oauth/revoke，
        // 与迁移前 auth.js 的 tokenEndpoint.replace(/\/token$/, '/revoke') 一致
    },
    storagePrefix: 'sekai_',
    // hub 历史上用的是这两个非默认名，必须显式对齐
    keys: {
        expiresAt: 'sekai_token_expires_at',
        state: 'sekai_auth_state',
    },
});

/**
 * 保持迁移前的对外形状。方法名沿用旧的，避免改动三个调用点。
 */
const Auth = {
    /** @returns {Promise<void>} */
    login: () => auth.login(),

    /**
     * @param {string} code
     * @param {string} state
     * @returns {Promise<object>}
     */
    handleCallback: (code, state) => auth.handleCallback(code, state),

    /**
     * 取有效 access token，必要时自动刷新；失败返回 null。
     * 旧名是 getValidAccessToken，SDK 里叫 getAccessToken。
     * @returns {Promise<string|null>}
     */
    getValidAccessToken: () => auth.getAccessToken(),

    /** @returns {Promise<object|null>} 未登录或失败返回 null */
    getUserInfo: () => auth.getUserInfo(),

    /** @returns {boolean} */
    isAuthenticated: () => auth.isAuthenticated(),

    /** 登出后回首页，与迁移前行为一致。 */
    logout: () => auth.logout({ redirectTo: '/' }),

    /** 归一化 SEKAI Pass / OIDC 的字段差异。 */
    normalizeProfile: (userInfo) => auth.normalizeProfile(userInfo),

    /** 底层 SDK 实例，供需要新能力时直接使用。 */
    sdk: auth,
};

export default Auth;
