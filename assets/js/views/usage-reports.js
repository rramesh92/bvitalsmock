window.Views = window.Views || {};
window.Views['usage-reports'] = {
  selectedId: null,

  async render(el, params) {
    if (UIState.force === 'loading') { el.innerHTML = `${skeleton(2)}${skeleton(6)}`; return; }
    this.injectCss();
    el.innerHTML = `${skeleton(2)}${skeleton(6)}`;
    let d;
    try { d = await DB.load('usage-reports'); }
    catch (e) { el.innerHTML = errorState(e.message); return; }
    if (UIState.force === 'error') { el.innerHTML = errorState('Could not load usage reports.'); return; }
    this.data = d;

    // deep-link to a report id via params, else default to detail report
    const paramId = params && params[0] ? parseInt(params[0], 10) : null;
    this.selectedId = paramId || this.selectedId || (d.detail ? d.detail.report_id : null);

    if (UIState.force === 'empty' || !d.reports || !d.reports.length) {
      el.innerHTML = this.head() + emptyState('inbox', 'No usage reports yet',
        'Generate your first usage report to see cohort activity by module and subject.',
        '<button class="btn btn-primary" id="ur-gen-empty">Generate Report</button>');
      const g = el.querySelector('#ur-gen-empty'); if (g) g.onclick = () => toast('Generating report (mock)', 'info');
      return;
    }

    el.innerHTML = this.head() + `
      <div class="section-label">Available Usage Reports</div>
      <div class="panel-card pad-0">
        <table class="data ur-table">
          <thead><tr><th>Report</th><th>Date Range</th><th>Question Bank</th><th>Generated</th><th>Status</th></tr></thead>
          <tbody>${d.reports.map(r => `<tr class="ur-row ${r.id === this.selectedId ? 'sel' : ''}" data-id="${r.id}">
            <td><b>${H.esc(r.name)}</b></td>
            <td>${H.esc(r.date_range)}</td>
            <td>${H.esc(r.question_bank)}</td>
            <td>${r.generated_at ? H.date(r.generated_at) : '<span class="muted">—</span>'}</td>
            <td>${this.statusPill(r.status)}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
      <div id="ur-detail"></div>`;

    el.querySelectorAll('.ur-row').forEach(row => row.onclick = () => {
      this.selectedId = parseInt(row.dataset.id, 10);
      el.querySelectorAll('.ur-row').forEach(r => r.classList.toggle('sel', r === row));
      this.detail(el);
    });
    const gen = el.querySelector('#ur-generate');
    if (gen) gen.onclick = () => toast('Generating report (mock)', 'info');

    this.detail(el);
  },

  head() {
    return `
      <div class="page-head"><div>
        <h1>Usage Reports</h1>
        <p class="subtitle">${this.data ? H.esc(this.data.organization || 'Organization') : ''}</p>
      </div>
        <button class="btn btn-primary" id="ur-generate">Generate Report</button>
      </div>`;
  },

  statusPill(status) {
    const map = { complete: 'good', generating: 'warn', failed: 'risk' };
    const label = { complete: 'Complete', generating: 'Generating', failed: 'Failed' }[status] || status;
    return `<span class="pill ${map[status] || 'muted'}">${H.esc(label)}</span>`;
  },

  detail(el) {
    const wrap = el.querySelector('#ur-detail');
    if (!wrap) return;
    const d = this.data;
    const rep = (d.reports || []).find(r => r.id === this.selectedId);
    const det = d.detail && d.detail.report_id === this.selectedId ? d.detail : null;

    if (rep && rep.status === 'generating') {
      wrap.innerHTML = `<div class="section-label mt-16">Report Detail</div>` +
        emptyState('clock', 'Report is generating', 'This report is still being prepared. Check back shortly.', '');
      return;
    }
    if (!det) {
      wrap.innerHTML = `<div class="section-label mt-16">Report Detail</div>` +
        emptyState('chart', 'Detail not available', 'A detailed breakdown is not available for this report in the mock dataset.', '');
      return;
    }

    const c = det.cohort_summary;
    wrap.innerHTML = `
      <div class="page-head mt-16" style="margin-bottom:8px"><div>
        <div class="section-label" style="margin-top:0">Report Detail</div>
        <h2 style="margin:2px 0 0;color:var(--navy-900)">${H.esc(det.title)}</h2>
        <p class="subtitle">${H.esc(det.question_bank)}</p>
      </div>
        <button class="btn btn-secondary" id="ur-export">Export CSV</button>
      </div>

      <div class="grid cols-4" style="margin-bottom:16px">
        <div class="card"><div class="stat"><div class="value">${c.registered_users.toLocaleString()}</div><div class="label">Registered Users</div></div></div>
        <div class="card"><div class="stat"><div class="value">${c.active_users.toLocaleString()}</div><div class="label">Active Users</div></div></div>
        <div class="card"><div class="stat"><div class="value">${c.total_questions.toLocaleString()}</div><div class="label">Questions Answered</div></div></div>
        <div class="card"><div class="stat"><div class="value">${c.total_usage_min.toLocaleString()}</div><div class="label">Total Usage (min)</div></div></div>
      </div>

      <div class="section-label">By Module / Subject</div>
      <div class="panel-card pad-0">
        <table class="data">
          <thead><tr><th>Module</th><th>Students</th><th>Answered</th><th>Usage (min)</th><th>Avg Score</th></tr></thead>
          <tbody>${det.by_module.map(m => `<tr>
            <td><b>${H.esc(m.module)}</b></td>
            <td>${m.students.toLocaleString()}</td>
            <td>${m.answered.toLocaleString()}</td>
            <td>${m.usage_min.toLocaleString()}</td>
            <td><span class="progress ${H.scoreClass(m.avg_score)}" style="width:90px;display:inline-block;vertical-align:middle"><span style="width:${m.avg_score}%"></span></span> ${m.avg_score}%</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>`;

    const ex = wrap.querySelector('#ur-export');
    if (ex) ex.onclick = () => toast('Exporting report CSV (mock)', 'info');
  },

  injectCss() {
    if (document.getElementById('css-usage-reports')) return;
    const s = document.createElement('style');
    s.id = 'css-usage-reports';
    s.textContent = `
      .ur-table .ur-row{cursor:pointer}
      .ur-table .ur-row:hover{background:var(--teal-050)}
      .ur-table .ur-row.sel{background:var(--teal-050);box-shadow:inset 3px 0 0 var(--info)}`;
    document.head.appendChild(s);
  }
};
