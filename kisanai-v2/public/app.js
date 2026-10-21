(function () {
    const $ = id => document.getElementById(id);
    const store = {
        get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
        set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } }
    };
    const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fill = (template, values) => template.replace(/\{(\w+)\}/g, (_, k) => escapeHtml(values[k] ?? ''));

    let lang = store.get('lang') || (navigator.language.startsWith('hi') ? 'hi' : 'en');
    const t = () => window.TEXT[lang];

    // ---------- language + crop ----------
    function renderText() {
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-text]').forEach(el => { el.textContent = t()[el.dataset.text]; });
        $('lang').textContent = t().langButton;
        $('coords').placeholder = t().manualPlaceholder;
        const selected = $('crop').value || store.get('crop') || 'wheat';
        $('crop').innerHTML = Object.entries(t().crops)
            .map(([key, name]) => `<option value="${key}">${escapeHtml(name)}</option>`).join('');
        $('crop').value = selected;
        // Re-draw saved results in the new language.
        const advice = store.get('lastAdvice');
        if (advice && !$('advice').hidden) showAdvice(advice);
        const diagnosis = store.get('lastDiagnosis');
        if (diagnosis && !$('diagnosis').hidden) showDiagnosis(diagnosis);
        renderRotationText();
    }

    $('lang').addEventListener('click', () => {
        lang = lang === 'en' ? 'hi' : 'en';
        store.set('lang', lang);
        renderText();
    });
    $('crop').addEventListener('change', () => store.set('crop', $('crop').value));

    // ---------- irrigation advice ----------
    function showMessage(card, text, isError) {
        card.hidden = false;
        card.innerHTML = `<p class="${isError ? 'error' : 'meta'}">${escapeHtml(text)}</p>`;
    }

    function showAdvice(saved) {
        const { conditions, advice, crop, savedAt } = saved;
        const f = advice.facts;
        const values = { soil: f.soilMoisturePct, refill: f.refillPct, rain: f.rainMm, use: f.cropUseMm, crop: t().crops[crop].toLowerCase(), mm: advice.waterMm, n: advice.inDays };
        let headline = t().headline.wait;
        if (advice.action === 'irrigate_now') headline = t().headline.irrigate_now;
        if (advice.action === 'irrigate_soon') headline = fill(advice.inDays === 1 ? t().headline.irrigate_soon_1 : t().headline.irrigate_soon_n, values);
        const needsWater = advice.action !== 'wait';

        $('advice').hidden = false;
        $('advice').innerHTML = `
            <p class="headline ${needsWater ? 'act' : 'go'}">${escapeHtml(headline)}</p>
            ${needsWater && advice.waterMm > 0 ? `<p class="amount">${fill(t().amount, values)}</p>` : ''}
            <p>${fill(t().reason[advice.reason], values)}</p>
            <div class="facts">
                <div><b>${f.soilMoisturePct}%</b><span>${escapeHtml(t().facts.soil)}</span></div>
                <div><b>${f.rainMm} mm</b><span>${escapeHtml(t().facts.rain)}</span></div>
                <div><b>${f.cropUseMm} mm</b><span>${escapeHtml(t().facts.use)}</span></div>
                <div><b>${Math.round(conditions.temperatureC)}°C</b><span>${escapeHtml(t().facts.temp)}</span></div>
            </div>
            <p class="meta">${fill(t().source, { source: conditions.source })}</p>
            <p class="meta">${escapeHtml(t().savedAt)}: ${escapeHtml(new Date(savedAt).toLocaleString(lang === 'hi' ? 'hi-IN' : undefined))}</p>`;
    }

    async function getAdvice(lat, lon) {
        const crop = $('crop').value;
        $('water').disabled = true;
        showMessage($('advice'), t().loading);
        try {
            const res = await fetch(`/api/advice?lat=${lat}&lon=${lon}&crop=${crop}`);
            if (!res.ok) throw new Error(res.status);
            const saved = { ...(await res.json()), crop, savedAt: Date.now() };
            store.set('lastAdvice', saved);
            store.set('location', { lat, lon });
            showAdvice(saved);
        } catch {
            showMessage($('advice'), t().errorAdvice, true);
        } finally {
            $('water').disabled = false;
        }
    }

    $('water').addEventListener('click', () => {
        if (!navigator.geolocation) {
            $('manual').hidden = false;
            return;
        }
        showMessage($('advice'), t().locating);
        navigator.geolocation.getCurrentPosition(
            pos => {
                $('manual').hidden = true;
                getAdvice(pos.coords.latitude.toFixed(4), pos.coords.longitude.toFixed(4));
            },
            () => {
                $('advice').hidden = true;
                $('manual').hidden = false;
                const last = store.get('location');
                if (last) $('coords').value = `${last.lat}, ${last.lon}`;
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 600000 }
        );
    });

    $('manual').addEventListener('submit', event => {
        event.preventDefault();
        const [lat, lon] = $('coords').value.split(',').map(s => Number(s.trim()));
        if (Number.isFinite(lat) && Number.isFinite(lon)) getAdvice(lat, lon);
    });

    // ---------- photo diagnosis ----------
    // Shrinks the photo so it uploads fast on a weak connection.
    function resizePhoto(file, maxSide = 1280) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                URL.revokeObjectURL(img.src);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    function showDiagnosis(saved) {
        const d = saved.result;
        let body;
        if (!d.isCrop) {
            body = `<p>${fill(t().notCrop, { crop: d.crop })}</p>`;
        } else {
            body = `
                <p class="headline ${d.status === 'healthy' ? 'go' : 'act'}">${escapeHtml(t().status[d.status] || d.status)}</p>
                <p><b>${escapeHtml(d.crop)}</b>${d.problem ? ` — ${escapeHtml(d.problem)}` : ''}</p>
                ${d.advice.length ? `<ul>${d.advice.map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul>` : ''}
                <p class="meta">${fill(t().confidence, { pct: Math.round(d.confidence * 100) })}</p>
                <p class="meta">${escapeHtml(t().disclaimer)}</p>`;
        }
        $('diagnosis').hidden = false;
        $('diagnosis').innerHTML = (saved.preview ? `<img src="${saved.preview}" alt="">` : '') + body;
    }

    $('photo').addEventListener('change', async () => {
        const file = $('photo').files[0];
        if (!file) return;
        showMessage($('diagnosis'), t().loading);
        try {
            const dataUrl = await resizePhoto(file);
            const res = await fetch('/api/diagnose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: dataUrl.split(',')[1], mimeType: 'image/jpeg', language: lang, crop: $('crop').value })
            });
            if (!res.ok) throw new Error(res.status);
            const result = await res.json();
            showDiagnosis({ result, preview: dataUrl });
            store.set('lastDiagnosis', { result }); // photo itself is not kept
        } catch {
            showMessage($('diagnosis'), t().errorPhoto, true);
        } finally {
            $('photo').value = '';
        }
    });

    // ---------- crop rotation planner ----------
    const PRIORITY_KEYS = ['soil', 'water', 'resilience', 'income'];
    let priorities = store.get('priorities') || ['soil'];
    const locale = () => (lang === 'hi' ? 'hi-IN' : 'en');
    const monthName = m => new Date(2000, m - 1, 1).toLocaleString(locale(), { month: 'short' });
    const seasonMonths = s => `${monthName(s.months[0])}–${monthName(s.months[s.months.length - 1])}`;
    const signed = n => (n > 0 ? `+${n}` : String(n));

    // Re-fills a select's options in the current language, keeping the chosen value.
    function fillSelect(el, entries, fallback = '') {
        const value = el.value || fallback;
        el.innerHTML = entries.map(([key, name]) => `<option value="${key}">${escapeHtml(name)}</option>`).join('');
        el.value = entries.some(([key]) => key === value) ? value : entries[0][0];
    }

    function renderRotationText() {
        const r = t().rot;
        $('rotPriorities').innerHTML = PRIORITY_KEYS.map(key =>
            `<button type="button" class="chip" data-priority="${key}" aria-pressed="${priorities.includes(key)}">${escapeHtml(r.priorities[key])}</button>`).join('');
        fillSelect($('rotIrrigation'), Object.entries(r.irrigation), store.get('irrigation') || 'limited');
        const crops = Object.entries(r.crops).filter(([key]) => key !== 'fallow');
        fillSelect($('rotLastCrop'), [['', r.noCrop], ...crops]);
        fillSelect($('rotKeepCrop'), [['', r.noCrop], ...crops]);
        fillSelect($('rotTexture'), [['', r.lookUp], ...Object.entries(r.texture)]);
        fillSelect($('rotOm'), [['', r.lookUp], ...Object.entries(r.om)]);
        $('rotCoords').placeholder = t().manualPlaceholder;
        const saved = store.get('lastRotation');
        if (saved && $('rotationResult').innerHTML) showRotation(saved);
    }

    function rotationMessage(text, isError) {
        $('rotationResult').innerHTML = `<div class="card"><p class="${isError ? 'error' : 'meta'}">${escapeHtml(text)}</p></div>`;
    }

    function showRotation(saved) {
        const r = t().rot;
        const { climate, soil, plans } = saved;
        const cropName = key => r.crops[key] || key || '';
        const describe = item => {
            const template = item.code === 'water' && item.mm === 0 ? r.text.water_none : r.text[item.code];
            return fill(template, { ...item, crop: cropName(item.crop), prev: cropName(item.prev).toLowerCase(), a: cropName(item.a), b: cropName(item.b), pct: signed(item.pct) });
        };

        const soilLine = `<p class="meta">${fill(r.soilLine, {
            texture: r.texture[soil.texture].toLowerCase(), om: r.om[soil.organicMatter].toLowerCase(), ph: soil.ph ? `, pH ${soil.ph}` : ''
        })} ${escapeHtml(r.soilSource[soil.source])}</p>`;

        const planCard = (plan, i) => `
            <div class="card">
                <p class="headline go">${fill(r.planTitle, { n: i + 1 })}${i === 0 ? ` · ${escapeHtml(r.best)}` : ''}</p>
                <ol class="seasons">${plan.seasons.map((s, j) => `
                    <li>
                        <span class="meta">${fill(r.yearLabel, { y: Math.floor(j / 2) + 1 })} · ${escapeHtml(seasonMonths(climate.seasons[s.season]))}</span>
                        <b>${escapeHtml(cropName(s.crop))}</b>
                        <span class="meta">${s.irrigationMm ? fill(r.irrigationTag, { mm: s.irrigationMm }) : escapeHtml(r.rainfed)}</span>
                    </li>`).join('')}
                </ol>
                <div class="scores">${PRIORITY_KEYS.map(key => `
                    <div><span>${escapeHtml(r.priorities[key])}</span><span class="bar"><i style="width:${plan.scores[key]}%"></i></span><b>${plan.scores[key]}</b></div>`).join('')}
                </div>
                <ul>${plan.reasons.map(item => `<li>${describe(item)}</li>`).join('')}</ul>
                ${plan.warnings.length ? `<ul class="warn">${plan.warnings.map(item => `<li>${describe(item)}</li>`).join('')}</ul>` : ''}
            </div>`;

        const trend = climate.trend;
        const seasonLine = key => {
            const s = climate.seasons[key];
            return `<li>${fill(r.seasonLine, {
                name: r.season[key], months: seasonMonths(s), mean: Math.round(s.meanTempC),
                hot: Math.round(s.hotDayC), cold: Math.round(s.coldNightC), rain: s.rainMm
            })}</li>`;
        };
        const climateCard = `
            <div class="card">
                <h3>${escapeHtml(r.climateTitle)}</h3>
                <div class="facts">
                    <div><b>${climate.annualRainMm} mm</b><span>${escapeHtml(r.facts.annualRain)}</span></div>
                    <div><b>${signed(trend.rainChangePct)}%</b><span>${fill(r.facts.rainChange, trend)}</span></div>
                    <div><b>${signed(trend.mainSeasonTempChangeC)}°C</b><span>${fill(r.facts.tempChange, trend)}</span></div>
                    <div><b>${trend.dryYearsRecent} / 10</b><span>${escapeHtml(r.facts.dryYears)}</span></div>
                </div>
                <ul>${seasonLine('main')}${seasonLine('second')}</ul>
                ${climate.splitBy === 'rain' ? `<p class="meta">${escapeHtml(r.splitByRain)}</p>` : ''}
                <p class="meta">${fill(t().source, { source: climate.source })}</p>
            </div>`;

        const noPlan = saved.keepCrop ? fill(r.noPlanKeep, { crop: cropName(saved.keepCrop) }) : escapeHtml(r.noPlan);
        $('rotationResult').innerHTML = `
            <div class="card">${soilLine}</div>
            ${plans.length ? plans.map(planCard).join('') : `<div class="card"><p class="error">${noPlan}</p></div>`}
            ${climateCard}
            <p class="meta">${escapeHtml(r.disclaimer)}</p>
            <p class="meta">${escapeHtml(t().savedAt)}: ${escapeHtml(new Date(saved.savedAt).toLocaleString(locale()))}</p>`;
    }

    $('rotPriorities').addEventListener('click', event => {
        const chip = event.target.closest('[data-priority]');
        if (!chip) return;
        const key = chip.dataset.priority;
        // Up to 2 priorities; picking a third drops the oldest.
        priorities = priorities.includes(key) ? priorities.filter(p => p !== key) : [...priorities, key].slice(-2);
        store.set('priorities', priorities);
        $('rotPriorities').querySelectorAll('[data-priority]').forEach(el =>
            el.setAttribute('aria-pressed', String(priorities.includes(el.dataset.priority))));
    });

    // A new place needs a fresh soil lookup.
    function resetSoil() {
        $('rotTexture').value = '';
        $('rotOm').value = '';
        $('rotPh').value = '';
    }
    $('rotCoords').addEventListener('input', resetSoil);

    $('rotGps').addEventListener('click', () => {
        if (!navigator.geolocation) return rotationMessage(t().locationError, true);
        $('rotGps').disabled = true;
        navigator.geolocation.getCurrentPosition(
            pos => {
                $('rotCoords').value = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
                resetSoil();
                $('rotGps').disabled = false;
            },
            () => {
                rotationMessage(t().locationError, true);
                $('rotGps').disabled = false;
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 600000 }
        );
    });

    $('rotation').addEventListener('submit', async event => {
        event.preventDefault();
        const [lat, lon] = $('rotCoords').value.split(',').map(s => Number(s.trim()));
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return rotationMessage(t().locationError, true);

        const params = new URLSearchParams({ lat, lon, irrigation: $('rotIrrigation').value });
        const optional = { soil: 'rotTexture', om: 'rotOm', ph: 'rotPh', lastCrop: 'rotLastCrop', keepCrop: 'rotKeepCrop' };
        for (const [key, id] of Object.entries(optional)) {
            if ($(id).value) params.set(key, $(id).value);
        }
        if (priorities.length) params.set('priorities', priorities.join(','));

        $('rotSubmit').disabled = true;
        rotationMessage(t().rot.loading);
        try {
            const res = await fetch(`/api/rotation?${params}`);
            if (!res.ok) throw new Error(res.status);
            const saved = { ...(await res.json()), keepCrop: $('rotKeepCrop').value, savedAt: Date.now() };
            store.set('lastRotation', saved);
            store.set('location', { lat, lon });
            store.set('irrigation', $('rotIrrigation').value);
            showRotation(saved);
            // Show the soil that was used so the farmer can correct it and plan again.
            $('rotTexture').value = saved.soil.texture;
            $('rotOm').value = saved.soil.organicMatter;
            if (saved.soil.ph) $('rotPh').value = saved.soil.ph;
            if (saved.soil.source === 'default') $('rotSoilBox').open = true;
        } catch {
            rotationMessage(t().rot.error, true);
        } finally {
            $('rotSubmit').disabled = false;
        }
    });

    const lastLocation = store.get('location');
    if (lastLocation) $('rotCoords').value = `${lastLocation.lat}, ${lastLocation.lon}`;

    // ---------- offline ----------
    function updateOnline() {
        $('offline').hidden = navigator.onLine;
        if (!navigator.onLine) {
            const advice = store.get('lastAdvice');
            if (advice) showAdvice(advice);
            const diagnosis = store.get('lastDiagnosis');
            if (diagnosis) showDiagnosis(diagnosis);
            const rotation = store.get('lastRotation');
            if (rotation) showRotation(rotation);
        }
    }
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => { /* app still works without it */ });
    }

    renderText();
    updateOnline();
})();
