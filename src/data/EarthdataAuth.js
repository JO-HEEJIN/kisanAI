/**
 * NASA Farm Navigators - Earthdata Authentication
 * OAuth 2.0 integration with NASA Earthdata Login
 */

class EarthdataAuth {
    constructor(options = {}) {
        this.clientId = options.clientId || 'nasa_farm_navigators';
        this.redirectUri = options.redirectUri || `${window.location.origin}/auth/callback`;
        this.baseUrl = 'https://urs.earthdata.nasa.gov';
        this.scope = 'read';

        this.token = null;
        this.refreshToken = null;
        this.expiresAt = null;
        this.userInfo = null;

        this.authCallbacks = [];

        // Load existing token from storage
        this.loadTokenFromStorage();

        // Set up auth state monitoring
        this.setupAuthStateMonitoring();
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if authenticated
     */
    isAuthenticated() {
        return this.token && this.expiresAt && Date.now() < this.expiresAt;
    }

    /**
     * Get current access token
     * @returns {string|null} Access token or null
     */
    getToken() {
        if (this.isAuthenticated()) {
            return this.token;
        }
        return null;
    }

    /**
     * Get user information
     * @returns {Object|null} User info or null
     */
    getUserInfo() {
        return this.userInfo;
    }

    /**
     * Initiate OAuth login flow
     * @returns {Promise<void>}
     */
    async login() {
        const state = this.generateState();
        const authUrl = this.buildAuthUrl(state);

        // Store state for validation
        sessionStorage.setItem('oauth_state', state);

        // Redirect to NASA Earthdata
        window.location.href = authUrl;
    }

    /**
     * Handle OAuth callback
     * @param {string} code - Authorization code
     * @param {string} state - State parameter
     * @returns {Promise<boolean>} Success status
     */
    async handleCallback(code, state) {
        // Validate state parameter
        const storedState = sessionStorage.getItem('oauth_state');
        if (state !== storedState) {
            throw new Error('Invalid OAuth state parameter');
        }

        try {
            // Exchange code for token
            const tokenData = await this.exchangeCodeForToken(code);

            // Store token information
            this.token = tokenData.access_token;
            this.refreshToken = tokenData.refresh_token;
            this.expiresAt = Date.now() + (tokenData.expires_in * 1000);

            // Get user information
            await this.fetchUserInfo();

            // Save to storage
            this.saveTokenToStorage();

            // Notify listeners
            this.notifyAuthStateChange(true);

            return true;
        } catch (error) {
            console.error('OAuth callback error:', error);
            this.clearTokens();
            this.notifyAuthStateChange(false);
            throw error;
        }
    }

    /**
     * Logout and clear tokens
     */
    logout() {
        this.clearTokens();
        this.clearStorage();
        this.notifyAuthStateChange(false);
    }

    /**
     * Refresh access token using refresh token
     * @returns {Promise<boolean>} Success status
     */
    async refreshAccessToken() {
        if (!this.refreshToken) {
            return false;
        }

        try {
            const response = await fetch(`${this.baseUrl}/oauth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: this.refreshToken,
                    client_id: this.clientId
                })
            });

            if (!response.ok) {
                throw new Error(`Token refresh failed: ${response.status}`);
            }

            const tokenData = await response.json();

            // Update token information
            this.token = tokenData.access_token;
            if (tokenData.refresh_token) {
                this.refreshToken = tokenData.refresh_token;
            }
            this.expiresAt = Date.now() + (tokenData.expires_in * 1000);

            // Save to storage
            this.saveTokenToStorage();

            // Notify listeners
            this.notifyAuthStateChange(true);

            return true;
        } catch (error) {
            console.error('Token refresh error:', error);
            this.clearTokens();
            this.notifyAuthStateChange(false);
            return false;
        }
    }

    /**
     * Get valid access token, refreshing if necessary
     * @returns {Promise<string|null>} Valid access token
     */
    async getValidToken() {
        // If token is valid, return it
        if (this.isAuthenticated()) {
            return this.token;
        }

        // If token is expired but we have refresh token, try to refresh
        if (this.refreshToken) {
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
                return this.token;
            }
        }

        // No valid token available
        return null;
    }

    /**
     * Make authenticated request to NASA API
     * @param {string} url - API endpoint URL
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>} Fetch response
     */
    async authenticatedRequest(url, options = {}) {
        const token = await this.getValidToken();

        if (!token) {
            throw new Error('No valid authentication token available');
        }

        const authOptions = {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            }
        };

        const response = await fetch(url, authOptions);

        // If unauthorized, try to refresh token once
        if (response.status === 401 && this.refreshToken) {
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
                // Retry request with new token
                authOptions.headers['Authorization'] = `Bearer ${this.token}`;
                return await fetch(url, authOptions);
            }
        }

        return response;
    }

    /**
     * Subscribe to authentication state changes
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    onAuthStateChange(callback) {
        this.authCallbacks.push(callback);

        // Return unsubscribe function
        return () => {
            const index = this.authCallbacks.indexOf(callback);
            if (index > -1) {
                this.authCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Build OAuth authorization URL
     * @param {string} state - State parameter
     * @returns {string} Authorization URL
     */
    buildAuthUrl(state) {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: this.scope,
            state: state
        });

        return `${this.baseUrl}/oauth/authorize?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     * @param {string} code - Authorization code
     * @returns {Promise<Object>} Token data
     */
    async exchangeCodeForToken(code) {
        const response = await fetch(`${this.baseUrl}/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: this.redirectUri,
                client_id: this.clientId
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
        }

        return await response.json();
    }

    /**
     * Fetch user information from Earthdata
     * @returns {Promise<void>}
     */
    async fetchUserInfo() {
        try {
            const response = await this.authenticatedRequest(`${this.baseUrl}/api/users/user`);

            if (response.ok) {
                this.userInfo = await response.json();
            }
        } catch (error) {
            console.warn('Failed to fetch user info:', error);
        }
    }

    /**
     * Generate random state parameter
     * @returns {string} Random state string
     */
    generateState() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    /**
     * Clear all token data
     */
    clearTokens() {
        this.token = null;
        this.refreshToken = null;
        this.expiresAt = null;
        this.userInfo = null;
    }

    /**
     * Save token data to localStorage
     */
    saveTokenToStorage() {
        try {
            const tokenData = {
                token: this.token,
                refreshToken: this.refreshToken,
                expiresAt: this.expiresAt,
                userInfo: this.userInfo
            };

            localStorage.setItem('nasa_earthdata_auth', JSON.stringify(tokenData));
        } catch (error) {
            console.warn('Failed to save auth data to storage:', error);
        }
    }

    /**
     * Load token data from localStorage
     */
    loadTokenFromStorage() {
        try {
            const data = localStorage.getItem('nasa_earthdata_auth');
            if (data) {
                const tokenData = JSON.parse(data);

                this.token = tokenData.token;
                this.refreshToken = tokenData.refreshToken;
                this.expiresAt = tokenData.expiresAt;
                this.userInfo = tokenData.userInfo;

                // Check if token is still valid
                if (!this.isAuthenticated() && this.refreshToken) {
                    // Try to refresh token in background
                    this.refreshAccessToken().catch(console.error);
                }
            }
        } catch (error) {
            console.warn('Failed to load auth data from storage:', error);
            this.clearTokens();
        }
    }

    /**
     * Clear stored authentication data
     */
    clearStorage() {
        localStorage.removeItem('nasa_earthdata_auth');
        sessionStorage.removeItem('oauth_state');
    }

    /**
     * Set up authentication state monitoring
     */
    setupAuthStateMonitoring() {
        // Check token expiration periodically
        setInterval(() => {
            if (this.token && this.expiresAt && Date.now() >= this.expiresAt) {
                this.refreshAccessToken().catch(() => {
                    this.logout();
                });
            }
        }, 60000); // Check every minute

        // Handle storage events (multi-tab sync)
        window.addEventListener('storage', (event) => {
            if (event.key === 'nasa_earthdata_auth') {
                if (event.newValue) {
                    this.loadTokenFromStorage();
                    this.notifyAuthStateChange(this.isAuthenticated());
                } else {
                    this.clearTokens();
                    this.notifyAuthStateChange(false);
                }
            }
        });
    }

    /**
     * Notify listeners of authentication state change
     * @param {boolean} isAuthenticated - Current auth state
     */
    notifyAuthStateChange(isAuthenticated) {
        this.authCallbacks.forEach(callback => {
            try {
                callback(isAuthenticated, this.userInfo);
            } catch (error) {
                console.error('Error in auth state callback:', error);
            }
        });
    }

    /**
     * Get authentication status for debugging
     * @returns {Object} Auth status info
     */
    getAuthStatus() {
        return {
            isAuthenticated: this.isAuthenticated(),
            hasToken: !!this.token,
            hasRefreshToken: !!this.refreshToken,
            expiresAt: this.expiresAt,
            expiresIn: this.expiresAt ? Math.max(0, this.expiresAt - Date.now()) : 0,
            userInfo: this.userInfo
        };
    }
}

export { EarthdataAuth };