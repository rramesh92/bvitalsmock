window.Views = window.Views || {};
window.Views.dashboard = {
  tab: 'quizzes',
  async render(el, params = []) {
    if (UIState.force === 'loading') { el.innerHTML = loadingLayout(); return; }
    el.innerHTML = loadingLayout();
    let d;
    try { d = await DB.load('dashboard'); }
    catch (e) { el.innerHTML = errorState(e.message); return; }
    if (UIState.force === 'error') { el.innerHTML = errorState('Could not load your dashboard.'); return; }
    if (params[0] === 'weekly-report') { this.renderWeeklyReport(el, d); return; }

    const sq = d.start_quiz, qs = d.question_status, cme = d.cme_moc, ap = d.adaptive_prep || {};
    const apState = AdaptivePrep.read();
    const todayComplete = apState.completed_days.includes(AdaptivePrep.todayKey());
    const checkpointComplete = !!apState.checkpoint_complete;
    const showUpdatedPlan = params[0] === 'updated-plan';
    const primaryLabel = !todayComplete ? "Start today's session" : checkpointComplete ? 'View Weekly Report' : 'Start Friday Checkpoint';
    const primaryAction = !todayComplete ? 'daily' : checkpointComplete ? 'report' : 'checkpoint';
    const scoreColor = d.score >= 75 ? 'var(--good)' : d.score >= 50 ? 'var(--warn)' : 'var(--risk)';

    el.innerHTML = `
      <div class="dash-grid">

        <!-- Adaptive Prep Agent entry point (col-lg-3) -->
        <div>
          <div class="section-label">This Week's Plan</div>
          <div class="panel-card">
            <div class="start-block">
              <div class="between" style="align-items:flex-start;gap:12px">
                <div>
                  <h4>${H.esc(ap.week_label || 'Current week')}</h4>
                  <p>${Icon.target} ${this.topicList(ap.focus_topics || [])}</p>
                </div>
                <span class="pill muted">${ap.days_remaining_until_friday} days to Friday Checkpoint</span>
              </div>
              <p>${H.esc(ap.ai_reason || '')}</p>
              ${showUpdatedPlan ? `<div class="explanation" style="margin-top:0;margin-bottom:12px">
                <h4>Updated week plan</h4>
                <p class="mb-0">${H.esc(ap.replan_notification?.message || '')}</p>
              </div>` : ''}
              ${this.masteryCards(d.weak_subjects || [], apState)}
              <div class="mt-16">
                <div class="between" style="margin-bottom:8px">
                  <b style="color:var(--navy-900)">${H.esc(ap.daily_session?.label || "Today's session")}</b>
                  <span class="pill ${todayComplete ? 'good' : 'muted'}">${todayComplete ? 'Complete' : `${ap.daily_session?.question_count || 0} questions`}</span>
                </div>
                ${this.weekPlanRows(ap.week_plan || [], todayComplete, checkpointComplete)}
              </div>
              <button class="btn btn-primary btn-block btn-lg mt-16" id="adaptive-primary" data-action="${primaryAction}">${primaryLabel}</button>
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
                ${apState.share_with_admin ? `<div class="pc">
                  <div class="peer-curve" style="margin:0 auto">${bellCurve(d.peer_rank_percentile)}</div>
                  <div style="margin-top:6px"><b>Peer Rank</b>
                    <span style="font-size:26px;font-weight:700;color:var(--navy-900);margin-left:6px">${d.peer_rank_percentile}<sup style="font-size:13px">th</sup></span>
                    <div><small class="muted" style="font-style:italic">Percentile</small></div>
                  </div>
                </div>` : ''}
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

    const adaptivePrimary = document.getElementById('adaptive-primary');
    if (adaptivePrimary) adaptivePrimary.onclick = () => {
      if (adaptivePrimary.dataset.action === 'daily') location.hash = '#/take-quiz/adaptive-daily';
      else if (adaptivePrimary.dataset.action === 'checkpoint') location.hash = '#/take-quiz/friday-checkpoint';
      else location.hash = '#/dashboard/weekly-report';
    };
    document.getElementById('cme-upgrade').onclick = () => { location.hash = '#/cme'; };
    this.maybeShowReplanToast(ap, apState);
  },

  topicList(topics) {
    return (topics || []).map(t => H.esc(t)).join(', ');
  },

  masteryCards(subjects, state) {
    const delta = state.daily_mastery_delta || 0;
    return `<div class="grid" style="gap:8px">
      ${subjects.map(s => {
        const mastery = Math.min(100, (s.mastery || s.score || 0) + delta);
        return `<div class="between" style="gap:10px">
          <span><b style="color:var(--navy-900)">${H.esc(s.subject)}</b><br><small>${H.esc(s.risk_category)}</small></span>
          <span class="pill ${H.scoreClass(mastery)}">${mastery}% mastery</span>
        </div>`;
      }).join('')}
    </div>`;
  },

  weekPlanRows(rows, todayComplete, checkpointComplete) {
    const statusClass = (status) => status === 'complete' ? 'good' : status === 'checkpoint' ? 'muted' : 'warn';
    return `<table class="data"><tbody>${rows.map(r => {
      let label = r.status;
      let cls = statusClass(r.status);
      if (r.day === 'Friday' && todayComplete && !checkpointComplete) { label = 'ready'; cls = 'good'; }
      if (r.day === 'Friday' && checkpointComplete) { label = 'complete'; cls = 'good'; }
      return `<tr>
        <td style="padding:8px 0"><b>${H.esc(r.day)}</b><br><small>${H.esc(r.reason)}</small></td>
        <td style="padding:8px 0">${H.esc(r.topic)}</td>
        <td style="padding:8px 0;text-align:right"><span class="pill ${cls}">${H.esc(label)}</span></td>
      </tr>`;
    }).join('')}</tbody></table>`;
  },

  maybeShowReplanToast(ap, state) {
    if (!ap?.replan_notification || state.replan_seen) return;
    setTimeout(() => {
      AdaptivePrep.markReplanSeen();
      toast(ap.replan_notification.message, '', {
        duration: 7000,
        onClick: () => { location.hash = '#/dashboard/updated-plan'; }
      });
    }, 400);
  },

  renderWeeklyReport(el, d) {
    const ap = d.adaptive_prep || {};
    const st = AdaptivePrep.read();
    const report = ap.weekly_report || {};
    const checkpointScore = st.checkpoint_score == null ? 'Not completed' : `${st.checkpoint_score}%`;
    const masteryCurrent = Math.max(report.mastery_current_week || 0, (report.mastery_current_week || 0) + (st.daily_mastery_delta || 0));
    el.innerHTML = `
      <a href="#/dashboard" class="btn btn-ghost" style="padding-left:0;font-weight:700">&lt; Back to Dashboard</a>
      <div class="page-head">
        <div>
          <h1>Weekly Report</h1>
          <p class="subtitle">A self-referenced summary of this week's Adaptive Prep work.</p>
        </div>
        <span class="pill ${st.checkpoint_complete ? 'good' : 'muted'}">Friday Checkpoint: ${H.esc(checkpointScore)}</span>
      </div>

      <div class="grid cols-3">
        <div class="card">
          <div class="stat">
            <div class="value good">+${report.mastery_change || 0}%</div>
            <div class="label">Mastery change vs. your prior week</div>
          </div>
          <div class="progress good mt-16"><span style="width:${masteryCurrent}%"></span></div>
          <small>${report.mastery_prior_week || 0}% last week to ${masteryCurrent}% this week</small>
        </div>
        <div class="card">
          <div class="stat">
            <div class="value good">+${Math.max(report.confidence_calibration_change || 0, st.confidence_delta || 0)}%</div>
            <div class="label">Confidence-calibration change</div>
          </div>
          <p class="muted mt-16 mb-0">Your confidence ratings are closer to your actual answers than they were last week.</p>
        </div>
        <div class="card">
          <h3>Next week's proposed focus</h3>
          <div class="q-meta">${(report.next_week_focus || []).map(t => `<span class="pill">${H.esc(t)}</span>`).join('')}</div>
          <p class="mb-0">${H.esc(report.reason || '')}</p>
        </div>
      </div>

      <div class="section-label mt-16">This week's focus topics</div>
      <div class="panel-card pad-0">
        <table class="data">
          <thead><tr><th>Topic</th><th>Start mastery</th><th>Current mastery</th><th>Change</th></tr></thead>
          <tbody>${(d.weak_subjects || []).map(s => {
            const now = Math.min(100, (s.mastery || s.score || 0) + (st.daily_mastery_delta || 0));
            const change = now - (s.mastery || s.score || 0);
            return `<tr><td><b>${H.esc(s.subject)}</b></td><td>${s.mastery || s.score || 0}%</td><td>${now}%</td><td><span class="pill ${change >= 0 ? 'good' : 'warn'}">${change >= 0 ? '+' : ''}${change}%</span></td></tr>`;
          }).join('')}</tbody>
        </table>
      </div>`;
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
