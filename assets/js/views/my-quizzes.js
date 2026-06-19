window.Views = window.Views || {};
window.Views['my-quizzes'] = {
  view: 'active',   // 'active' | 'archived'
  filter: 'all',    // active: all|completed|inprogress ; archived: all|tests|study|cat|tutor
  async render(el) {
    el.innerHTML = skeleton(6);
    let d;
    try { d = await DB.load('quizzes'); }
    catch (e) { el.innerHTML = errorState(e.message); return; }

    injectQuizzesCss();

    const source = this.view === 'active' ? d.active : d.archived;
    const rows = (UIState.force === 'empty') ? [] : source.filter(q => this.matchFilter(q));

    const activeFilters = [['all', 'All'], ['completed', 'Completed'], ['inprogress', 'In Progress']];
    const archFilters = [['all', 'All'], ['tests', 'Tests'], ['study', 'Study'], ['cat', 'CAT'], ['tutor', 'Tutor']];
    const filters = this.view === 'active' ? activeFilters : archFilters;

    el.innerHTML = `
      <div class="page-head">
        <div>${this.view === 'archived' ? '<a href="#/my-quizzes" id="back-active" class="muted" style="font-size:13px">&lt; Back to My Quizzes</a>' : ''}
          <h1>${this.view === 'archived' ? 'Archived Quizzes' : 'My Quizzes'}</h1>
          <p class="subtitle">${H.esc(App.currentBank().name)}</p></div>
        <div class="row" style="gap:10px">
          <button class="btn btn-secondary" id="reset-qb">Reset Question Bank</button>
          <a class="btn btn-primary" href="#/create-quiz">${Icon.plus} Create Quiz</a>
        </div>
      </div>

      <div class="seg" id="qfilters">
        ${filters.map(f => `<button data-f="${f[0]}" class="${this.filter===f[0]?'active':''}">${f[1]}</button>`).join('')}
      </div>

      <div class="card pad-0 mt-16" id="qlist">
        ${rows.length ? `<table class="data quiz-table">
          <thead><tr>
            <th></th>
            <th>Name</th>
            <th class="col-created">Created</th>
            <th class="col-prog">Progress</th>
            <th class="col-num">Correct</th>
            <th class="col-num">Incorrect</th>
            <th class="col-num">Unanswered</th>
            <th class="col-num"># of Q's</th>
            <th>Action</th>
            <th></th>
          </tr></thead>
          <tbody>${rows.map(q => this.rowHtml(q)).join('')}</tbody>
        </table>`
        : emptyState('list', this.view === 'archived' ? 'No Quiz Available' : 'No Quiz Available',
            this.view === 'active' ? 'Create your first quiz to start practicing.' : 'Archived quizzes will appear here.',
            this.view === 'active' ? '<a class="btn btn-primary mt-8" href="#/create-quiz">Create a Quiz</a>' : '')}
      </div>

      ${this.view === 'active' ? `<div class="mt-16"><a href="#/my-quizzes" id="view-archived" class="archived-link">VIEW ARCHIVED QUIZZES</a></div>` : ''}`;

    el.querySelectorAll('#qfilters button').forEach(b => b.onclick = () => { this.filter = b.dataset.f; this.render(el); });
    const va = el.querySelector('#view-archived');
    if (va) va.onclick = (e) => { e.preventDefault(); this.view = 'archived'; this.filter = 'all'; this.render(el); };
    const ba = el.querySelector('#back-active');
    if (ba) ba.onclick = (e) => { e.preventDefault(); this.view = 'active'; this.filter = 'all'; this.render(el); };
    el.querySelector('#reset-qb').onclick = () => toast('Reset Question Bank is mocked');
    el.querySelectorAll('[data-arch]').forEach(b => b.onclick = () => {
      toast(this.view === 'active' ? 'Quiz archived' : 'Quiz restored', 'success');
    });
  },

  matchFilter(q) {
    if (this.view === 'active') {
      if (this.filter === 'completed') return q.status === 'complete';
      if (this.filter === 'inprogress') return q.status !== 'complete';
      return true;
    }
    if (this.filter === 'tests') return q.type === 'test';
    if (this.filter === 'study') return q.type === 'study';
    if (this.filter === 'cat') return q.type === 'adaptive';
    if (this.filter === 'tutor') return q.type === 'tutor';
    return true;
  },

  rowHtml(q) {
    const complete = q.status === 'complete';
    const started = q.started !== false;
    const actionText = complete ? 'Review' : (started ? 'Continue' : 'Start');
    const href = `#/${complete ? 'results' : 'take-quiz'}/${q.id}`;
    return `<tr>
      <td>${this.scoreBadge(q)}</td>
      <td class="q-name"><b>[${H.esc(q.type_label || q.type)}]</b> ${H.esc(q.name)}</td>
      <td class="col-created muted">${H.date(q.created_at)}</td>
      <td class="col-prog">${this.progressBar(q)}</td>
      <td class="col-num">${q.correct}</td>
      <td class="col-num">${q.incorrect}</td>
      <td class="col-num">${q.unanswered}</td>
      <td class="col-num">${q.total_questions}</td>
      <td><a href="${href}" class="${complete ? '' : 'action-go'}">${actionText}</a></td>
      <td><button class="btn btn-ghost" style="padding:2px 8px" data-arch="${q.id}">${this.view === 'active' ? 'Archive' : 'Unarchive'}</button></td>
    </tr>`;
  },

  scoreBadge(q) {
    if (q.status === 'complete') {
      if (q.type === 'adaptive' && q.percentile != null) {
        return `<span class="score-badge complete">${q.percentile}${ord(q.percentile)}<br><small>${H.esc(q.difficulty_level || '')}</small></span>`;
      }
      return `<span class="score-badge complete ${H.scoreClass(q.score)}">${q.score}%</span>`;
    }
    if (q.started === false) return `<span class="score-badge new">New</span>`;
    return `<span class="score-badge incomplete">Continue</span>`;
  },

  progressBar(q) {
    const total = q.total_questions || 1;
    if (q.type === 'adaptive' && q.status !== 'complete') {
      return `<div class="qprog"><span class="seg-gray" style="width:100%"></span></div>`;
    }
    const c = (q.correct / total) * 100;
    const i = (q.incorrect / total) * 100;
    const u = ((q.num_answered - q.correct - q.incorrect) / total) * 100;
    return `<div class="qprog">
      <span class="seg-success" style="width:${c}%"></span>
      <span class="seg-danger" style="width:${i}%"></span>
      <span class="seg-darkgray" style="width:${u > 0 ? u : 0}%"></span>
    </div>`;
  }
};

