window.Views = window.Views || {};
window.Views.cme = {
  view: 'active',   // 'active' | 'claimed'
  tab: 'in_progress', // 'in_progress' | 'completed'
  async render(el) {
    if (UIState.force === 'loading') { el.innerHTML = `<div class="grid cols-3">${skeleton(2)}${skeleton(2)}${skeleton(2)}</div>${skeleton(6)}`; return; }
    el.innerHTML = skeleton(6);
    let d, certs;
    try { d = await DB.load('cme'); certs = await DB.load('cme-certificates'); }
    catch (e) { el.innerHTML = errorState(e.message); return; }
    if (UIState.force === 'error') { el.innerHTML = errorState('Could not load your CME.'); return; }
    if (UIState.force === 'empty') { el.innerHTML = emptyState('award', 'No CME to display', 'Earn CME credit by taking quizzes in this question bank.'); return; }

    this.injectCss();

    el.innerHTML = `
      <div class="page-head"><div>
        <h1>${this.view === 'active' ? 'Active CME' : 'Claimed CME'}</h1>
        <p class="subtitle">${this.view === 'active' ? "Track and redeem the CME you've earned." : 'View and download your redeemed CME.'}</p>
      </div>
        <div class="seg" id="cme-view">
          <button data-v="active" class="${this.view==='active'?'active':''}">Active CME</button>
          <button data-v="claimed" class="${this.view==='claimed'?'active':''}">Claimed CME</button>
        </div>
      </div>

      <div class="grid cols-3">
        <div class="card stat"><div class="value text-good">${d.summary.earned}</div><div class="label">Credits earned</div></div>
        <div class="card stat"><div class="value">${d.summary.available}</div><div class="label">Credits available</div></div>
        <div class="card stat"><div class="value">${d.summary.claimed}</div><div class="label">Credits already claimed</div></div>
      </div>

      <div id="cme-body" class="mt-16"></div>`;

    el.querySelectorAll('#cme-view button').forEach(b => b.onclick = () => { this.view = b.dataset.v; this.render(el); });

    const body = el.querySelector('#cme-body');
    this.view === 'active' ? this.renderActive(body, d) : this.renderClaimed(body, d, certs);
  },

  renderActive(body, d) {
    body.innerHTML = `
      <div class="seg" id="cme-tabs">
        <button data-t="in_progress" class="${this.tab==='in_progress'?'active':''}">In Progress CME</button>
        <button data-t="completed" class="${this.tab==='completed'?'active':''}">Completed CME</button>
      </div>
      <div id="cme-list" class="mt-16"></div>`;
    const list = body.querySelector('#cme-list');
    const draw = () => {
      const rows = this.tab === 'in_progress' ? d.in_progress : d.completed;
      if (!rows.length) {
        list.innerHTML = `<div class="bv-tabrow-empty">No ${this.tab==='in_progress'?'in-progress':'completed'} CME to display.</div>`;
        return;
      }
      list.innerHTML = rows.map(a => this.cmeCard(a)).join('');
      list.querySelectorAll('[data-claim]').forEach(b => b.onclick = () => this.claimModal(b.dataset.license === 'true', b.dataset.credit));
    };
    draw();
    body.querySelectorAll('#cme-tabs button').forEach(b => b.onclick = () => {
      this.tab = b.dataset.t;
      body.querySelectorAll('#cme-tabs button').forEach(x => x.classList.toggle('active', x === b));
      draw();
    });
  },

  cmeCard(a) {
    const earnedPct = Math.min(100, Math.round(a.credits_earned / a.max_credits * 100));
    const nextPct = Math.round((a.questions_per_credit - a.questions_to_next_credit) / a.questions_per_credit * 100);
    const meetsMin = a.percent_correct >= a.minimum_percent_correct;
    let claimBtn;
    if (a.state === 'completed') {
      claimBtn = `<a href="#" onclick="toast('Certificate opened');return false">See Claimed Certificate</a>`;
    } else if (a.state === 'ready_to_claim' && meetsMin) {
      claimBtn = `<button class="btn btn-primary btn-block" data-claim="${a.id}" data-license="${a.board_id_or_license_number_required}" data-credit="${H.esc(a.credit_type)}">Claim ${H.esc(a.credit_type)}</button>`;
    } else {
      claimBtn = `<button class="btn btn-secondary btn-block" disabled>Credit in Progress</button>`;
    }
    return `
      <div class="panel-card cme-item">
        <div class="between" style="align-items:flex-start">
          <div><b style="font-size:15px">${H.esc(a.display_name)}</b>
            <div class="muted" style="font-size:12.5px;margin-top:2px">${H.esc(a.activity_type)}</div></div>
          <a href="#" onclick="toast('Activity outline opened');return false" class="row" style="gap:6px">${Icon.list} View Activity Outline</a>
        </div>
        <div class="cme-grid">
          <div class="cme-box">
            <div class="cme-box-lbl">Credits Earned</div>
            <div class="cme-box-big">${a.credits_earned}</div>
            <div class="cme-box-sub">${a.credits_claimed} Credits Claimed</div>
            <div class="cme-box-sub">${a.max_credits} Max Credits</div>
          </div>
          <div class="cme-box">
            <div class="cme-box-lbl">Credit in Progress</div>
            <div class="progress good" style="margin:14px 0 8px"><span style="width:${nextPct}%"></span></div>
            <div class="cme-box-sub">${a.questions_to_next_credit} of ${a.questions_per_credit} questions to earn next credit</div>
            <a href="#/create-quiz" class="row" style="gap:4px;margin-top:6px">Continue</a>
          </div>
          <div class="cme-box">
            <div class="cme-box-lbl">% Correct <span class="muted">(Min ${a.minimum_percent_correct}% required)</span></div>
            <div class="cme-box-big ${meetsMin?'text-good':'text-risk'}">${a.percent_correct}%</div>
            <div class="cme-box-sub">${a.incorrect_total} Incorrect</div>
            ${a.incorrect_total ? `<a href="#/create-quiz" class="row" style="gap:4px;margin-top:6px">Retry Missed Questions</a>` : ''}
          </div>
        </div>
        <div style="margin-top:6px">${claimBtn}</div>
      </div>`;
  },

  renderClaimed(body, d, certs) {
    // Certificate list table + Licenses summary (CmeCertificateList columns)
    body.innerHTML = `
      <div class="section-label">Certificates</div>
      <div class="panel-card pad-0">
        ${certs.certificates.length ? `<table class="data">
          <thead><tr><th>Activity</th><th>CME Type</th><th>Credits</th><th>Dates</th><th>Certificate</th></tr></thead>
          <tbody>${certs.certificates.map(c => `<tr>
            <td><b>${H.esc(c.activity)}</b><br><small class="muted">${H.esc(c.certificate_number)}</small></td>
            <td>${H.esc(c.cme_type)}</td>
            <td>${c.credits}</td>
            <td>${H.esc(c.date_range)}</td>
            <td><a href="#" onclick="toast('PDF download mocked');return false">Download</a></td>
          </tr>`).join('')}</tbody></table>` : `<div class="bv-tabrow-empty">No Certificates Available</div>`}
      </div>

      <div class="section-label mt-16">Licenses</div>
      <div class="panel-card pad-0">
        <table class="data">
          <thead><tr><th>Board</th><th>License #</th><th>Credit Type</th><th>Requirement</th><th>Earned</th><th>Renewal</th></tr></thead>
          <tbody>${d.licenses.map(l => `<tr>
            <td><b>${H.esc(l.board_name)}</b></td><td>${H.esc(l.license_number)}</td>
            <td>${H.esc(l.credit_type)}</td>
            <td>${l.requirement_hours} hrs</td>
            <td><span class="progress" style="width:110px;display:inline-block;vertical-align:middle"><span style="width:${Math.round(l.earned_hours/l.requirement_hours*100)}%"></span></span> ${l.earned_hours}/${l.requirement_hours}</td>
            <td>${H.date(l.renewal_date)}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>`;
  },

  claimModal(needsLicense, creditType) {
    openModal({
      title: 'CME Certificate',
      body: `<p>Select an amount and date range.</p>
        <div class="field"><label>Available Credit (${H.esc(creditType || 'AMA PRA Category 1™')})</label><input type="number" value="6" min="1" /></div>
        <div class="grid cols-2">
          <div class="field"><label>Start</label><input type="date" value="2026-01-01" /></div>
          <div class="field"><label>End</label><input type="date" value="2026-06-16" /></div>
        </div>
        <div class="field"><label>Full Name — as it will appear on the certificate</label><input placeholder="Jane Doe, MD" /></div>
        ${needsLicense ? `<div class="field"><label>License Number/Board ID <span class="text-risk">*</span></label><input placeholder="e.g. IM-558231" /></div>` : ''}`,
      confirmLabel: 'Generate Certificate',
      onConfirm: () => toast('Processing Certificate. You will be emailed a confirmation upon success.', 'success')
    });
  },

  injectCss() {
    if (document.getElementById('css-cme')) return;
    const s = document.createElement('style');
    s.id = 'css-cme';
    s.textContent = `
      .cme-item{margin-bottom:16px}
      .cme-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:14px 0}
      .cme-box{border:1px solid var(--line);border-radius:8px;padding:14px;text-align:center}
      .cme-box-lbl{font-size:12px;color:var(--muted);font-weight:600}
      .cme-box-big{font-size:30px;font-weight:700;color:var(--navy-900);margin:6px 0}
      .cme-box-sub{font-size:12px;color:var(--muted)}`;
    document.head.appendChild(s);
  }
};
