const CONFIG = {
    clientId: 'sekai_hub_client',
    authEndpoint: 'https://id.nightcord.de5.net/oauth/authorize',
    tokenEndpoint: 'https://id.nightcord.de5.net/oauth/token',
    userInfoEndpoint: 'https://id.nightcord.de5.net/oauth/userinfo',
    redirectUri: `${window.location.origin}/callback`,
    scope: 'openid profile email',
    apiBaseUrl: 'https://api.nightcord.de5.net'
};

export default CONFIG;
