window.Views = window.Views || {};
// Performance Timeline — mirrors /dashboard/performance-timeline: a chronological
// table of all quiz attempts (My Quizzes / Assignments toggle).
window.Views['performance-timeline'] = {
  tab: 'mine', // mine | assignments
  async render(el) {
    if (UIState.force === 'loading') { el.innerHTML = `<div class="page-head"><div><h1>Performance Timeline</h1></div></div>${skeleton(8)}`; return; }
    el.innerHTML = skeleton(6);
    let d;
    try { d = await DB.load('performance-timeline'); }
    catch (e) { el.innerHTML = errorState(e.message); return; }
    if (UIState.force === 'error') { el.innerHTML = errorState('Could not load your timeline.'); return; }

    const rows = (UIState.force === 'empty') ? [] : (this.tab === 'mine' ? d.my_quizzes : d.assignments);
    const badge = (s) => `<span class="pill ${H.scoreClass(s)}">${s}%</span>`;
    const ngnQ = (r) => r.ngn ? ` <span class="ngn-q" title="This quiz includes NGN items and will not display in the mobile app.">?</span>` : '';

    el.innerHTML = `
      <div class="page-head"><div>
        <h1>Performance Timeline</h1>
        <p class="subtitle">${H.esc(d.caption)} <span class="muted" title="CAT scores are excluded from the Timeline.">(?)</span></p>
      </div></div>
      <div class="seg" id="tl-tabs">
        <button data-t="mine" class="${this.tab==='mine'?'active':''}">My Quizzes</button>
        <button data-t="assignments" class="${this.tab==='assignments'?'active':''}">Assignments</button>
      </div>
      <div class="panel-card pad-0 mt-16">
        ${rows.length ? `<table class="data">
          <thead><tr>
            <th>Score</th><th>Name</th><th>Created</th>
            <th>Questions Correct</th><th>Questions Partially Correct</th><th>Questions Incorrect</th>
            <th>Questions Unanswered</th><th># of Q’s</th><th>Action</th>
          </tr></thead>
          <tbody>${rows.map(r => `<tr>
            <td>${badge(r.score)}</td>
            <td><b>[${H.esc(r.mode)}]</b> ${H.esc(r.name)}</td>
            <td><small>${H.esc(r.created)}</small></td>
            <td>${r.q_correct}</td><td>${r.q_partial}</td><td>${r.q_incorrect}</td><td>${r.q_unanswered}</td>
            <td>${r.num_q}</td>
            <td><a href="#/results/${r.id}">Review</a>${ngnQ(r)}</td>
          </tr>`).join('')}</tbody>
        </table>` : emptyState('chart', 'No quizzes yet', this.tab==='mine'?'Your completed quizzes will appear here over time.':'No assignment attempts yet.', '')}
      </div>`;

    el.querySelectorAll('#tl-tabs button').forEach(b => b.onclick = () => { this.tab = b.dataset.t; this.render(el); });
    if (!document.getElementById('css-tl')) {
      const s = document.createElement('style'); s.id = 'css-tl';
      s.textContent = `.ngn-q{display:inline-grid;place-items:center;width:16px;height:16px;border-radius:50%;border:1px solid var(--muted);color:var(--muted);font-size:11px;font-weight:700;cursor:help}`;
      document.head.appendChild(s);
    }
  }
};
