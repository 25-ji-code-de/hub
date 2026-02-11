// SEKAI Gateway API Client
import CONFIG from './config.js';

class API {
    /**
     * 获取用户统计数据
     * @param {string} project - 项目名称 (nightcord, 25ji, nako)
     * @param {string} date - 日期 (YYYY-MM-DD)
     */
    static async getUserStats(project = null, date = null) {
        const accessToken = localStorage.getItem('sekai_access_token');
        if (!accessToken) {
            throw new Error('No access token');
        }

        const params = new URLSearchParams();
        if (project) params.append('project', project);
        if (date) params.append('date', date);

        const url = `${CONFIG.apiBaseUrl}/user/stats${params.toString() ? '?' + params.toString() : ''}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * 获取用户成就列表
     */
    static async getUserAchievements() {
        const accessToken = localStorage.getItem('sekai_access_token');
        if (!accessToken) {
            throw new Error('No access token');
        }

        const response = await fetch(`${CONFIG.apiBaseUrl}/user/achievements`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * 获取用户活动时间线
     * @param {number} limit - 返回数量
     * @param {number} offset - 偏移量
     */
    static async getUserActivity(limit = 20, offset = 0) {
        const accessToken = localStorage.getItem('sekai_access_token');
        if (!accessToken) {
            throw new Error('No access token');
        }

        const params = new URLSearchParams({ limit, offset });
        const response = await fetch(`${CONFIG.apiBaseUrl}/user/activity?${params}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * 上报用户事件
     * @param {string} project - 项目名称
     * @param {string} eventType - 事件类型
     * @param {object} metadata - 元数据
     */
    static async reportEvent(project, eventType, metadata = {}) {
        const accessToken = localStorage.getItem('sekai_access_token');
        if (!accessToken) {
            throw new Error('No access token');
        }

        const response = await fetch(`${CONFIG.apiBaseUrl}/user/events`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ project, event_type: eventType, metadata })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    }
}

export default API;
