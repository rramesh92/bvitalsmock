/* Mock data loader + shared helpers. All data is static JSON over fetch(). */
window.DB = (function () {
  const cache = {};
  async function load(name) {
    if (cache[name]) return cache[name];
    const res = await fetch(`mock-data/${name}.json`);
    if (!res.ok) throw new Error(`Failed to load ${name}.json (${res.status})`);
    const json = await res.json();
    cache[name] = json;
    return json;
  }
  return { load, cache };
})();

/* Simulated UI state controls (toggle from the States demo page / query string). */
window.UIState = { force: null }; // null | 'loading' | 'empty' | 'error'

window.H = {
  esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  pct(n) { return `${Math.round(n)}%`; },
  letter(i) { return 'ABCDEFGH'[i] || '?'; },
  scoreClass(n) { return n >= 75 ? 'good' : n >= 60 ? 'warn' : 'risk'; },
  date(iso) {
    if (!iso) return '—';
    const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },
  mmss(sec) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  },
  initials(first, last) { return `${(first || '?')[0]}${(last || '')[0] || ''}`.toUpperCase(); }
};

/* skeleton block helper */
window.skeleton = function (lines = 3) {
  let h = '<div class="card">';
  for (let i = 0; i < lines; i++) h += `<div class="skeleton skel-line" style="width:${90 - i * 12}%"></div>`;
  return h + '</div>';
};

window.emptyState = function (icon, title, msg, cta) {
  return `<div class="card"><div class="state">${Icon[icon] || ''}<h3>${H.esc(title)}</h3><p>${H.esc(msg)}</p>${cta || ''}</div></div>`;
};

window.errorState = function (msg) {
  return `<div class="error-banner">${Icon.alert}<div><b>Something went wrong.</b><div class="muted">${H.esc(msg)}</div></div>
    <button class="btn btn-secondary" style="margin-left:auto" onclick="location.reload()">Retry</button></div>`;
};
