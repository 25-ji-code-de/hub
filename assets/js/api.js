// SEKAI Gateway API Client
import CONFIG from './config.js';
import Auth from './auth.js';

class API {
    /**
     * Shared authenticated JSON request helper.
     * @param {string} path - Absolute path under apiBaseUrl (e.g. '/user/profile')
     * @param {RequestInit} [init]
     */
    static async request(path, init = {}) {
        const accessToken = await Auth.getValidAccessToken();
        if (!accessToken) {
            throw new Error('No access token');
        }

        const headers = new Headers(init.headers || {});
        headers.set('Authorization', `Bearer ${accessToken}`);
        if (init.body && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }

        const response = await fetch(`${CONFIG.apiBaseUrl}${path}`, {
            ...init,
            headers,
        });

        if (!response.ok) {
            let detail = `API error: ${response.status}`;
            try {
                const err = await response.json();
                if (err?.message) detail = err.message;
            } catch (_) {
                /* ignore */
            }
            const error = new Error(detail);
            error.status = response.status;
            throw error;
        }

        // Some endpoints may return empty body
        const text = await response.text();
        if (!text) return null;
        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    }

    /**
     * 获取用户扩展资料（bio）
     * 基本资料（display_name, avatar_url）请使用 Auth.getUserInfo()
     */
    static async getUserProfile() {
        return this.request('/user/profile');
    }

    /**
     * 更新用户扩展资料（bio）
     * 基本资料（display_name, avatar_url）请在 SEKAI Pass 修改
     * @param {string} bio - 个人简介
     */
    static async updateUserProfile(bio) {
        return this.request('/user/profile', {
            method: 'PUT',
            body: JSON.stringify({ bio }),
        });
    }

    /**
     * 获取用户统计数据
     * @param {string} project - 项目名称 (nightcord, 25ji, nako)
     * @param {string} date - 日期 (YYYY-MM-DD)
     */
    static async getUserStats(project = null, date = null) {
        const params = new URLSearchParams();
        if (project) params.append('project', project);
        if (date) params.append('date', date);
        const qs = params.toString();
        return this.request(`/user/stats${qs ? '?' + qs : ''}`);
    }

    /**
     * 获取用户成就列表
     */
    static async getUserAchievements() {
        return this.request('/user/achievements');
    }

    /**
     * 获取用户活动时间线
     * @param {number} limit - 返回数量
     * @param {number} offset - 偏移量
     */
    static async getUserActivity(limit = 20, offset = 0) {
        const params = new URLSearchParams({
            limit: String(limit),
            offset: String(offset),
        });
        return this.request(`/user/activity?${params}`);
    }

    static async getLeaderboard(boardId, limit = 20, offset = 0) {
        const params = new URLSearchParams({
            limit: String(limit),
            offset: String(offset),
        });
        return this.request(`/user/leaderboards/${encodeURIComponent(boardId)}?${params}`);
    }

    static async getLeaderboardProfile() {
        return this.request('/user/leaderboard-profile');
    }

    static async updateLeaderboardProfile(showProfile, displayName) {
        const body = { show_profile: Boolean(showProfile) };
        const normalizedName = String(displayName || '').trim();
        if (normalizedName) body.display_name = normalizedName;
        return this.request('/user/leaderboard-profile', {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    /**
     * 获取用户同步数据
     * @param {string} project - 项目名称
     */
    static async getUserSyncData(project) {
        const params = new URLSearchParams({ project: String(project) });
        return this.request(`/user/sync?${params}`);
    }

    /**
     * 上报用户事件
     * @param {string} project - 项目名称
     * @param {string} eventType - 事件类型
     * @param {object} metadata - 元数据
     */
    static async reportEvent(project, eventType, metadata = {}) {
        return this.request('/user/events', {
            method: 'POST',
            body: JSON.stringify({ project, event_type: eventType, metadata }),
        });
    }
}

export default API;