function ord(n) { const s = ['th','st','nd','rd'], v = n % 100; return s[(v - 20) % 10] || s[v] || s[0]; }

function injectQuizzesCss() {
  if (document.getElementById('css-quizzes')) return;
  const st = document.createElement('style');
  st.id = 'css-quizzes';
  st.textContent = `
    .quiz-table td{vertical-align:middle}
    .quiz-table .col-num{text-align:center;width:64px}
    .quiz-table .q-name{max-width:260px}
    .archived-link{font-size:13px;font-weight:700;letter-spacing:.4px;color:var(--info);text-transform:uppercase}
    .score-badge{display:inline-block;min-width:48px;text-align:center;padding:6px 8px;border-radius:6px;font-weight:700;font-size:13px;line-height:1.1;background:#e9edf1;color:var(--navy-900)}
    .score-badge.complete.good{background:var(--good);color:#fff}
    .score-badge.complete.warn{background:#c9851b;color:#fff}
    .score-badge.complete.risk{background:#d24b4b;color:#fff}
    .score-badge.complete{background:var(--info);color:#fff}
    .score-badge.incomplete{background:#e9edf1;color:var(--info)}
    .score-badge.new{background:var(--teal-050);color:var(--info)}
    .score-badge small{font-weight:500;font-size:10.5px;opacity:.9}
    .qprog{display:flex;height:9px;width:120px;border-radius:5px;overflow:hidden;background:#e9edf1}
    .qprog span{display:block;height:100%}
    .seg-success{background:#2e9e5b}
    .seg-danger{background:#d24b4b}
    .seg-darkgray{background:#7d8a96}
    .seg-gray{background:#c2ccd5}
    a.action-go{font-weight:600}
    @media(max-width:900px){.col-created,.quiz-table thead .col-created{display:none}}`;
  document.head.appendChild(st);
}
