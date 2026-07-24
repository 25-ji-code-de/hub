import Auth from './auth.js';
import API from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const app = document.getElementById('app');

    // Initial check
    if (Auth.isAuthenticated()) {
        try {
            const user = await Auth.getUserInfo();
            if (user) {
                await renderPrivateView(user);
            } else {
                renderPublicView();
            }
        } catch (e) {
            console.error('Auth check failed:', e);
            renderPublicView();
        }
    } else {
        renderPublicView();
    }

    function renderPublicView() {
        const publicTemplate = document.getElementById('template-public');
        if (!publicTemplate) return;
        
        app.innerHTML = '';
        const content = publicTemplate.content.cloneNode(true);
        app.appendChild(content);

        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                Auth.login();
            });
        }
    }

    function renderPrivateView(user) {
        const privateTemplate = document.getElementById('template-private');
        if (!privateTemplate) return;

        app.innerHTML = '';
        const content = privateTemplate.content.cloneNode(true);
        app.appendChild(content);

        // Update User Info — align with 25ji display name priority
        const usernameDisplay = document.getElementById('username-display');
        if (usernameDisplay) {
            const display =
                user.display_name ||
                user.name ||
                user.preferred_username ||
                user.username ||
                user.email ||
                'User';
            usernameDisplay.textContent = display;
        }

        // Load real data
        loadUserData();

        // Event Listeners
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                Auth.logout();
            });
        }

        const accountSettingsBtn = document.getElementById('account-settings-btn');
        if (accountSettingsBtn) {
            accountSettingsBtn.addEventListener('click', () => {
                window.location.href = 'https://id.nightcord.de5.net';
            });
        }
    }

    /**
     * 加载用户真实数据
     */
    async function loadUserData() {
        try {
            // 获取今日日期
            const today = new Date().toISOString().split('T')[0];

            // 并行加载统计数据、成就数据、活动数据和25ji同步数据
            const [statsData, achievementsData, activityData, syncData] = await Promise.all([
                API.getUserStats(null, today).catch((e) => {
                    console.warn('stats failed', e);
                    return { stats: {} };
                }),
                API.getUserAchievements().catch((e) => {
                    console.warn('achievements failed', e);
                    return { achievements: [] };
                }),
                API.getUserActivity(10, 0).catch((e) => {
                    console.warn('activity failed', e);
                    return { activities: [] };
                }),
                API.getUserSyncData('25ji').catch((e) => {
                    console.warn('sync failed', e);
                    return { data: null };
                }),
            ]);

            // 更新统计卡片
            updateStatsCards(statsData);

            // 更新25ji详细统计（使用 sync 数据获取完整信息）
            update25jiDetailedStats(statsData, syncData);

            // 更新成就列表
            updateAchievements(achievementsData);

            // 活动：优先 Gateway /user/activity，回退 25ji sync 内 recent_activities
            updateActivities(activityData, syncData);

        } catch (error) {
            console.error('Failed to load user data:', error);
            // 显示错误提示
            showDataError();
        }
    }

    /**
     * Read a metric that may be stored under several historical names.
     * @param {Record<string, unknown>} bag
     * @param {...string} keys
     */
    function metricNum(bag, ...keys) {
        if (!bag || typeof bag !== 'object') return 0;
        for (const k of keys) {
            if (bag[k] == null || bag[k] === '') continue;
            const n = Number(bag[k]);
            if (Number.isFinite(n)) return n;
        }
        return 0;
    }

    /**
     * Sum all metrics whose name matches a predicate (e.g. persona conversation counters).
     */
    function sumMetrics(bag, pred) {
        if (!bag || typeof bag !== 'object') return 0;
        let total = 0;
        for (const [k, v] of Object.entries(bag)) {
            if (!pred(k)) continue;
            const n = Number(v);
            if (Number.isFinite(n)) total += n;
        }
        return total;
    }

    /**
     * 更新统计卡片
     */
    function updateStatsCards(data) {
        const stats = data.stats || {};

        // Nightcord 统计
        const nightcordStats = stats.nightcord || {};
        const nightcordCard = document.querySelector('.stat-card:nth-child(1)');
        if (nightcordCard) {
            const messages = metricNum(nightcordStats, 'messages_sent');
            const onlineMinutes = metricNum(nightcordStats, 'online_minutes');
            const hours = Math.floor(onlineMinutes / 60);
            const mins = onlineMinutes % 60;

            nightcordCard.querySelector('.stat-value').textContent = `${messages} 条消息`;
            nightcordCard.querySelector('.stat-label').textContent =
                `在线 ${hours}h ${mins}min`;
        }

        // 25ji 统计
        // Gateway event path writes pomodoros_completed; some older docs used pomodoro_completed
        const ji25Stats = stats['25ji'] || {};
        const ji25Card = document.querySelector('.stat-card:nth-child(2)');
        if (ji25Card) {
            const studyMinutes = metricNum(ji25Stats, 'study_minutes');
            const pomodoros = metricNum(
                ji25Stats,
                'pomodoros_completed',
                'pomodoro_completed',
                'pomodoro_count',
            );
            const hours = Math.floor(studyMinutes / 60);
            const mins = studyMinutes % 60;

            ji25Card.querySelector('.stat-value').textContent = `${hours}h ${mins}min`;
            ji25Card.querySelector('.stat-label').textContent =
                `完成 ${pomodoros} 个番茄钟`;
        }

        // Nako 统计 — nako writes per-persona metrics like nako_conversations / asagi_conversations
        const nakoStats = stats.nako || {};
        const nakoCard = document.querySelector('.stat-card:nth-child(3)');
        if (nakoCard) {
            const conversations =
                sumMetrics(nakoStats, (k) => /_conversations?$/.test(k)) ||
                metricNum(nakoStats, 'nako_conversations', 'nako_conversation');
            nakoCard.querySelector('.stat-value').textContent = `${conversations} 轮对话`;
        }

        // 总体统计（暂时保持静态）
        // 未来可以根据真实数据计算
    }

    /**
     * 更新25ji详细统计
     */
    function update25jiDetailedStats(statsData, syncData) {
        const stats = statsData.stats || {};
        const ji25Stats = stats['25ji'] || {};

        // 从 sync 数据中获取完整的 userStats
        const syncUserStats = syncData?.data?.userStats || {};

        // 连续天数（优先使用 sync 数据）
        const streakDays = syncUserStats.streak_days || ji25Stats.streak_days || 0;
        const streakEl = document.getElementById('streak-days');
        if (streakEl) {
            streakEl.textContent = `${streakDays} 天`;
        }

        // 累计专注时长（从 sync 数据的 total_time 秒转换）
        const totalSeconds = syncUserStats.total_time || 0;
        const totalHours = Math.floor(totalSeconds / 3600);
        const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
        const totalTimeEl = document.getElementById('total-time');
        if (totalTimeEl) {
            if (totalHours > 0) {
                totalTimeEl.textContent = `${totalHours}h ${totalMinutes}min`;
            } else {
                totalTimeEl.textContent = `${totalMinutes}min`;
            }
        }

        // 番茄钟总数（优先使用 sync 数据）
        const totalPomodoros = syncUserStats.pomodoro_count || ji25Stats.pomodoros_completed || 0;
        const pomodorosEl = document.getElementById('total-pomodoros');
        if (pomodorosEl) {
            pomodorosEl.textContent = totalPomodoros;
        }

        // 播放歌曲数量（优先使用 sync 数据）
        const songsPlayed = syncUserStats.songs_played || ji25Stats.songs_played || 0;
        const songsEl = document.getElementById('songs-played');
        if (songsEl) {
            songsEl.textContent = songsPlayed;
        }
    }

    /**
     * Escape text for safe HTML interpolation.
     */
    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * 更新活动列表
     * @param {object} activityData - GET /user/activity response
     * @param {object} syncData - GET /user/sync response (fallback recent_activities)
     */
    function updateActivities(activityData, syncData) {
        let activities = [];
        if (Array.isArray(activityData?.activities) && activityData.activities.length) {
            activities = activityData.activities.map((a) => ({
                type: a.event_type,
                event_type: a.event_type,
                project: a.project,
                timestamp: a.created_at,
                created_at: a.created_at,
                detail: a.metadata?.detail,
            }));
        } else {
            activities = syncData?.data?.userStats?.recent_activities || [];
        }
        const activityList = document.querySelector('.activity-list');
        if (!activityList) return;

        if (activities.length === 0) {
            activityList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    暂无活动记录<br>
                    <small>开始使用 SEKAI 生态项目来记录活动吧！</small>
                </div>
            `;
            return;
        }

        // 事件类型映射
        const eventTypeMap = {
            'message_sent': '💬 发送消息',
            'pomodoro_completed': '🍅 完成番茄钟',
            'song_played': '🎵 播放歌曲',
            'nako_conversation': '🤖 Nako 对话',
            'online_time': '⏱️ 在线时长',
            'login': '🌅 登录',
            'pomodoro': '🍅 完成番茄钟',
            'song': '🎵 播放歌曲',
            'achievement': '🏆 解锁成就',
            'streak': '🔥 连续打卡'
        };

        // 项目名称映射
        const projectMap = {
            'nightcord': 'Nightcord',
            '25ji': '25時作業風景',
            'nako': 'Nako AI'
        };

        activityList.innerHTML = activities.map(activity => {
            const date = new Date(activity.timestamp || activity.created_at);
            const timeStr = Number.isFinite(date.getTime())
                ? date.toLocaleString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                })
                : '';

            const rawType = activity.type || activity.event_type || '';
            // Persona conversations: asagi_conversation → 🤖 asagi 对话
            let eventLabel = activity.detail || eventTypeMap[rawType];
            if (!eventLabel && /_conversation$/.test(rawType)) {
                const persona = rawType.replace(/_conversation$/, '');
                eventLabel = `🤖 ${persona} 对话`;
            }
            if (!eventLabel) eventLabel = rawType;
            const projectLabel = projectMap[activity.project] || activity.project || '25時作業風景';

            return `
                <div class="activity-item">
                    <div style="flex: 1;">
                        <div style="font-weight: 500;">${escapeHtml(eventLabel)}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">
                            ${escapeHtml(projectLabel)} · ${escapeHtml(timeStr)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * 更新成就列表
     */
    function updateAchievements(data) {
        const achievements = data.achievements || [];

        // 筛选已解锁的成就，按解锁时间倒序
        const unlockedAchievements = achievements
            .filter(a => a.unlocked)
            .sort((a, b) => b.unlocked_at - a.unlocked_at)
            .slice(0, 5); // 只显示最近 5 个

        const achievementList = document.querySelector('.achievement-list');
        if (!achievementList) return;

        if (unlockedAchievements.length === 0) {
            achievementList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    暂无解锁的成就<br>
                    <small>开始使用 SEKAI 生态项目来解锁成就吧！</small>
                </div>
            `;
            return;
        }

        achievementList.innerHTML = unlockedAchievements.map(achievement => {
            const date = new Date(achievement.unlocked_at).toLocaleDateString('zh-CN');
            return `
                <div class="achievement-item">
                    <div class="achievement-icon">${escapeHtml(achievement.icon)}</div>
                    <div>
                        <div style="font-weight: 600;">${escapeHtml(achievement.name)}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(date)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * 显示数据加载错误
     */
    function showDataError() {
        const statsCards = document.querySelectorAll('.stat-card');
        statsCards.forEach(card => {
            card.style.opacity = '0.5';
        });

        const achievementList = document.querySelector('.achievement-list');
        if (achievementList) {
            achievementList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    数据加载失败<br>
                    <small>请刷新页面重试</small>
                </div>
            `;
        }
    }
});
