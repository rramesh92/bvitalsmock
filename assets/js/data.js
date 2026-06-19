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

/* Small persistent state helper for the dashboard-contained Adaptive Prep flow. */
window.AdaptivePrep = (function () {
  const key = 'bv-adaptive-prep-v1';
  const defaults = {
    completed_days: [],
    daily_mastery_delta: 0,
    latest_daily_score: null,
    checkpoint_complete: false,
    checkpoint_score: null,
    confidence_delta: 0,
    replan_seen: false,
    share_with_admin: false
  };

  function read() {
    try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(key) || '{}')); }
    catch (e) { return Object.assign({}, defaults); }
  }

  function write(next) {
    localStorage.setItem(key, JSON.stringify(next));
    return next;
  }

  function update(patch) {
    return write(Object.assign({}, read(), patch));
  }

  function todayKey() {
    return 'friday';
  }

  return {
    read,
    todayKey,
    markDailyComplete(score) {
      const st = read();
      const day = todayKey();
      const days = st.completed_days.includes(day) ? st.completed_days : st.completed_days.concat(day);
      return update({
        completed_days: days,
        latest_daily_score: score,
        daily_mastery_delta: Math.max(st.daily_mastery_delta || 0, 4)
      });
    },
    markCheckpointComplete(score) {
      return update({
        checkpoint_complete: true,
        checkpoint_score: score,
        confidence_delta: 6
      });
    },
    markReplanSeen() { return update({ replan_seen: true }); },
    setShareWithAdmin(value) { return update({ share_with_admin: !!value }); },
    reset() { return write(Object.assign({}, defaults)); }
  };
})();
