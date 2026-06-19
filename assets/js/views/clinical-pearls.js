window.Views = window.Views || {};
window.Views['clinical-pearls'] = {
  q: '',
  category: '',
  markedOnly: false,
  async render(el) {
    if (UIState.force === 'loading') { el.innerHTML = skeleton(6); return; }
    el.innerHTML = skeleton(6);
    let d;
    try { d = await DB.load('clinical-pearls'); }
    catch (e) { el.innerHTML = errorState(e.message); return; }
    if (UIState.force === 'error') { el.innerHTML = errorState('Could not load clinical pearls.'); return; }

    this.injectCss();
    const ql = this.q.toLowerCase();
    const filtered = d.pearls.filter(p =>
      (!ql || p.pearl.toLowerCase().includes(ql)) &&
      (!this.category || p.categories.includes(this.category)) &&
      (!this.markedOnly || p.marked));

    el.innerHTML = `
      <div class="page-head"><div><h1>Clinical Pearls</h1></div></div>

      <div class="panel-card cp-filter">
        <div class="cp-row">
          <div class="field cp-search" style="margin:0">
            <input id="pearl-q" placeholder="Search Pearls" value="${H.esc(this.q)}"/>
          </div>
          <span class="cp-in">in</span>
          <select id="pearl-cat" class="cp-cat">
            <option value="">Categories</option>
            ${d.categories.map(c => `<option value="${H.esc(c)}" ${this.category===c?'selected':''}>${H.esc(c)}</option>`).join('')}
          </select>
          <label class="row muted cp-marked" style="gap:8px;font-weight:600">
            <input type="checkbox" id="pearl-marked" ${this.markedOnly?'checked':''}/> Marked</label>
        </div>
        <div class="cp-row cp-row2">
          <span class="cp-results">Results: ${filtered.length} Clinical Pearls</span>
          <button class="btn btn-ghost" id="pearl-clear">Clear All Filters</button>
        </div>
      </div>

      <div class="panel-card pad-0 mt-16">
        ${filtered.length ? `<table class="data cp-table">
          <thead><tr><th>Pearl</th><th>Category</th><th>Mark</th></tr></thead>
          <tbody>${filtered.map(p => `<tr>
            <td class="cp-pearl">${H.esc(p.pearl)}</td>
            <td>${p.categories.slice(0,3).map(c => `<span class="pill muted">${H.esc(c)}</span>`).join(' ')}${p.categories.length>3?` <small class="muted">${p.categories.length-3} more</small>`:''}</td>
            <td><button class="icon-btn" data-mark="${p.id}" title="Mark" style="color:${p.marked?'var(--warn)':'var(--muted)'}">${Icon.flag}</button></td>
          </tr>`).join('')}</tbody></table>` : `<div class="bv-tabrow-empty">No Results Found.</div>`}
      </div>`;

    const input = el.querySelector('#pearl-q');
    input.oninput = (e) => { this.q = e.target.value; this.render(el).then(() => { const i = el.querySelector('#pearl-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }); };
    el.querySelector('#pearl-cat').onchange = (e) => { this.category = e.target.value; this.render(el); };
    el.querySelector('#pearl-marked').onchange = (e) => { this.markedOnly = e.target.checked; this.render(el); };
    el.querySelector('#pearl-clear').onclick = () => { this.q = ''; this.category = ''; this.markedOnly = false; this.render(el); };
    el.querySelectorAll('[data-mark]').forEach(b => b.onclick = () => {
      const p = d.pearls.find(x => String(x.id) === b.dataset.mark);
      if (p) { p.marked = !p.marked; b.style.color = p.marked ? 'var(--warn)' : 'var(--muted)'; toast(p.marked ? 'Marked' : 'Unmarked'); }
    });
  },

  injectCss() {
    if (document.getElementById('css-clinical-pearls')) return;
    const s = document.createElement('style');
    s.id = 'css-clinical-pearls';
    s.textContent = `
      .cp-filter{display:flex;flex-direction:column;gap:12px}
      .cp-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
      .cp-row2{padding-top:10px;border-top:1px solid var(--line)}
      .cp-search{flex:1;min-width:220px}
      .cp-in{font-weight:700;color:var(--navy-900)}
      .cp-cat{padding:9px 10px;border:1px solid var(--line);border-radius:6px;background:#fff;min-width:160px}
      .cp-results{font-weight:700;color:var(--navy-900);padding-right:14px;border-right:1px solid var(--line)}
      .cp-table td.cp-pearl{max-width:560px}`;
    document.head.appendChild(s);
  }
};
