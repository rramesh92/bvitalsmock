window.Views = window.Views || {};
// Performance By Subject — mirrors /dashboard/performance (Quiz Types filter,
// Overall Performance with X/Y Points + Peer Rank, Response Time, subject table).
window.Views.performance = {
  async render(el) {
    if (UIState.force === 'loading') { el.innerHTML = `<div class="grid cols-2">${skeleton(6)}${skeleton(4)}</div>${skeleton(6)}`; return; }
    if (UIState.force === 'empty') { el.innerHTML = `<div class="page-head"><div><h1>Performance By Subject</h1></div></div>` + emptyState('chart', 'No performance data yet', 'Take a quiz to populate your performance by subject.', '<a class="btn btn-primary" href="#/create-quiz">New Custom Quiz</a>'); return; }
    el.innerHTML = skeleton(6);
    let d;
    try { d = await DB.load('performance'); }
    catch (e) { el.innerHTML = errorState(e.message); return; }
    if (UIState.force === 'error') { el.innerHTML = errorState('Could not load your performance.'); return; }

    this.injectCss();
    const o = d.overview;
    const scoreColor = o.score >= 75 ? 'var(--good)' : o.score >= 50 ? 'var(--warn)' : 'var(--risk)';
    const chips = (d.quiz_type_filter || []).map(t =>
      `<span class="qt-chip">${H.esc(t)} <button data-chip="${H.esc(t)}" title="Remove">✕</button></span>`).join('');

    el.innerHTML = `
      <div class="page-head"><div><h1>Performance By Subject</h1></div></div>

      <div class="panel-card">
        <div class="qt-filter">
          <select class="qt-select" id="qt-select" title="Quiz Types">
            <option>Quiz Types</option><option>Test</option><option>Tutor</option><option>Study</option><option>Adaptive (CAT)</option>
          </select>
          <span class="muted" title="Choose which quiz modes to include in Overall and Subject Performance. Risk Assessment values do not change.">(?)</span>
          ${chips}
        </div>

        <div class="perf-grid">
          <div class="perf-box">
            <div class="section-label" style="margin-bottom:10px">Overall Performance <span class="muted" title="Adaptive scores are excluded by default; use the Quiz Type filter to include them.">(?)</span></div>
            <div class="perf-cells">
              <div class="pc">
                <div class="donut" style="background:conic-gradient(${scoreColor} calc(${o.score}*1%), #e9edf1 0);position:relative;width:140px;height:140px;margin:0 auto">
                  <div class="hole" style="width:104px;height:104px"><div><small class="muted">Score</small><div class="big">${o.score}%</div></div></div>
                </div>
                <div class="muted" style="text-align:center;margin-top:8px">${o.points_earned} / ${o.points_possible} Points</div>
              </div>
              <div class="pc">
                <div class="peer-curve" style="margin:0 auto">${perfBellCurve(o.peer_percentile)}</div>
                <div style="text-align:center;margin-top:6px"><b>Peer Rank</b>
                  <span style="font-size:26px;font-weight:700;color:var(--navy-900);margin-left:6px">${o.peer_percentile}<sup style="font-size:13px">${perfOrd(o.peer_percentile)}</sup></span>
                  <div><small class="muted" style="font-style:italic">Percentile</small></div></div>
              </div>
            </div>
          </div>
          <div class="perf-box">
            <div class="section-label" style="margin-bottom:10px">Response Time <span class="muted" title="Compares your average time per question to the time you'll have on test day.">(?)</span></div>
            <div class="rt-row"><div><b>Your Average</b></div><div class="rt-val">${H.mmss(o.your_avg_time_sec)}</div></div>
            <div class="rt-row rt-board"><div><b>Board Exam Average</b></div><div class="rt-val">${H.mmss(o.board_avg_time_sec)}</div></div>
          </div>
        </div>
      </div>

      <div class="panel-card pad-0 mt-16">
        <div class="muted" style="padding:14px 16px 0;font-size:12.5px">${H.esc(d.includes_caption)}</div>
        <table class="data perf-subj">
          <thead><tr>
            <th>Subject</th><th>Questions Correct</th><th>Questions Partially Correct</th>
            <th>Questions Incorrect</th><th>Questions Unanswered</th><th>Score</th><th>Points Possible</th><th>% Correct</th>
          </tr></thead>
          <tbody>${d.by_subject.map(s => `<tr>
            <td><b>${H.esc(s.subject)}</b></td>
            <td>${s.q_correct}</td><td>${s.q_partial}</td><td>${s.q_incorrect}</td><td>${s.q_unanswered}</td>
            <td>${s.score}</td><td>${s.points_possible}</td>
            <td><span class="pill ${H.scoreClass(s.pct_correct)}">${s.pct_correct}%</span></td>
          </tr>`).join('')}</tbody>
        </table>
      </div>`;

    el.querySelectorAll('[data-chip]').forEach(b => b.onclick = () => toast(`Removed "${b.dataset.chip}" filter (mocked)`));
    document.getElementById('qt-select').onchange = (e) => { if (e.target.value !== 'Quiz Types') toast(`Added "${e.target.value}" to Quiz Types filter (mocked)`); };
  },

  injectCss() {
    if (document.getElementById('css-performance')) return;
    const s = document.createElement('style');
    s.id = 'css-performance';
    s.textContent = `
      .qt-filter{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px}
      .qt-select{font:inherit;font-weight:600;color:var(--navy-900);border:1px solid var(--line);border-radius:6px;padding:7px 12px;min-width:150px;cursor:pointer}
      .qt-chip{background:var(--teal-050);color:var(--navy-800);border:1px solid #cfe0f5;border-radius:16px;padding:4px 10px;font-size:12.5px;font-weight:600;display:inline-flex;align-items:center;gap:6px}
      .qt-chip button{border:none;background:none;cursor:pointer;color:var(--muted);font-size:12px}
      .perf-grid{display:grid;grid-template-columns:2fr 1fr;gap:18px;align-items:start}
      @media(max-width:900px){.perf-grid{grid-template-columns:1fr}}
      .perf-box{border:1px solid var(--line);border-radius:8px;padding:14px}
      .perf-cells{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:center}
      .rt-row{display:flex;justify-content:space-between;align-items:center;padding:16px 4px}
      .rt-row .rt-val{font-size:24px;font-weight:700;color:var(--navy-900)}
      .rt-board{border-top:1px solid var(--line);background:var(--bg);margin:0 -14px -14px;padding:16px 14px;border-radius:0 0 8px 8px}
      .perf-subj th{white-space:normal;vertical-align:bottom}`;
    document.head.appendChild(s);
  }
};

function perfOrd(n) { const s = ['th','st','nd','rd'], v = n % 100; return s[(v - 20) % 10] || s[v] || s[0]; }
function perfBellCurve(percentile) {
  const x = 10 + (percentile / 100) * 130;
  const y = 70 - Math.exp(-Math.pow((x - 75) / 32, 2)) * 52;
  return `<svg viewBox="0 0 150 96" width="150" height="96">
    <path d="M5 78 C 45 78, 55 18, 75 18 S 105 78, 145 78" fill="none" stroke="#c7d0d9" stroke-width="2.5"/>
    <line x1="75" y1="8" x2="75" y2="80" stroke="#9aa7b4" stroke-width="1.5" stroke-dasharray="4 3"/>
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#82ca9d"/></svg>`;
}
