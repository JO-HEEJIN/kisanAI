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
        getContext: () => ({ drawImage() {} }),
        toDataURL: () => 'data:image/jpeg;base64,QUJD',
        async click() {
            await Promise.all((listeners.click || []).map(fn => fn({})));
        }
    };
}

function createHarness({ modelLoads = true, vision = null } = {}) {
    const elements = {};
    const documentListeners = {};
    const register = (html) => {
        for (const match of html.matchAll(/id="([^"]+)"/g)) {
            elements[match[1]] = createElement(match[1]);
        }
    };

    // Static markup from index.html that exists before the script runs.
    elements['test-plant-id-btn'] = createElement('test-plant-id-btn');

    const calls = { geolocation: 0, fetch: [], visionBodies: [] };

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
        fetch: async (url, options = {}) => {
            calls.fetch.push(url);
            if (url.includes('/api/vision/identify')) {
                calls.visionBodies.push(JSON.parse(options.body));
                return vision ? { ok: true, json: async () => vision } : { ok: false, status: 502, json: async () => ({}) };
            }
            return { json: async () => ({ surface_moisture: 0.3, ndvi: 0.6, temperature: 20, quality: 'simulated' }) };
        },
        alert() {},
        location: { hostname: 'localhost' },
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

describe('plant recognition identification honesty', () => {
    async function render(prediction) {
        const harness = createHarness();
        const recognition = await harness.start();
        await harness.elements['test-plant-id-btn'].click();
        recognition.displayPlantResult(prediction);
        return harness.elements['plant-results'].children[0].innerHTML;
    }

    test('plantMapping has no corn_cob key but keeps the ear synonym', async () => {
        const recognition = await createHarness().start();
        expect(recognition.plantMapping).not.toHaveProperty('corn_cob');
        expect(recognition.plantMapping.ear).toBe('corn');
    });

    test('runModelPrediction still maps direct corn and ear classes to corn', async () => {
        const harness = createHarness();
        const recognition = await harness.start();
        for (const className of ['corn', 'ear, spike, capitulum']) {
            recognition.model = { classify: async () => [{ className, probability: 0.7 }] };
            const prediction = await recognition.runModelPrediction({});
            expect(prediction).toEqual({ plantType: 'corn', confidence: 0.7, isManual: false, rawClassName: className });
        }
    });

    test('recognized crop shows the crop and AI confidence', async () => {
        const html = await render({ plantType: 'corn', confidence: 0.72, isManual: false, rawClassName: 'corn' });
        expect(html).toContain('Zea mays');
        expect(html).toContain('72% Offline AI');
        expect(html).not.toContain('Could not confidently identify a specific crop');
    });

    test('automatic generic fallback states uncertainty without a health score', async () => {
        const html = await render({ plantType: 'generic_plant', confidence: 0.41, isManual: false, rawClassName: 'pot, flowerpot' });
        expect(html).toContain('Could not confidently identify a specific crop');
        expect(html).toContain('Unidentified');
        expect(html).toContain('pot, flowerpot (41% ImageNet class confidence)');
        expect(html).toContain('Plant Health: UNKNOWN');
        expect(html).not.toContain('41% AI');
        expect(html).not.toContain('Unknown Plant');
        expect(html).not.toMatch(/health-indicator unknown">\s*\d+%/);
    });

    test('automatic generic fallback on a non-plant still reports non-plant', async () => {
        const html = await render({ plantType: 'generic_plant', confidence: 0.9, isManual: false, rawClassName: 'laptop, laptop computer' });
        expect(html).toContain('This is not a plant!');
        expect(html).toContain('Plant Health: NON-PLANT');
    });

    test('manual selection keeps the selected crop and health analysis', async () => {
        const html = await render({ plantType: 'wheat', confidence: 0.95, isManual: true });
        expect(html).toContain('Triticum aestivum');
        expect(html).toContain('95% Manual');
        expect(html).not.toContain('Could not confidently identify a specific crop');
        expect(html).toMatch(/health-indicator (excellent|good|poor)">\s*\d+%/);
    });
});

describe('plant recognition with the Gemini vision server', () => {
    const video = { videoWidth: 1280, videoHeight: 720 };
    const result = (overrides) => ({
        label: 'laptop', category: 'object', isPlant: false, commonName: 'laptop', scientificName: '',
        confidence: 0.99, alternatives: [], provider: 'gemini', model: 'gemini-3.8-flash', ...overrides
    });

    async function predictAndRender(vision) {
        const harness = createHarness({ vision });
        const recognition = await harness.start();
        await harness.elements['test-plant-id-btn'].click();
        const prediction = await recognition.runModelPrediction(video);
        recognition.displayPlantResult(prediction);
        return { harness, prediction, html: harness.elements['plant-results'].children[0].innerHTML };
    }

    test('sends one downscaled JPEG frame to the local server', async () => {
        const { harness } = await predictAndRender(result());
        const visionCalls = harness.calls.fetch.filter(url => url === 'http://localhost:3001/api/vision/identify');
        expect(visionCalls).toHaveLength(1);
        expect(harness.calls.visionBodies[0]).toEqual({ image: 'QUJD', mimeType: 'image/jpeg' });
    });

    test('a computer is shown as a computer without a health score', async () => {
        const { prediction, html } = await predictAndRender(result());
        expect(prediction.plantType).toBe('generic_plant');
        expect(html).toContain('<div class="plant-name">laptop</div>');
        expect(html).toContain('99% Gemini');
        expect(html).toContain('This is not a plant: laptop');
        expect(html).not.toMatch(/health-indicator[^"]*">\s*\d+%/);
        expect(html).not.toContain('Season:');
    });

    test('a house plant is identified by name without an invented health score', async () => {
        const { html } = await predictAndRender(result({ label: 'Monstera deliciosa', category: 'plant', isPlant: true, commonName: 'Swiss cheese plant', scientificName: 'Monstera deliciosa', confidence: 0.98 }));
        expect(html).toContain('Swiss cheese plant (Monstera deliciosa)');
        expect(html).toContain('Crop health analysis is not available for Swiss cheese plant');
        expect(html).not.toContain('Could not confidently identify');
    });

    test('a database crop gets the crop health analysis', async () => {
        const { prediction, html } = await predictAndRender(result({ label: 'maize', category: 'plant', isPlant: true, commonName: 'Corn', scientificName: 'Zea mays', confidence: 0.95 }));
        expect(prediction.plantType).toBe('corn');
        expect(html).toContain('Corn (Zea mays)');
        expect(html).toContain('Season:');
        expect(html).toMatch(/health-indicator (excellent|good|poor)">\s*\d+%/);
    });

    test('genus-only names map to a crop only when the genus is unique', async () => {
        const recognition = await createHarness().start();
        expect(recognition.findCropByScientificName('Triticum')).toBe('wheat');
        expect(recognition.findCropByScientificName('Solanum')).toBeNull();
        expect(recognition.findCropByScientificName('Solanum tuberosum')).toBe('potato');
        expect(recognition.findCropByScientificName('Monstera deliciosa')).toBeNull();
    });

    test('unknown is shown only when Gemini says unknown', async () => {
        const { html } = await predictAndRender(result({ label: 'unknown', category: 'unknown', commonName: 'unknown', confidence: 0.1 }));
        expect(html).toContain('Could not identify the subject');
    });

    test('model text is HTML-escaped', async () => {
        const { html } = await predictAndRender(result({ label: '<img src=x onerror=alert(1)>', commonName: '<img src=x onerror=alert(1)>' }));
        expect(html).not.toContain('<img');
        expect(html).toContain('&lt;img');
    });

    test('server failure falls back to the offline MobileNet estimate', async () => {
        const harness = createHarness({ vision: null });
        const recognition = await harness.start();
        recognition.model = { classify: async () => [{ className: 'corn', probability: 0.6 }] };
        const prediction = await recognition.runModelPrediction(video);
        expect(prediction).toEqual({ plantType: 'corn', confidence: 0.6, isManual: false, rawClassName: 'corn' });
        recognition.displayPlantResult(prediction);
        expect(harness.elements['plant-results'].children[0].innerHTML).toContain('60% Offline AI');
    });
});
