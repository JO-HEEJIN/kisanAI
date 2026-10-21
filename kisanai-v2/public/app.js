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

    // ---------- offline ----------
    function updateOnline() {
        $('offline').hidden = navigator.onLine;
        if (!navigator.onLine) {
            const advice = store.get('lastAdvice');
            if (advice) showAdvice(advice);
            const diagnosis = store.get('lastDiagnosis');
            if (diagnosis) showDiagnosis(diagnosis);
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
