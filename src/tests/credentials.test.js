/**
 * Focused checks that credentials are not embedded in the repository and
 * that NASA requests never send an empty bearer token.
 * Test output never prints matched secret values.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');

const SECRET_PATTERNS = [
    ['OpenAI key', /sk-(proj-)?[A-Za-z0-9_-]{20,}/],
    ['JWT', /eyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}/],
    ['private key', /BEGIN [A-Z ]*PRIVATE KEY/],
    ['env credential fallback literal', /process\.env\.[A-Z_]*(TOKEN|KEY|PASSWORD|USERNAME|SECRET)[A-Z_]*\s*\|\|\s*['"`]/]
];

function trackedFiles() {
    return execSync('git ls-files', { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
        .split('\n')
        .filter(file => file && !file.startsWith('node_modules/') && !file.endsWith('.pdf'))
        .filter(file => fs.existsSync(path.join(ROOT, file)));
}

function loadHandler(relativePath, fetchMock, env = {}) {
    const source = fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
        .replace('export default async function handler', 'module.exports = async function handler');
    const context = {
        module: {},
        process: { env },
        console: { log() {}, warn() {}, error() {} },
        fetch: fetchMock,
        axios: { get: (url, options) => fetchMock(url, options) },
        AbortController,
        URLSearchParams,
        setTimeout,
        clearTimeout,
        Date,
        Math
    };
    vm.createContext(context);
    vm.runInContext(source, context);
    return context.module.exports;
}

async function requestHeaders(route, { env = {}, authorization } = {}) {
    const seen = [];
    const fetchMock = async (url, options = {}) => {
        seen.push(options.headers || {});
        return { ok: false, status: 401, json: async () => ({}) };
    };
    const handler = loadHandler(route, fetchMock, env);
    const headers = authorization ? { authorization } : {};
    const res = { setHeader() {}, status() { return this; }, json(body) { this.body = body; return this; }, end() {} };
    await handler({ method: 'GET', query: { lat: '37.5', lon: '127.0' }, headers }, res);
    return { seen, body: res.body };
}

describe('embedded credentials', () => {
    test('tracked files contain no credential literals', () => {
        const findings = [];
        for (const file of trackedFiles()) {
            const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
            for (const [type, pattern] of SECRET_PATTERNS) {
                if (pattern.test(text)) findings.push(`${file}: ${type}`);
            }
        }
        expect(findings).toEqual([]);
    });

    test('.env and key.pem are not tracked', () => {
        const files = trackedFiles();
        expect(files).not.toContain('.env');
        expect(files).not.toContain('key.pem');
    });

    test('browser-served client code has no server NASA config', () => {
        for (const file of ['index.html', 'src/app.js', 'src/data/nasaRealTimeService.js', 'src/components/FarmGlobe3D.js']) {
            const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
            expect(text).not.toContain('NASA_CONFIG');
            expect(text).not.toContain('NASA_PASSWORD');
        }
    });

    test('src/app.js only stores credentials taken from user input', () => {
        const app = fs.readFileSync(path.join(ROOT, 'src', 'app.js'), 'utf8');
        const writes = [...app.matchAll(/localStorage\.setItem\('(openai_api_key|nasa_earthdata_token)',\s*([A-Za-z]+)\)/g)]
            .map(match => match[2]);
        expect(writes.length).toBeGreaterThan(0);
        writes.forEach(variable => expect(['nasaToken', 'openaiKey', 'token', 'apiKey']).toContain(variable));
        expect(app).not.toMatch(/demo token/i);
        expect(app).toContain('value="${hasNASAToken || \'\'}"');
    });

    test('NASARealTimeService has no token fallback', () => {
        const context = { localStorage: { getItem: () => null }, window: {}, setInterval() {}, Map, Date, Math, console };
        vm.createContext(context);
        vm.runInContext(fs.readFileSync(path.join(ROOT, 'src', 'data', 'nasaRealTimeService.js'), 'utf8'), context);
        const service = new context.window.NASARealTimeService();
        expect(service.nasaToken).toBeNull();
    });
});

describe('NASA route authorization headers', () => {
    const routes = ['api/smap/soil-moisture.js', 'api/modis/ndvi.js'];

    test.each(routes)('%s sends no Authorization header without credentials', async (route) => {
        const { seen, body } = await requestHeaders(route);
        expect(seen.length).toBeGreaterThan(0);
        seen.forEach(headers => {
            expect(headers).not.toHaveProperty('Authorization');
            expect(JSON.stringify(headers)).not.toContain('undefined');
        });
        expect(body.quality).toBe('simulated');
    });

    test('api/landsat/imagery.js sends no Authorization header without credentials', async () => {
        const { seen } = await requestHeaders('api/landsat/imagery.js');
        expect(seen.length).toBeGreaterThan(0);
        seen.forEach(headers => expect(JSON.stringify(headers)).not.toMatch(/Authorization|undefined/));
    });

    test.each(routes)('%s uses the server environment token', async (route) => {
        const { seen } = await requestHeaders(route, { env: { NASA_TOKEN: 'env-test-token' } });
        expect(seen[0].Authorization).toBe('Bearer env-test-token');
    });

    test.each(routes)('%s prefers the user token from the request', async (route) => {
        const { seen } = await requestHeaders(route, { env: { NASA_TOKEN: 'env-test-token' }, authorization: 'Bearer user-test-token' });
        expect(seen[0].Authorization).toBe('Bearer user-test-token');
    });
});
