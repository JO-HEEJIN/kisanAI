/**
 * Focused regression checks for src/plant-recognition.js.
 * Loads the browser script into a vm context with a minimal fake DOM,
 * mocked geolocation, and mocked fetch.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..');
const SCRIPT = fs.readFileSync(path.join(ROOT, 'src', 'plant-recognition.js'), 'utf8');

function createElement(id = null) {
    const listeners = {};
    return {
        id,
        style: {},
        classList: { add() {}, remove() {} },
        innerHTML: '',
        textContent: '',
        value: '',
        listeners,
        children: [],
        addEventListener(type, fn) {
            (listeners[type] = listeners[type] || []).push(fn);
        },
        appendChild(child) {
            this.children.push(child);
        },
        insertAdjacentHTML() {},
        remove() {},
        async click() {
            await Promise.all((listeners.click || []).map(fn => fn({})));
        }
    };
}

function createHarness({ modelLoads = true } = {}) {
    const elements = {};
    const documentListeners = {};
    const register = (html) => {
        for (const match of html.matchAll(/id="([^"]+)"/g)) {
            elements[match[1]] = createElement(match[1]);
        }
    };

    // Static markup from index.html that exists before the script runs.
    elements['test-plant-id-btn'] = createElement('test-plant-id-btn');

    const calls = { geolocation: 0, fetch: [] };

    const document = {
        body: { ...createElement(), insertAdjacentHTML: (_, html) => register(html) },
        head: createElement(),
        getElementById: (id) => elements[id] || null,
        createElement: () => createElement(),
        addEventListener(type, fn) {
            (documentListeners[type] = documentListeners[type] || []).push(fn);
        }
    };

    const context = {
        console: { log() {}, warn() {}, error() {} },
        document,
        navigator: {
            geolocation: {
                getCurrentPosition(success) {
                    calls.geolocation += 1;
                    success({ coords: { latitude: 37.5, longitude: 127.0 } });
                }
            }
        },
        fetch: async (url) => {
            calls.fetch.push(url);
            return { json: async () => ({ surface_moisture: 0.3, ndvi: 0.6, temperature: 20, quality: 'simulated' }) };
        },
        alert() {},
        setTimeout: () => 0,
        clearTimeout() {},
        Promise,
        Date
    };
    context.window = context;

    if (modelLoads) {
        context.tf = { version: { tfjs: 'test' } };
        context.mobilenet = { load: async () => ({ classify: async () => [] }) };
    }

    vm.createContext(context);
    vm.runInContext(SCRIPT, context);

    return {
        context,
        elements,
        calls,
        async start() {
            documentListeners.DOMContentLoaded.forEach(fn => fn());
            for (let i = 0; i < 20; i++) {
                await new Promise(resolve => setImmediate(resolve));
            }
            return context.window.plantRecognition;
        }
    };
}

function countCalls(calls, endpoint) {
    return calls.fetch.filter(url => url.startsWith(endpoint)).length;
}

describe('plant recognition Test Recognition button', () => {
    test('index.html does not attach its own listener to the button', () => {
        const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
        expect(html.match(/test-plant-id-btn/g)).toHaveLength(1);
        expect(html).not.toContain('testPlantIdentification');
    });

    test.each([
        ['model loaded', true],
        ['model failed to load', false]
    ])('one click loads location and NASA data exactly once (%s)', async (_, modelLoads) => {
        const harness = createHarness({ modelLoads });
        const recognition = await harness.start();
        const locationSpy = jest.spyOn(recognition, 'getCurrentLocation');

        await harness.elements['test-plant-id-btn'].click();

        expect(harness.elements['test-plant-id-btn'].listeners.click).toHaveLength(1);
        expect(locationSpy).toHaveBeenCalledTimes(1);
        expect(harness.calls.geolocation).toBe(1);
        expect(countCalls(harness.calls, '/api/smap/soil-moisture')).toBe(1);
        expect(countCalls(harness.calls, '/api/modis/ndvi')).toBe(1);
        expect(harness.elements['plant-recognition-modal'].style.display).toBe('flex');
    });
});

describe('plant recognition NASA data quality display', () => {
    test('shows the quality label returned by the API', async () => {
        const harness = createHarness();
        const recognition = await harness.start();
        await harness.elements['test-plant-id-btn'].click();

        recognition.displayPlantResult({ plantType: 'corn', confidence: 0.8, isManual: false, rawClassName: 'ear' });

        const [result] = harness.elements['plant-results'].children;
        expect(recognition.nasaData.quality).toBe('simulated');
        expect(result.innerHTML).toContain('(simulated)');
        expect(result.innerHTML).not.toContain('(real)');
    });
});
