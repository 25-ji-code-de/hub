import Auth from './auth.js';
import API from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const app = document.getElementById('app');
    const LOADING_HTML = '<div class="loading">Loading...</div>';

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

        // Update User Info
        const usernameDisplay = document.getElementById('username-display');
        if (usernameDisplay) {
            usernameDisplay.textContent = user.preferred_username || user.name || user.email || 'User';
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
                API.getUserStats(null, today),
                API.getUserAchievements(),
                API.getUserActivity(10, 0),
                API.getUserSyncData('25ji')
            ]);

            // 更新统计卡片
            updateStatsCards(statsData);

            // 更新25ji详细统计（使用 sync 数据获取完整信息）
            update25jiDetailedStats(statsData, syncData);

            // 更新成就列表
            updateAchievements(achievementsData);

            // 更新活动列表
            updateActivities(activityData);

        } catch (error) {
            console.error('Failed to load user data:', error);
            // 显示错误提示
            showDataError();
        }
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
            const messages = nightcordStats.messages_sent || 0;
            const onlineMinutes = nightcordStats.online_minutes || 0;
            const hours = Math.floor(onlineMinutes / 60);
            const mins = onlineMinutes % 60;

            nightcordCard.querySelector('.stat-value').textContent = `${messages} 条消息`;
            nightcordCard.querySelector('.stat-label').textContent =
                `在线 ${hours}h ${mins}min`;
        }

        // 25ji 统计
        const ji25Stats = stats['25ji'] || {};
        const ji25Card = document.querySelector('.stat-card:nth-child(2)');
        if (ji25Card) {
            const studyMinutes = ji25Stats.study_minutes || 0;
            const pomodoros = ji25Stats.pomodoro_completed || 0;
            const hours = Math.floor(studyMinutes / 60);
            const mins = studyMinutes % 60;

            ji25Card.querySelector('.stat-value').textContent = `${hours}h ${mins}min`;
            ji25Card.querySelector('.stat-label').textContent =
                `完成 ${pomodoros} 个番茄钟`;
        }

        // Nako 统计
        const nakoStats = stats.nako || {};
        const nakoCard = document.querySelector('.stat-card:nth-child(3)');
        if (nakoCard) {
            const conversations = nakoStats.nako_conversation || 0;
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
     * 更新活动列表
     */
    function updateActivities(data) {
        const activities = data.activities || [];
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
            'online_time': '⏱️ 在线时长'
        };

        // 项目名称映射
        const projectMap = {
            'nightcord': 'Nightcord',
            '25ji': '25時作業風景',
            'nako': 'Nako AI'
        };

        activityList.innerHTML = activities.map(activity => {
            const date = new Date(activity.created_at);
            const timeStr = date.toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            const eventLabel = eventTypeMap[activity.event_type] || activity.event_type;
            const projectLabel = projectMap[activity.project] || activity.project;

            return `
                <div class="activity-item">
                    <div style="flex: 1;">
                        <div style="font-weight: 500;">${eventLabel}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">
                            ${projectLabel} · ${timeStr}
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
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div>
                        <div style="font-weight: 600;">${achievement.name}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">${date}</div>
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
