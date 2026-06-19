window.Views = window.Views || {};
window.Views['practice-exam-performance'] = {
  async render(el, params) {
    const examId = (params && params[0]) || null;
    if (UIState.force === 'loading') { el.innerHTML = `${skeleton(3)}${skeleton(6)}`; return; }
    this.injectCss();
    el.innerHTML = `${skeleton(3)}${skeleton(6)}`;
    let d;
    try { d = await DB.load('practice-exam-performance'); }
    catch (e) { el.innerHTML = errorState(e.message); return; }
    if (UIState.force === 'error') { el.innerHTML = errorState('Could not load this practice exam report.'); return; }
    if (UIState.force === 'empty') {
      el.innerHTML = emptyState('award', 'No practice exam results', 'This practice exam has not been completed yet.',
        '<a class="btn btn-primary" href="#/my-quizzes">Back to My Quizzes</a>');
      return;
    }

    const pp = d.predicted_pass;
    const scoreColor = d.score >= 75 ? 'var(--good)' : d.score >= 50 ? 'var(--warn)' : 'var(--risk)';
    const timePct = Math.min(100, Math.round((d.time_used_min / d.total_time_min) * 100));
    const diff = d.score - d.board_average_score;

    el.innerHTML = `
      <a href="#/my-quizzes" class="btn btn-ghost" style="padding-left:0;font-weight:700">&lt; See all past quizzes</a>
      <div class="page-head" style="align-items:flex-start">
        <div>
          <h1 style="margin-bottom:4px">${H.esc(d.name)}</h1>
          <p class="subtitle">Full-length practice exam report${examId ? ` &middot; #${H.esc(String(examId))}` : ''}</p>
        </div>
        <span class="pill ${pp.color}" style="font-size:14px">${H.esc(pp.band)}</span>
      </div>

      <div class="grid cols-3" style="margin-bottom:8px">
        <div class="panel-card pe-pred">
          <div class="section-label" style="margin-top:0">Predicted Pass</div>
          <div class="peExamDonutWrap">
            ${this.peExamDonut(pp.likelihood, pp.color)}
            <div>
              <div class="pe-band">${H.esc(pp.band)}</div>
              <div class="muted">${pp.likelihood}% likelihood</div>
              ${pp.estimated_score != null ? `<div class="muted">Est. score ${pp.estimated_score}</div>` : ''}
            </div>
          </div>
        </div>

        <div class="panel-card">
          <div class="section-label" style="margin-top:0">Overall Score</div>
          <div class="pe-score">
            <div class="donut" style="background:conic-gradient(${scoreColor} calc(${d.score}*1%), #e9edf1 0);position:relative;width:120px;height:120px;margin:0 auto">
              <div class="hole" style="width:90px;height:90px"><div><div class="big" style="font-size:26px;font-weight:800;color:var(--navy-900)">${d.score}%</div><small class="muted">Score</small></div></div>
            </div>
            <div class="pe-counts">
              <div class="ln"><span>Correct</span><b style="color:var(--good)">${d.correct_count}</b></div>
              <div class="ln"><span>Incorrect</span><b style="color:var(--risk)">${d.incorrect_count}</b></div>
              <div class="ln"><span>Unanswered</span><b>${d.unanswered_count}</b></div>
            </div>
          </div>
        </div>

        <div class="panel-card">
          <div class="section-label" style="margin-top:0">Time Used</div>
          <div class="pe-time">
            <div class="big">${d.time_used_min} <small class="muted">/ ${d.total_time_min} min</small></div>
            <div class="progress ${timePct >= 90 ? 'warn' : 'good'}" style="margin:10px 0"><span style="width:${timePct}%"></span></div>
            <div class="muted">${timePct}% of allotted time used</div>
          </div>
          <div class="pe-cmp">
            <div class="ln"><span>Your score</span><b>${d.score}%</b></div>
            <div class="ln"><span>Board average</span><b>${d.board_average_score}%</b></div>
            <div class="ln"><span>Difference</span><b style="color:${diff >= 0 ? 'var(--good)' : 'var(--risk)'}">${diff >= 0 ? '+' : ''}${diff}%</b></div>
          </div>
        </div>
      </div>

      <div class="section-label mt-16">Section / Block Breakdown</div>
      <div class="panel-card pad-0">${this.breakdownTable(d.sections, 'Block')}</div>

      <div class="section-label mt-16">Subject Breakdown</div>
      <div class="panel-card pad-0">${this.breakdownTable(d.subjects, 'Subject')}</div>`;
  },

  breakdownTable(rows, label) {
    return `<table class="data">
      <thead><tr><th>${label}</th><th>Score</th><th>Correct</th><th>Total</th><th>Board Avg</th><th>vs Board</th></tr></thead>
      <tbody>${rows.map(r => {
        const p = Math.round(r.correct / r.total * 100);
        const delta = p - r.board_avg;
        return `<tr>
          <td><b>${H.esc(r.name)}</b></td>
          <td><span class="progress ${H.scoreClass(p)}" style="width:90px;display:inline-block;vertical-align:middle"><span style="width:${p}%"></span></span> ${p}%</td>
          <td>${r.correct}</td>
          <td>${r.total}</td>
          <td>${r.board_avg}%</td>
          <td><span class="pill ${delta >= 0 ? 'good' : 'risk'}">${delta >= 0 ? '+' : ''}${delta}%</span></td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
  },

  peExamDonut(pct, color) {
    const c = { good: 'var(--good)', warn: 'var(--warn)', risk: 'var(--risk)', muted: 'var(--muted)' }[color] || 'var(--good)';
    return `<div class="donut" style="background:conic-gradient(${c} calc(${pct}*1%), #e9edf1 0);position:relative;width:104px;height:104px">
      <div class="hole" style="width:76px;height:76px"><div><div style="font-size:22px;font-weight:800;color:var(--navy-900)">${pct}%</div></div></div></div>`;
  },

  injectCss() {
    if (document.getElementById('css-practice-exam-performance')) return;
    const s = document.createElement('style');
    s.id = 'css-practice-exam-performance';
    s.textContent = `
      .peExamDonutWrap{display:flex;align-items:center;gap:16px}
      .pe-band{font-size:18px;font-weight:800;color:var(--navy-900)}
      .pe-score{display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:center}
      .pe-counts .ln,.pe-cmp .ln{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--line)}
      .pe-counts .ln:last-child,.pe-cmp .ln:last-child{border-bottom:0}
      .pe-time .big{font-size:26px;font-weight:800;color:var(--navy-900)}
      .pe-cmp{margin-top:14px;border-top:1px solid var(--line);padding-top:6px}`;
    document.head.appendChild(s);
  }
};
