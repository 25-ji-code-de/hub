import CONFIG from './config.js';

class Auth {
    constructor() {
        this.accessTokenKey = 'sekai_access_token';
        this.codeVerifierKey = 'sekai_code_verifier';
        this.stateKey = 'sekai_auth_state';
    }

    // Helper: Generate random string
    generateRandomString(length) {
        const array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        return Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('');
    }

    // Helper: Base64URL encode
    base64UrlEncode(arrayBuffer) {
        let base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(arrayBuffer)));
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    // Helper: SHA-256 hash
    async sha256(plain) {
        const encoder = new TextEncoder();
        const data = encoder.encode(plain);
        return await window.crypto.subtle.digest('SHA-256', data);
    }

    // Generate PKCE Challenge
    async generateCodeChallenge(verifier) {
        const hashed = await this.sha256(verifier);
        return this.base64UrlEncode(hashed);
    }

    // Initiate Login
    async login() {
        const state = this.generateRandomString(16);
        const codeVerifier = this.generateRandomString(32);

        localStorage.setItem(this.stateKey, state);
        localStorage.setItem(this.codeVerifierKey, codeVerifier);

        const codeChallenge = await this.generateCodeChallenge(codeVerifier);

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: CONFIG.clientId,
            redirect_uri: CONFIG.redirectUri,
            scope: CONFIG.scope,
            state: state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        });

        window.location.href = `${CONFIG.authEndpoint}?${params.toString()}`;
    }

    // Handle Callback
    async handleCallback(code, state) {
        const storedState = localStorage.getItem(this.stateKey);
        const codeVerifier = localStorage.getItem(this.codeVerifierKey);

        if (state !== storedState) {
            throw new Error('Invalid state parameter');
        }

        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: CONFIG.clientId,
            code: code,
            redirect_uri: CONFIG.redirectUri,
            code_verifier: codeVerifier
        });

        const response = await fetch(CONFIG.tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token exchange failed: ${errorText}`);
        }

        const data = await response.json();
        localStorage.setItem(this.accessTokenKey, data.access_token);
        
        // Clean up
        localStorage.removeItem(this.stateKey);
        localStorage.removeItem(this.codeVerifierKey);
        
        return data;
    }

    // Get User Info
    async getUserInfo() {
        const token = localStorage.getItem(this.accessTokenKey);
        if (!token) return null;

        try {
            const response = await fetch(CONFIG.userInfoEndpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.logout(); // Token expired
                    return null;
                }
                throw new Error('Failed to fetch user info');
            }

            return await response.json();
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    isAuthenticated() {
        return !!localStorage.getItem(this.accessTokenKey);
    }

    logout() {
        localStorage.removeItem(this.accessTokenKey);
        localStorage.removeItem(this.stateKey);
        localStorage.removeItem(this.codeVerifierKey);
        window.location.href = '/';
    }
}

export default new Auth();
