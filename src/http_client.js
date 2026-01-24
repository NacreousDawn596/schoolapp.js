/**
 * HTTP Client with session and cookie management
 */
import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { DEFAULT_HEADERS } from './constants.js';

/**
 * Base HTTP client for making authenticated requests
 */
export class HTTPClient {
    /**
     * @param {string} baseUrl - Base URL for the API
     */
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.cookieJar = new CookieJar();

        // Create axios instance
        // We disable auto redirects to handle cookies manually between 302s
        this.client = axios.create({
            headers: { ...DEFAULT_HEADERS },
            maxRedirects: 0,
            validateStatus: (status) => status < 500 // Accept 3xx and 4xx
        });
    }

    /**
     * Internal request handler with manual redirect following
     */
    async _request(method, url, data = null, headers = {}) {
        let currentUrl = url;
        let redirectCount = 0;
        const maxRedirects = 5;
        let response = null;

        while (redirectCount < maxRedirects) {
            // Ensure absolute URL
            const absoluteUrl = currentUrl.startsWith('http')
                ? currentUrl
                : new URL(currentUrl, this.baseUrl).toString();

            // Get cookies for this URL
            const cookies = await this.cookieJar.getCookieString(absoluteUrl);

            const config = {
                method: method,
                url: absoluteUrl,
                headers: { ...headers },
                maxRedirects: 0,
                validateStatus: (status) => status < 500
            };

            if (cookies) {
                config.headers.Cookie = cookies;
            }

            if (data && method === 'POST') {
                config.data = data;
            }

            try {
                response = await this.client.request(config);

                // Store cookies from response
                const setCookieHeader = response.headers['set-cookie'];
                if (setCookieHeader) {
                    const cookieArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
                    for (const cookie of cookieArray) {
                        try {
                            // CookieJar needs the URL to determine domain/path scope
                            await this.cookieJar.setCookie(cookie, absoluteUrl);
                        } catch (e) {
                            console.warn('Cookie set error:', e.message);
                        }
                    }
                }

                // Handle Redirects (301, 302, 303, 307, 308)
                if (response.status >= 300 && response.status < 400 && response.headers.location) {
                    redirectCount++;
                    const location = response.headers.location;
                    // Resolve relative redirect
                    currentUrl = new URL(location, absoluteUrl).toString();

                    // Switch to GET for 301, 302, 303
                    if ([301, 302, 303].includes(response.status)) {
                        method = 'GET';
                        data = null;
                        if (headers['Content-Type']) delete headers['Content-Type'];
                    }
                    continue;
                }

                // If not redirecting, break loop and return response
                break;

            } catch (error) {
                console.error('Request Error:', error.message);
                throw error;
            }
        }

        return response;
    }

    /**
     * Perform GET request
     * @param {string} url - URL to request
     * @param {Object} params - Query parameters
     * @returns {Promise<{code: number, url: string, content: string}>}
     */
    async get(url, params = null) {
        try {
            // Append params to URL if provided
            let finalUrl = url;
            if (params) {
                const urlObj = new URL(url.startsWith('http') ? url : new URL(url, this.baseUrl).toString());
                Object.keys(params).forEach(key => {
                    if (params[key] !== null && params[key] !== undefined) {
                        urlObj.searchParams.append(key, params[key]);
                    }
                });
                finalUrl = urlObj.toString();
            }

            const response = await this._request('GET', finalUrl);

            return {
                code: response ? response.status : 500,
                url: response ? (response.request.responseURL || response.config.url) : null,
                content: response ? response.data : null
            };
        } catch (error) {
            console.error('GET Error:', error.message);
            return { code: null, url: null, content: null };
        }
    }

    /**
     * Perform POST request
     * @param {string} url - URL to request
     * @param {Object} data - Form data to send
     * @param {string} referer - Referer header value
     * @returns {Promise<{code: number, url: string, content: string}>}
     */
    async post(url, data, referer = null) {
        try {
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': this.baseUrl
            };

            if (referer) {
                headers['Referer'] = referer;
            }

            // Convert data object to URL-encoded string
            const formData = new URLSearchParams(data).toString();

            const response = await this._request('POST', url, formData, headers);

            return {
                code: response ? response.status : 500,
                url: response ? (response.request.responseURL || response.config.url) : null,
                content: response ? response.data : null
            };
        } catch (error) {
            console.error('POST Error:', error.message);
            return { code: null, url: null, content: null };
        }
    }
}
