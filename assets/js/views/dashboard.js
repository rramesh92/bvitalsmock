window.Views = window.Views || {};
window.Views.dashboard = {
  tab: 'quizzes',
  async render(el) {
    if (UIState.force === 'loading') { el.innerHTML = loadingLayout(); return; }
    el.innerHTML = loadingLayout();
    let d;
    try { d = await DB.load('dashboard'); }
    catch (e) { el.innerHTML = errorState(e.message); return; }
    if (UIState.force === 'error') { el.innerHTML = errorState('Could not load your dashboard.'); return; }

    const sq = d.start_quiz, qs = d.question_status, cme = d.cme_moc;
    const scoreColor = d.score >= 75 ? 'var(--good)' : d.score >= 50 ? 'var(--warn)' : 'var(--risk)';

    el.innerHTML = `
      <div class="dash-grid">

        <!-- Start Quiz (col-lg-3) -->
        <div>
          <div class="section-label">Start Quiz</div>
          <div class="panel-card">
            <div class="start-block">
              <h4>Custom Quiz</h4>
              <p>Select your subjects, number of questions, and more.</p>
              <a class="btn btn-block" href="#/create-quiz" style="background:var(--info);color:#fff">New Custom Quiz</a>
            </div>
            <div class="start-block">
              <div class="row" style="justify-content:space-between;align-items:center">
                <h4 style="margin:0">Quick Start Quiz</h4>
                <button class="btn btn-secondary" id="qs-edit" style="border-color:var(--info);color:var(--info);padding:4px 12px">Edit</button>
              </div>
              <p style="margin-top:6px">${H.esc(sq.quick_start.description)}</p>
              <button class="btn btn-block" id="new_quick_quiz_button_card_button" style="background:var(--info);color:#fff">New Quick Start Quiz</button>
            </div>
            <div class="start-block">
              <h4>At Risk Quiz</h4>
              <p>${H.esc(sq.at_risk.description)}</p>
              <button class="btn btn-block ${sq.at_risk.available ? '' : 'disabled'}" id="at-risk-btn"
                style="background:${sq.at_risk.available ? 'var(--info)' : '#9db8d6'};color:#fff">New At Risk Quiz</button>
            </div>
          </div>
        </div>

        <!-- Performance (75%) + Question Status (25%) — one connected panel (col-lg-9) -->
        <div class="joined">
          <div class="col-perf">
            <div class="section-label">Performance</div>
            <div class="panel-card">
              <div class="perf-cells">
                <div class="pc">
                  <div class="donut" style="--p:${d.score};background:conic-gradient(${scoreColor} calc(${d.score}*1%), #e9edf1 0);position:relative;width:128px;height:128px;margin:0 auto">
                    <div class="hole" style="width:96px;height:96px"><div><small class="muted">Score</small><div class="big">${d.score}%</div></div></div>
                  </div>
                </div>
                <div class="pc">
                  <div class="peer-curve" style="margin:0 auto">${bellCurve(d.peer_rank_percentile)}</div>
                  <div style="margin-top:6px"><b>Peer Rank</b>
                    <span style="font-size:26px;font-weight:700;color:var(--navy-900);margin-left:6px">${d.peer_rank_percentile}<sup style="font-size:13px">th</sup></span>
                    <div><small class="muted" style="font-style:italic">Percentile</small></div>
                  </div>
                </div>
                <div class="pc">
                  <div style="font-weight:700;color:var(--navy-800);font-size:13px;margin-bottom:8px">
                    Subject Risk Distribution <span class="muted" title="How your subjects are distributed by readiness">(?)</span></div>
                  <div class="donut-wrap" style="gap:12px;justify-content:center">
                    ${riskDonut(d.subject_risk_distribution)}
                    <div class="risk-legend" style="text-align:left">
                      ${d.subject_risk_distribution.map(r => `<div class="ln"><span class="risk-badge ${r.color}">${r.percent}%</span> ${H.esc(r.category)}</div>`).join('')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-qstatus">
            <div class="section-label">Question Status</div>
            <div class="panel-card qstatus">
              <div class="ln"><span class="k">Answered</span><span class="v">${qs.answered}</span></div>
              <div class="ln"><span class="k">Unanswered</span><span class="v">${qs.unanswered}</span></div>
              <div class="ln"><span class="k">Unseen</span><span class="v">${qs.unseen}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="dash-bottom">
        <!-- CME/MOC -->
        <div>
          <div class="section-label">CME/MOC</div>
          <div class="panel-card cme-card">
            <div class="between" style="align-items:flex-start">
              <div>
                <div class="type">${H.esc(cme.type)}</div>
                <div class="earned">${cme.earned} of ${cme.available} Earned</div>
                <div class="muted" style="font-size:12.5px">${cme.claimed} Credits Already Claimed</div>
              </div>
              <button class="btn btn-secondary" style="border-color:var(--info);color:var(--info)" id="cme-upgrade">Claim CME Credits</button>
            </div>
          </div>
        </div>

        <!-- Quizzes / Assignments -->
        <div>
          <div class="section-label" style="visibility:hidden">.</div>
          <div class="panel-card">
            <div class="bv-tabs" id="dash-tabs">
              <button data-t="quizzes" class="${this.tab==='quizzes'?'active':''}">Quizzes</button>
              <button data-t="assignments" class="${this.tab==='assignments'?'active':''}">Assignments</button>
            </div>
            <div id="dash-tab-body"></div>
            <div class="see-more">See more</div>
          </div>
        </div>
      </div>`;

    const body = () => {
      const tb = document.getElementById('dash-tab-body');
      const rows = this.tab === 'quizzes' ? d.quizzes : d.assignments;
      if (!rows || !rows.length) {
        tb.innerHTML = `<div class="bv-tabrow-empty">No ${this.tab === 'quizzes' ? 'Quiz' : 'Assignment'} Available</div>`;
        return;
      }
      tb.innerHTML = `<table class="data">${rows.map(r => this.tab === 'quizzes'
        ? `<tr><td><b>${H.esc(r.name)}</b></td><td>${r.num_answered}/${r.total_questions}</td>
             <td><a href="#/${r.status==='complete'?'results':'take-quiz'}/${r.id}">${r.status==='complete'?'Review':'Resume'}</a></td></tr>`
        : `<tr><td><b>${H.esc(r.name)}</b><br><small>Due ${H.date(r.due_date)}</small></td>
             <td>${r.completed}/${r.assigned} done</td>
             <td><span class="pill ${r.status==='active'?'good':'muted'} tag-mode">${r.status}</span></td></tr>`).join('')}</table>`;
    };
    body();
    el.querySelectorAll('#dash-tabs button').forEach(b => b.onclick = () => { this.tab = b.dataset.t; el.querySelectorAll('#dash-tabs button').forEach(x=>x.classList.toggle('active',x===b)); body(); });

    document.getElementById('new_quick_quiz_button_card_button').onclick = () => { location.hash = '#/take-quiz'; };
    const qsEdit = document.getElementById('qs-edit');
    if (qsEdit) qsEdit.onclick = () => { location.hash = '#/create-quiz'; };
    const atRisk = document.getElementById('at-risk-btn');
    if (atRisk) atRisk.onclick = () => {
      if (!sq.at_risk.available) return toast('Not enough data yet for an At Risk quiz');
      location.hash = '#/take-quiz';
    };
    document.getElementById('cme-upgrade').onclick = () => { location.hash = '#/cme'; };
  }
};

