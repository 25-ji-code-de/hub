import Auth from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const app = document.getElementById('app');
    const LOADING_HTML = '<div class="loading">Loading...</div>';
    
    // Initial check
    if (Auth.isAuthenticated()) {
        try {
            const user = await Auth.getUserInfo();
            if (user) {
                renderPrivateView(user);
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
});
