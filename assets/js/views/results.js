window.Views = window.Views || {};
window.Views.results = {
  async render(el) {
    if (!document.getElementById('css-results')) {
      const s = document.createElement('style'); s.id = 'css-results';
      s.textContent = `
        .qr-meta{display:flex;flex-wrap:wrap;gap:0;margin:6px 0 20px}
        .qr-meta .item{font-weight:700;color:var(--navy-900);font-size:14px;padding:0 14px;border-left:1px solid var(--line)}
        .qr-meta .item:first-child{padding-left:0;border-left:0}
        .qr-perf{display:grid;grid-template-columns:auto 1fr auto;gap:0;align-items:center}
        .qr-pie{width:150px;height:150px;border-radius:50%;position:relative;margin:0 auto}
        .qr-pie .hole{position:absolute;inset:22px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column}
        .qr-pie .hole .big{font-size:30px;font-weight:800;color:var(--navy-900)}
        .qr-stats{padding:0 28px;border-left:1px solid var(--line)}
        .qr-stats .row-stat{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--line)}
        .qr-stats .row-stat:last-child{border-bottom:0}
        .qr-stats .row-stat b{font-size:14px}
        .qr-stats .row-stat .val{font-size:24px;font-weight:800;color:var(--navy-900)}
        .qr-percentile{background:var(--teal-050);border:1px solid var(--navy-900);border-radius:8px;padding:18px;display:flex;align-items:center;justify-content:center;gap:18px;text-align:center}
        .qr-percentile .num{font-size:30px;font-weight:800;color:var(--navy-900)}
        .qr-rt .row-stat{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line)}
        .qr-rt .row-stat:last-child{border-bottom:0}
        @media(max-width:820px){.qr-perf{grid-template-columns:1fr}.qr-stats{border-left:0;padding:14px 0 0}}
      `;
      document.head.appendChild(s);
    }

    el.innerHTML = `<div class="quiz-shell">${skeleton(5)}</div>`;
    let r;
    try { r = await DB.load('quiz-results'); }
    catch (e) { el.innerHTML = errorState(e.message); return; }

    const scoreColor = r.score >= 75 ? 'var(--good)' : r.score >= 50 ? 'var(--warn)' : 'var(--risk)';
    const ord = (n) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
    const diffLevels = (r.difficulty_levels && r.difficulty_levels.length) ? r.difficulty_levels.join(', ') : 'all';

    el.innerHTML = `
      <a href="#/my-quizzes" id="quiz_results_cancel_button" class="btn btn-ghost" style="padding-left:0;font-weight:700">&lt; See all past quizzes</a>

      <div class="page-head" style="align-items:flex-start">
        <div>
          <h1 style="margin-bottom:6px">${H.esc(r.name)}</h1>
          <div class="qr-meta">
            ${r.user_name ? `<span class="item">${H.esc(r.user_name)}</span>` : ''}
            <span class="item">${H.esc(r.email)}</span>
          </div>
          <div class="qr-meta">
            <span class="item">${H.date(r.created_at)}</span>
            <span class="item">${r.total_questions} Questions</span>
            <span class="item">Completed In ${H.mmss(r.time_spent_seconds)}</span>
            <span class="item" style="text-transform:capitalize">Difficulty Level: ${diffLevels}</span>
          </div>
        </div>
        <button class="btn btn-primary" id="review-questions">Review Questions</button>
      </div>

      <div class="section-label">Overall Performance</div>
      <div class="panel-card">
        <div class="qr-perf">
          <div>
            <div class="qr-pie" style="background:conic-gradient(${scoreColor} calc(${r.score}*1%), #e9edf1 0)">
              <div class="hole"><div class="big">${r.score}%</div><small class="muted">Score</small></div>
            </div>
          </div>
          <div class="qr-stats">
            <div class="row-stat"><b>Correct</b><span class="val" style="color:var(--good)">${r.correct_count}</span></div>
            <div class="row-stat"><b>Incorrect</b><span class="val" style="color:var(--risk)">${r.incorrect_count}</span></div>
            <div class="row-stat"><b>Unanswered</b><span class="val">${r.unanswered_count}</span></div>
          </div>
          <div style="padding-left:28px;min-width:200px">
            <div class="qr-percentile">
              <div><div class="num">${ord(Math.round(r.percentile))}</div><div class="muted">Percentile</div></div>
              <div class="muted">of</div>
              <div><div class="num" style="text-transform:capitalize">Moderate</div><div class="muted">Difficulty Band</div></div>
            </div>
            <div class="qr-rt" style="margin-top:14px">
              <div class="row-stat"><span class="muted">Your Average</span><b>${H.mmss(Math.round(r.average_ms_spent / 1000))}</b></div>
              <div class="row-stat"><span class="muted">Board Exam Average</span><b>${H.mmss(r.board_average_response_seconds)}</b></div>
            </div>
          </div>
        </div>
      </div>

      <div class="section-label">By Subject</div>
      <div class="panel-card pad-0">
        <table class="data">
          <thead><tr><th>Subject</th><th>Score</th><th>Correct</th><th>Incorrect</th><th>Unanswered</th><th># of Qs</th><th>Avg Time</th></tr></thead>
          <tbody>${r.subject_breakdown.map(s => {
            const p = Math.round(s.correct / s.total * 100);
            return `<tr>
              <td><b>${H.esc(s.subject)}</b></td>
              <td><span class="progress ${H.scoreClass(p)}" style="width:90px;display:inline-block;vertical-align:middle"><span style="width:${p}%"></span></span> <small>${p}%</small></td>
              <td>${s.correct}</td>
              <td>${s.incorrect}</td>
              <td>${s.unanswered}</td>
              <td>${s.total}</td>
              <td>${H.mmss(Math.round(s.avg_ms / 1000))}</td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>`;

    document.getElementById('review-questions').onclick = () => { location.hash = '#/take-quiz/' + r.id; };
  }
};