function bellCurve(percentile) {
  // x position of the marker along the curve
  const x = 10 + (percentile / 100) * 130;
  const y = 70 - Math.exp(-Math.pow((x - 75) / 32, 2)) * 52;
  return `<svg viewBox="0 0 150 96" width="150" height="96">
    <path d="M5 78 C 45 78, 55 18, 75 18 S 105 78, 145 78" fill="none" stroke="#c7d0d9" stroke-width="2.5"/>
    <line x1="75" y1="8" x2="75" y2="80" stroke="#9aa7b4" stroke-width="1.5" stroke-dasharray="4 3"/>
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#6aa84f"/>
  </svg>`;
}

function riskDonut(dist) {
  const colors = { good: '#2e9e5b', warn: '#c9851b', risk: '#d24b4b', muted: '#c2ccd5' };
  let acc = 0; const segs = [];
  dist.forEach(r => { if (r.percent > 0) { segs.push(`${colors[r.color]} ${acc}% ${acc + r.percent}%`); acc += r.percent; } });
  const grad = segs.length ? segs.join(', ') : '#c2ccd5 0% 100%';
  return `<div class="donut" style="background:conic-gradient(${grad});position:relative;width:108px;height:108px">
    <div class="hole" style="width:74px;height:74px"></div></div>`;
}

function loadingLayout() {
  return `<div class="dash-grid">${skeleton(6)}${skeleton(6)}${skeleton(6)}</div>`;
}
