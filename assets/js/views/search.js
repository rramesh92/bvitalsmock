window.Views = window.Views || {};
window.Views['search'] = {
  // local UI state
  q: '',
  subject: '',
  status: '',
  marked: false,
  page: 1,
  perPage: 5,

  async render(el, params) {
    if (UIState.force === 'loading') { el.innerHTML = loadingSearch(); return; }
    el.innerHTML = loadingSearch();

    let d;
    try { d = await DB.load('question-search'); }
    catch (e) { el.innerHTML = errorState(e.message); return; }
    if (UIState.force === 'error') { el.innerHTML = errorState('Could not load the question library.'); return; }

    injectSearchCss();
    this._data = d;
    if (UIState.force === 'empty') this._data = Object.assign({}, d, { questions: [] });

    this.paint(el);
  },

  filtered() {
    const d = this._data;
    const q = this.q.trim().toLowerCase();
    return (d.questions || []).filter(item => {
      if (this.subject && item.subject !== this.subject) return false;
      if (this.status && item.status !== this.status) return false;
      if (this.marked && !item.marked) return false;
      if (q) {
        const hay = `${item.stem} ${item.lead_in} ${item.subject}`.toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  },

  paint(el) {
    const d = this._data;
    const facets = d.facets || { subjects: [], status: [] };
    const subjOpts = ['<option value="">All subjects</option>']
      .concat((facets.subjects || []).map(s => `<option value="${H.esc(s.name)}" ${this.subject === s.name ? 'selected' : ''}>${H.esc(s.name)} (${s.count})</option>`));
    const statusOpts = ['<option value="">Any status</option>']
      .concat((facets.status || []).map(s => `<option value="${H.esc(s.name)}" ${this.status === s.name ? 'selected' : ''}>${H.esc(s.name)} (${s.count})</option>`));

    el.innerHTML = `
      <div class="page-head">
        <div><h1>Browse Questions</h1>
          <p class="subtitle">Search and filter the question library for ${H.esc((App.currentBank && App.currentBank() && App.currentBank().name) || 'your question bank')}</p></div>
      </div>

      <div class="section-label">Search &amp; Filters</div>
      <div class="panel-card srch-filters">
        <div class="srch-bar">
          <span class="srch-ico">${Icon.search}</span>
          <input id="srch-q" type="text" placeholder="Search by keyword, symptom, or topic…" value="${H.esc(this.q)}" />
        </div>
        <div class="grid cols-3 srch-selects">
          <label class="field"><span>Subject</span><select id="srch-subject">${subjOpts.join('')}</select></label>
          <label class="field"><span>Status</span><select id="srch-status">${statusOpts.join('')}</select></label>
          <label class="field srch-marked"><span>Marked only</span>
            <button id="srch-marked" type="button" class="btn ${this.marked ? 'btn-primary' : 'btn-secondary'}">
              ${Icon.flag} ${this.marked ? 'Marked' : 'All'}
            </button>
          </label>
        </div>
      </div>

      <div class="section-label" style="margin-top:18px">Results</div>
      <div id="srch-results"></div>`;

    // wire filters
    const reset = () => { this.page = 1; this.paintResults(el); };
    el.querySelector('#srch-q').oninput = (e) => { this.q = e.target.value; reset(); };
    el.querySelector('#srch-subject').onchange = (e) => { this.subject = e.target.value; reset(); };
    el.querySelector('#srch-status').onchange = (e) => { this.status = e.target.value; reset(); };
    el.querySelector('#srch-marked').onclick = () => {
      this.marked = !this.marked;
      const b = el.querySelector('#srch-marked');
      b.className = `btn ${this.marked ? 'btn-primary' : 'btn-secondary'}`;
      b.innerHTML = `${Icon.flag} ${this.marked ? 'Marked' : 'All'}`;
      reset();
    };

    this.paintResults(el);
  },

  paintResults(el) {
    const host = el.querySelector('#srch-results');
    const all = this.filtered();
    const total = all.length;

    if (!total) {
      host.innerHTML = emptyState('inbox', 'No questions found', 'Try adjusting your search terms or clearing the filters.',
        `<button class="btn btn-secondary" id="srch-clear">Clear filters</button>`);
      const clr = host.querySelector('#srch-clear');
      if (clr) clr.onclick = () => { this.q = ''; this.subject = ''; this.status = ''; this.marked = false; this.page = 1; this.paint(el); };
      return;
    }

    const pages = Math.max(1, Math.ceil(total / this.perPage));
    if (this.page > pages) this.page = pages;
    const start = (this.page - 1) * this.perPage;
    const rows = all.slice(start, start + this.perPage);

    const statusPill = (s) => {
      const map = { correct: 'good', unused: 'muted', incorrect: 'risk', marked: 'warn', used: '' };
      return `<span class="pill ${map[s] || 'muted'}">${H.esc(s)}</span>`;
    };
    const diffClass = (dff) => ({ Easy: 'good', Medium: 'warn', Hard: 'risk' }[dff] || 'muted');

    host.innerHTML = `
      <div class="panel-card" style="padding:0">
        <table class="data srch-table">
          <thead><tr><th>Question</th><th>Subject</th><th>Difficulty</th><th>Status</th></tr></thead>
          <tbody>
            ${rows.map(item => `
              <tr class="srch-row" data-id="${item.id}" tabindex="0">
                <td>
                  <div class="srch-stem">${H.esc(item.stem)}</div>
                  <div class="srch-lead muted">${H.esc(item.lead_in)} ${item.marked ? `<span class="srch-flag">${Icon.flag}</span>` : ''}</div>
                </td>
                <td><span class="pill">${H.esc(item.subject)}</span></td>
                <td><span class="pill ${diffClass(item.difficulty)}">${H.esc(item.difficulty)}</span></td>
                <td>${statusPill(item.status)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <div class="srch-pager">
        <span class="muted">Showing ${start + 1}–${Math.min(start + this.perPage, total)} of ${total}</span>
        <div class="srch-pages">
          <button class="btn btn-secondary" id="srch-prev" ${this.page <= 1 ? 'disabled' : ''}>Prev</button>
          ${Array.from({ length: pages }, (_, i) => i + 1).map(p =>
            `<button class="btn ${p === this.page ? 'btn-primary' : 'btn-secondary'} srch-pg" data-p="${p}">${p}</button>`).join('')}
          <button class="btn btn-secondary" id="srch-next" ${this.page >= pages ? 'disabled' : ''}>Next</button>
        </div>
      </div>`;

    host.querySelectorAll('.srch-row').forEach(r => {
      const go = () => toast(`Opening question #${r.dataset.id} (mocked)`);
      r.onclick = go;
      r.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
    });
    const prev = host.querySelector('#srch-prev');
    const next = host.querySelector('#srch-next');
    if (prev) prev.onclick = () => { if (this.page > 1) { this.page--; this.paintResults(el); } };
    if (next) next.onclick = () => { if (this.page < pages) { this.page++; this.paintResults(el); } };
    host.querySelectorAll('.srch-pg').forEach(b => b.onclick = () => { this.page = parseInt(b.dataset.p, 10); this.paintResults(el); });
  }
};

function loadingSearch() {
  return `${skeleton(2)}<div class="grid cols-3">${skeleton(3)}${skeleton(3)}${skeleton(3)}</div>${skeleton(5)}`;
}

function injectSearchCss() {
  if (document.getElementById('css-search')) return;
  const st = document.createElement('style');
  st.id = 'css-search';
  st.textContent = `
    .srch-bar{display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:8px;padding:8px 12px;background:#fff}
    .srch-bar input{border:0;outline:0;flex:1;font-size:14px;background:transparent}
    .srch-ico{display:flex;width:18px;height:18px;color:var(--muted)}
    .srch-ico svg{width:18px;height:18px}
    .srch-selects{margin-top:12px}
    .srch-marked{justify-content:flex-end}
    .srch-marked .btn{display:inline-flex;align-items:center;gap:6px}
    .srch-marked .btn svg{width:15px;height:15px}
    .srch-table td:first-child{max-width:520px}
    .srch-stem{font-weight:600;color:var(--navy-900)}
    .srch-lead{font-size:12.5px;margin-top:3px}
    .srch-flag{display:inline-flex;width:13px;height:13px;color:var(--warn);vertical-align:-2px}
    .srch-flag svg{width:13px;height:13px}
    .srch-row{cursor:pointer}
    .srch-row:hover{background:var(--teal-050)}
    .srch-pager{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-top:14px}
    .srch-pages{display:flex;gap:6px}
    .srch-pages .btn{min-width:36px;padding:6px 10px}`;
  document.head.appendChild(st);
}
