window.Views = window.Views || {};
window.Views['take-quiz'] = {
  quiz: null, idx: 0, answers: {}, graded: {}, showExp: {}, confidence: {}, tool: 'none', struck: {}, marked: {}, seconds: 0, timer: null, mode: '', scorecardVisible: false, activityLogged: false,

  async render(el, params = []) {
    if (!document.getElementById('css-take-quiz')) {
      const s = document.createElement('style'); s.id = 'css-take-quiz';
      s.textContent = `
        .tq-header{background:var(--navy-900);color:#fff;border-radius:8px 8px 0 0;padding:12px 16px}
        .tq-title{display:flex;align-items:center;justify-content:space-between;gap:12px}
        .tq-title .name{font-weight:700;font-size:15px}
        .tq-title .count{font-size:13px;color:#cdd8e2}
        .tq-scope{border:1px solid var(--line);border-top:0;background:var(--teal-050);padding:12px 16px;color:var(--navy-900);font-weight:600}
        .tq-confidence{border:1px solid var(--line);border-radius:8px;padding:12px 14px;margin-bottom:14px;background:var(--bg)}
        .tq-confidence h4{margin:0 0 8px;color:var(--navy-900);font-size:13px}
        .tq-conf-opts{display:flex;gap:8px;flex-wrap:wrap}
        .tq-conf-opt{border:1px solid var(--line);background:#fff;color:var(--navy-800);border-radius:var(--radius-sm);padding:7px 13px;font:inherit;font-weight:700;cursor:pointer}
        .tq-conf-opt.active{background:var(--teal-600);border-color:var(--teal-600);color:#fff}
        .answer.locked{cursor:not-allowed;background:var(--bg);opacity:.72}
        .answer.locked:hover{border-color:var(--line)}
        .tq-calibration{border:1px solid var(--line);border-radius:var(--radius-sm);padding:10px 12px;margin-top:12px;background:#fff;color:var(--navy-900);font-weight:700}
        .tq-ai-change{margin-top:8px;color:var(--muted)}
        .tq-scorecard .scoregrid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:16px}
        .tq-scorecard .scorebox{background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:14px}
        .tq-scorecard .scorebox .num{font-size:28px;font-weight:800;color:var(--navy-900)}
        .tq-scorecard ul{margin:8px 0 0;padding-left:18px}
        .tq-tools{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
        .tq-tool{background:transparent;border:1px solid rgba(255,255,255,.55);color:#fff;border-radius:6px;padding:5px 11px;font-size:12.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px}
        .tq-tool.active{background:#fff;color:var(--navy-900);border-color:#fff}
        .tq-tool svg{width:14px;height:14px}
        .tq-tool:disabled{opacity:.4;cursor:not-allowed}
        .tq-graded{margin-top:14px;font-weight:700;font-size:14px}
        .tq-graded.good{color:var(--good)}
        .tq-graded.risk{color:var(--risk)}
        .tq-explwrap{margin-top:16px;display:grid;grid-template-columns:2fr 1fr;gap:18px}
        .tq-peer .pbar{display:flex;align-items:center;gap:8px;margin-bottom:7px;font-size:12.5px}
        .tq-peer .ptrack{flex:1;height:9px;background:#e9edf1;border-radius:5px;overflow:hidden}
        .tq-peer .ptrack span{display:block;height:100%;border-radius:5px}
        .tq-peer .ptrack span.good{background:var(--good)}
        .tq-peer .ptrack span.other{background:#9db8d6}
        .tq-side h5{margin:0 0 6px;font-size:13px;color:var(--navy-900)}
        .tq-side .stat{margin-bottom:12px}
        .tq-review-bar{background:#0044db;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:8px 16px;font-weight:700}
        .tq-review-bar > span{flex:1;text-align:center}
        .tq-feedback{border:1px solid var(--line);border-radius:8px;padding:14px;margin-bottom:14px}
        .tq-feedback .qfeedback-link{font-weight:700;color:var(--info)}
        .tq-feedback .stars{font-size:22px;color:#f5a623;cursor:pointer;margin:4px 0 8px;letter-spacing:2px}
        .tq-feedback .stars span{cursor:pointer}
        .tq-feedback .qfeedback-text{width:100%;min-height:70px;border:1px solid var(--line);border-radius:6px;padding:8px;font:inherit;margin-bottom:10px;resize:vertical}
        .ngn-cloze{font-size:16px;line-height:2.4}
        .ngn-dd{font:inherit;padding:5px 8px;border:1px solid var(--info);border-radius:6px;margin:0 3px;background:#fff}
        .ngn-dd.good{border-color:var(--good);background:var(--good-bg)} .ngn-dd.bad{border-color:var(--risk);background:var(--risk-bg)}
        .ngn-matrix{width:100%;border-collapse:collapse;margin-top:6px}
        .ngn-matrix th,.ngn-matrix td{border:1px solid var(--line);padding:10px 12px;text-align:center}
        .ngn-matrix th{background:var(--bg);font-size:13px} .ngn-matrix td.lbl{text-align:left;font-weight:600}
        .ngn-matrix td.ngn-cell.good{background:var(--good-bg)} .ngn-matrix td.ngn-cell.bad{background:var(--risk-bg)}
        @media(max-width:760px){.tq-explwrap{grid-template-columns:1fr}}
      `;
      document.head.appendChild(s);
    }

    el.innerHTML = `<div class="quiz-shell">${skeleton(6)}</div>`;
    try {
      const baseQuiz = await DB.load('quiz');
      const dashboard = await DB.load('dashboard');
      this.mode = params[0] || '';
      this.dashboard = dashboard;
      this.quiz = this.buildQuiz(baseQuiz, dashboard);
    }
    catch (e) { el.innerHTML = errorState(e.message); return; }
    this.idx = 0; this.answers = {}; this.graded = {}; this.showExp = {}; this.confidence = {}; this.struck = {}; this.ngn = {}; this.tool = 'none'; this.scorecardVisible = false; this.activityLogged = false;
    this.checkpointMode = this.mode === 'friday-checkpoint';
    this.openBook = !this.checkpointMode && (this.quiz.type === 'tutor' || this.quiz.type === 'study');
    this.quiz.questions.forEach(q => { this.marked[q.id] = q.marked; });
    this.startTimer();
    this.paint(el);
  },

  buildQuiz(baseQuiz, dashboard) {
    const quiz = JSON.parse(JSON.stringify(baseQuiz));
    const ap = dashboard.adaptive_prep || {};
    if (this.mode === 'adaptive-daily') {
      const topics = ap.daily_session?.topics || ap.focus_topics || [];
      quiz.name = "Today's Adaptive Prep Session";
      quiz.type = 'tutor';
      quiz.tutor_mode = true;
      quiz.timed = false;
      quiz.session_topics = topics;
      quiz.questions = this.scopedQuestions(quiz.questions, topics, ap.daily_session?.question_count || 3);
    } else if (this.mode === 'friday-checkpoint') {
      const topics = ap.friday_checkpoint?.topics || ap.focus_topics || [];
      const fridayPlan = (ap.week_plan || []).find(day => day.day === 'Friday') || {};
      quiz.name = 'Friday Checkpoint';
      quiz.type = 'friday-checkpoint';
      quiz.tutor_mode = false;
      quiz.timed = false;
      quiz.scope_topics = topics;
      quiz.scope_reason = fridayPlan.reason || ap.ai_reason || '';
      quiz.session_topics = topics;
      quiz.questions = this.scopedQuestions(quiz.questions, topics, topics.length || 3);
    } else if (this.mode === 'custom-plan') {
      const topics = AdaptivePrep.read().custom_quiz_topics || [];
      quiz.name = 'Custom Adaptive Prep Quiz';
      quiz.type = 'tutor';
      quiz.tutor_mode = true;
      quiz.timed = false;
      quiz.session_topics = topics;
      quiz.questions = this.scopedQuestions(quiz.questions, topics, Math.max(1, topics.length));
    }
    quiz.total_questions = quiz.questions.length;
    quiz.questions.forEach((q, i) => { q.number = i + 1; });
    return quiz;
  },

  scopedQuestions(questions, topics, limit) {
    const wanted = new Set((topics || []).map(t => String(t).toLowerCase()));
    const matches = questions.filter(q => wanted.has(String(q.subject).toLowerCase()));
    return (matches.length ? matches : questions).slice(0, limit);
  },

  startTimer() {
    clearInterval(this.timer); this.seconds = 0;
    this.timer = setInterval(() => {
      this.seconds++;
      const t = document.getElementById('quiz-timer');
      if (!t) { clearInterval(this.timer); return; }
      t.textContent = H.mmss(this.seconds);
    }, 1000);
  },

  gradedState(q) {
    if (q.ngn_type) {
      const st = this.ngn[q.id];
      if (!this.hasResponse(q)) return null;
      if (q.ngn_type === 'dropdown') return q.cloze.filter(c => c.id).every(c => st[c.id] === c.answer) ? 'Correct' : 'Incorrect';
      if (q.ngn_type === 'matrix') return q.matrix_rows.every(r => st[r.id] === r.answer) ? 'Correct' : 'Incorrect';
    }
    const sel = this.answers[q.id];
    if (sel == null) return null;
    return q.correct_answer_ids.includes(sel) ? 'Correct' : 'Incorrect';
  },

  hasResponse(q) {
    if (q.ngn_type) {
      const st = this.ngn[q.id] || {};
      if (q.ngn_type === 'dropdown') return q.cloze.filter(c => c.id).every(c => st[c.id]);
      if (q.ngn_type === 'matrix') return q.matrix_rows.every(r => st[r.id]);
    }
    return this.answers[q.id] != null;
  },

  renderNgn(q, revealed) {
    const hasConfidence = !!this.confidence[q.id];
    if (q.ngn_type === 'dropdown') {
      const st = this.ngn[q.id] || {};
      return `<div class="ngn-cloze">${q.cloze.map(c => {
        if (!c.id) return H.esc(c.text);
        const ok = revealed && st[c.id] === c.answer;
        const bad = revealed && st[c.id] && st[c.id] !== c.answer;
        return `${H.esc(c.text)}<select class="ngn-dd ${ok ? 'good' : bad ? 'bad' : ''}" data-cloze="${c.id}" ${revealed || !hasConfidence ? 'disabled' : ''}>
          <option value="">Select…</option>${c.options.map(o => `<option ${st[c.id] === o ? 'selected' : ''}>${H.esc(o)}</option>`).join('')}</select>`;
      }).join('')}</div>`;
    }
    if (q.ngn_type === 'matrix') {
      const st = this.ngn[q.id] || {};
      return `<table class="ngn-matrix"><thead><tr><th></th>${q.matrix_cols.map(c => `<th>${H.esc(c)}</th>`).join('')}</tr></thead>
        <tbody>${q.matrix_rows.map(r => `<tr><td class="lbl">${H.esc(r.label)}</td>${q.matrix_cols.map(c => {
          const sel = st[r.id] === c;
          const isAns = r.answer === c;
          let cls = ''; if (revealed && isAns) cls = 'good'; else if (revealed && sel && !isAns) cls = 'bad';
          return `<td class="ngn-cell ${cls}"><label><input type="radio" name="${r.id}" data-mrow="${r.id}" data-mcol="${H.esc(c)}" ${sel ? 'checked' : ''} ${revealed || !hasConfidence ? 'disabled' : ''}/></label></td>`;
        }).join('')}</tr>`).join('')}</tbody></table>`;
    }
    return '';
  },

  sessionRecords() {
    return (this.quiz?.questions || []).map((q) => {
      const state = this.gradedState(q);
      if (!state || !this.confidence[q.id]) return null;
      return {
        id: q.id,
        number: q.number,
        subject: q.subject,
        confidence: this.confidence[q.id],
        correct: state === 'Correct'
      };
    }).filter(Boolean);
  },

  confidenceLabel(value) {
    return ({ low: 'low', medium: 'medium', high: 'highly' }[value] || value);
  },

  calibrationText(q) {
    const conf = this.confidence[q.id];
    const correct = this.gradedState(q) === 'Correct';
    if (conf === 'high') return correct ? 'You were highly confident — and right.' : 'You were highly confident, but this was wrong.';
    if (conf === 'medium') return correct ? 'You were moderately confident — and right.' : 'You were moderately confident, but this was wrong.';
    return correct ? 'You chose low confidence — and this was right.' : 'You chose low confidence, and this was wrong.';
  },

  sourceCitation(q) {
    const first = q.resources && q.resources[0];
    if (first) return `<a href="${first.url}">${H.esc(first.title)}</a>`;
    return `BoardVitals Question Bank rationale, QID ${H.esc(q.id)}`;
  },

  aiChangeLine() {
    const records = this.sessionRecords();
    if (!records.length) return 'No session answers have been revealed yet — the next session plan is unchanged.';
    const bySubject = {};
    records.forEach(r => {
      bySubject[r.subject] = bySubject[r.subject] || { total: 0, missed: 0, highTotal: 0, highMissed: 0, recentHigh: [] };
      bySubject[r.subject].total++;
      if (!r.correct) bySubject[r.subject].missed++;
      if (r.confidence === 'high') {
        bySubject[r.subject].highTotal++;
        if (!r.correct) bySubject[r.subject].highMissed++;
        bySubject[r.subject].recentHigh.push(r);
      }
    });
    const highMissSubject = Object.entries(bySubject)
      .filter(([, v]) => v.highMissed > 0)
      .sort((a, b) => b[1].highMissed - a[1].highMissed || b[1].highTotal - a[1].highTotal)[0];
    if (highMissSubject) {
      const [subject, stats] = highMissSubject;
      const recent = stats.recentHigh.slice(-3);
      const missed = recent.filter(r => !r.correct).length;
      return `You've missed ${missed} of the last ${recent.length} high-confidence ${subject} questions — the next session is shifting toward ${subject}.`;
    }
    const missSubject = Object.entries(bySubject)
      .filter(([, v]) => v.missed > 0)
      .sort((a, b) => b[1].missed - a[1].missed || b[1].total - a[1].total)[0];
    if (missSubject) {
      const [subject, stats] = missSubject;
      return `You've missed ${stats.missed} of ${stats.total} ${subject} questions this session — the next session is adding more ${subject} review.`;
    }
    const latest = records[records.length - 1];
    const correct = records.filter(r => r.correct).length;
    return `You're accurate on ${correct} of ${records.length} revealed questions so far — the next session keeps mixed review with one spaced-review item from ${latest.subject}.`;
  },

  divergenceRows() {
    return this.sessionRecords().filter(r =>
      (r.confidence === 'high' && !r.correct) || (r.confidence === 'low' && r.correct)
    );
  },

  paintScorecard(el) {
    clearInterval(this.timer);
    const records = this.sessionRecords();
    const right = records.filter(r => r.correct).length;
    const wrong = records.length - right;
    const divergences = this.divergenceRows();
    const adaptiveDaily = this.mode === 'adaptive-daily';
    const fridayCheckpoint = this.mode === 'friday-checkpoint';
    const primary = adaptiveDaily ? 'Return to Dashboard' : fridayCheckpoint ? 'View Weekly Report' : 'See Results';
    el.innerHTML = `<div class="quiz-shell tq-scorecard">
      <div class="page-head">
        <div>
          <h1>Session Scorecard</h1>
          <p class="subtitle">${H.esc(this.quiz.name)} confidence calibration summary.</p>
        </div>
      </div>
      <div class="card">
        <div class="scoregrid">
          <div class="scorebox"><div class="num">${right}</div><div class="muted">Right</div></div>
          <div class="scorebox"><div class="num">${wrong}</div><div class="muted">Wrong</div></div>
        </div>
        <h3>Where confidence and accuracy diverged</h3>
        ${divergences.length ? `<ul>${divergences.map(r => `<li>Question ${r.number} · ${H.esc(r.subject)}: ${r.confidence === 'high' ? 'high confidence, but this was wrong' : 'low confidence, and this was right'}</li>`).join('')}</ul>` : '<p class="muted">No clear confidence/accuracy divergences in this session.</p>'}
        <div class="explanation">
          <h4>Next session change</h4>
          <p class="mb-0">${H.esc(this.aiChangeLine())}</p>
        </div>
        <div class="quiz-footer">
          <a class="btn btn-secondary" href="#/dashboard">Back to Dashboard</a>
          <button class="btn btn-primary" id="scorecard-primary">${H.esc(primary)}</button>
        </div>
      </div>
    </div>`;
    document.getElementById('scorecard-primary').onclick = () => this.handleScorecardPrimary(adaptiveDaily, fridayCheckpoint);
  },

  logActivity(score) {
    if (this.activityLogged) return;
    this.activityLogged = true;
    AdaptivePrep.recordActivity({
      mode: this.mode || this.quiz.type,
      quiz_name: this.quiz.name,
      topics: this.quiz.session_topics || [],
      score,
      calibration: this.sessionRecords()
    });
  },

  ambiguousOverlap() {
    const topics = new Set((this.quiz.session_topics || []).map(t => String(t).toLowerCase()));
    if (!topics.size || !this.dashboard?.adaptive_prep?.week_plan) return null;
    const today = AdaptivePrep.todayKey();
    return this.dashboard.adaptive_prep.week_plan.find(row =>
      String(row.day).toLowerCase() !== today &&
      topics.has(String(row.topic).toLowerCase()) &&
      !(AdaptivePrep.read().completed_days || []).includes(String(row.day).toLowerCase())
    ) || null;
  },

  handleScorecardPrimary(adaptiveDaily, fridayCheckpoint) {
    if (fridayCheckpoint) { location.hash = '#/dashboard/weekly-report'; return; }
    if (!adaptiveDaily && this.mode !== 'custom-plan') { location.hash = '#/results/' + this.quiz.id; return; }
    const overlap = this.ambiguousOverlap();
    if (!overlap) { location.hash = '#/dashboard'; return; }
    const pref = AdaptivePrep.read().early_completion_preference;
    if (pref === 'mark') { AdaptivePrep.markPlannedDayComplete(overlap.day); location.hash = '#/dashboard'; return; }
    if (pref === 'separate') { location.hash = '#/dashboard'; return; }
    this.showOverlapPrompt(overlap);
  },

  showOverlapPrompt(overlap) {
    const host = document.getElementById('modal-host');
    host.innerHTML = `<div class="overlay" id="overlay">
      <div class="modal">
        <div class="modal-head"><h3 style="margin:0">Plan overlap</h3><button class="icon-btn" id="overlap-x">${Icon.x}</button></div>
        <div class="modal-body"><p>This covered ${H.esc(overlap.day)}'s planned ${H.esc(overlap.topic)} — mark it complete, or keep these separate?</p></div>
        <div class="modal-foot">
          <button class="btn btn-secondary" id="keep-separate">Keep separate</button>
          <button class="btn btn-primary" id="mark-complete">Mark complete</button>
        </div>
      </div></div>`;
    const close = () => { host.innerHTML = ''; };
    document.getElementById('overlap-x').onclick = () => { close(); location.hash = '#/dashboard'; };
    document.getElementById('keep-separate').onclick = () => { close(); this.askAlwaysPreference('separate', overlap); };
    document.getElementById('mark-complete').onclick = () => {
      AdaptivePrep.markPlannedDayComplete(overlap.day);
      close();
      this.askAlwaysPreference('mark', overlap);
    };
  },

  askAlwaysPreference(choice) {
    const host = document.getElementById('modal-host');
    host.innerHTML = `<div class="overlay" id="overlay">
      <div class="modal">
        <div class="modal-head"><h3 style="margin:0">Save preference?</h3></div>
        <div class="modal-body"><p>Always handle early completion this way?</p></div>
        <div class="modal-foot">
          <button class="btn btn-secondary" id="pref-no">No</button>
          <button class="btn btn-primary" id="pref-yes">Yes</button>
        </div>
      </div></div>`;
    document.getElementById('pref-no').onclick = () => { host.innerHTML = ''; location.hash = '#/dashboard'; };
    document.getElementById('pref-yes').onclick = () => {
      AdaptivePrep.setEarlyCompletionPreference(choice);
      host.innerHTML = '';
      location.hash = '#/dashboard';
    };
  },

  paint(el) {
    if (this.scorecardVisible) { this.paintScorecard(el); return; }
    const q = this.quiz.questions[this.idx];
    const total = this.quiz.questions.length;
    const selected = this.answers[q.id];
    const checked = this.graded[q.id];
    const revealed = checked && (this.showExp[q.id] || !this.openBook);
    const gradedState = this.gradedState(q);
    const hasConfidence = !!this.confidence[q.id];

    el.innerHTML = `
      <div class="quiz-shell">
        <div class="tq-header">
          <div class="tq-title">
            <span class="name">${H.esc(this.quiz.name)} ${this.checkpointMode ? "<span class=\"pill\">This week's plan</span>" : ''}</span>
            <span class="count">${q.number} of ${total} questions · <span id="quiz-timer">${H.mmss(this.seconds)}</span></span>
          </div>
          <div class="tq-tools">
            <button class="tq-tool ${this.tool === 'highlight' ? 'active' : ''}" data-tool="highlight">${Icon.book} Highlight</button>
            <button class="tq-tool ${this.tool === 'strikeout' ? 'active' : ''}" data-tool="strikeout">${Icon.x} Strikeout</button>
            <button class="tq-tool" id="tool-calc">${Icon.target} Calculator</button>
            <button class="tq-tool" id="tool-labs">${Icon.list} Lab Values</button>
            <button class="tq-tool" id="tool-note">${Icon.book} Note</button>
            <button class="tq-tool ${this.marked[q.id] ? 'active' : ''}" id="mark-btn">${Icon.flag} Mark</button>
          </div>
        </div>

        <div class="progress" style="border-radius:0;margin:0"><span style="width:${(this.idx + 1) / total * 100}%"></span></div>

        ${checked ? `<div class="tq-review-bar">
          <span>Review Mode</span>
          <button class="btn btn-secondary" id="back-to-results" style="padding:4px 12px">Back To Results</button>
        </div>` : ''}

        ${this.checkpointMode ? `<div class="tq-scope">This checkpoint covers this week's focus: ${H.esc((this.quiz.scope_topics || []).join(', '))}${this.quiz.scope_reason ? ` — ${H.esc(this.quiz.scope_reason)}` : ''}</div>` : ''}

        <div class="card" style="border-radius:0 0 8px 8px">
          <div class="between">
            <div class="q-meta">
              <span class="pill muted">${H.esc(q.subject)}</span>
              <span class="pill ${q.difficulty_level === 'hard' ? 'risk' : q.difficulty_level === 'easy' ? 'good' : 'warn'} tag-mode">${q.difficulty_level}</span>
            </div>
          </div>

          <button class="btn btn-secondary" id="figure-media" style="padding:5px 12px;margin-bottom:10px">${Icon.book} Figure/Media</button>
          <p class="q-stem" id="q-stem">${H.esc(q.lead_in)}</p>

          <div class="tq-confidence">
            <h4>How confident are you?</h4>
            <div class="tq-conf-opts">
              ${['low', 'medium', 'high'].map(c => `<button class="tq-conf-opt ${this.confidence[q.id] === c ? 'active' : ''}" data-conf="${c}" ${checked || this.hasResponse(q) ? 'disabled' : ''}>${c[0].toUpperCase() + c.slice(1)}</button>`).join('')}
            </div>
          </div>

          <div id="answers">
            ${q.ngn_type ? this.renderNgn(q, revealed) : q.answers.map((a, i) => {
              const isSel = selected === a.id;
              let cls = 'answer';
              if (!hasConfidence && !revealed) cls += ' locked';
              if (this.struck[q.id]?.has(a.id)) cls += ' struck';
              if (revealed) {
                if (q.correct_answer_ids.includes(a.id)) cls += ' correct';
                else if (isSel) cls += ' incorrect';
              } else if (isSel) cls += ' selected';
              return `<div class="${cls}" id="multiple_choice_option_${i}" data-aid="${a.id}">
                <span class="a-letter">${H.letter(a.choice)}</span>
                <span class="a-text">${H.esc(a.plain_name)}</span>
                ${revealed && q.correct_answer_ids.includes(a.id) ? `<span class="peer">${Icon.check}</span>` : ''}
              </div>`;
            }).join('')}
          </div>

          ${checked ? `<div class="tq-graded ${gradedState === 'Correct' ? 'good' : 'risk'}">Graded Response: ${gradedState}</div>` : ''}

          ${this.openBook && !checked
            ? `<button class="btn btn-secondary mt-16" id="check-answer" ${this.hasResponse(q) ? '' : 'disabled'}>Check Answer</button>`
            : ''}

          ${checked && this.openBook
            ? `<button class="btn btn-secondary mt-16" id="toggle-exp">${this.showExp[q.id] ? 'Close Explanation' : 'Show Explanation'}</button>`
            : ''}

          ${revealed ? `<div class="tq-explwrap">
            <div>
              <div class="explanation">
                <h4>${q.ngn_type ? 'Rationale' : 'Correct Answer: ' + q.answers.filter(a => q.correct_answer_ids.includes(a.id)).map(a => H.letter(a.choice)).join(', ')}</h4>
                <p class="mb-0">${H.esc(q.plain_explanation)}</p>
                <p class="mt-8 mb-0"><b>Source:</b> ${this.sourceCitation(q)}</p>
                <div class="tq-calibration">${H.esc(this.calibrationText(q))}</div>
                <p class="tq-ai-change mb-0">${H.esc(this.aiChangeLine())}</p>
              </div>
            </div>
            <div class="tq-side">
              <div class="tq-feedback">
                <a href="#" class="qfeedback-link">Question Feedback</a>
                <div class="muted" style="font-size:12px;margin:4px 0 8px">QID: ${q.id}</div>
                <div style="font-size:12.5px;font-weight:600;color:var(--navy-900)">Rate the quality of this question</div>
                <div class="stars" id="q-stars">${[1,2,3,4,5].map(n => `<span data-star="${n}">☆</span>`).join('')}</div>
                <textarea class="qfeedback-text" placeholder="Tell us why you rated this way (optional)..."></textarea>
                <button class="btn btn-secondary" id="qfeedback-submit" style="padding:5px 14px">Submit</button>
              </div>
              ${!q.ngn_type ? `<div class="stat tq-peer">
                <h5>Peer Comparison</h5>
                ${q.answers.map(a => `<div class="pbar">
                  <span class="a-letter" style="width:22px;height:22px;font-size:11px">${H.letter(a.choice)}</span>
                  <span class="ptrack"><span class="${q.correct_answer_ids.includes(a.id) ? 'good' : 'other'}" style="width:${a.peer_response_count}%"></span></span>
                  <span style="width:34px;text-align:right">${a.peer_response_count}%</span>
                </div>`).join('')}
              </div>` : ''}
              <div class="stat"><h5>Response Time:</h5><span class="muted">${H.mmss(Math.round((1 - q.p_value) * 120) + 30)}</span></div>
              <div class="stat"><h5>Difficulty level:</h5><span class="muted" style="text-transform:capitalize">${q.difficulty_level}</span></div>
            </div>
          </div>` : ''}

          <div class="quiz-footer">
            <button class="btn btn-secondary" id="prev" ${this.idx === 0 ? 'disabled' : ''}>Previous</button>
            <button class="btn btn-ghost" id="pause">Pause</button>
            ${this.idx < total - 1
              ? `<button class="btn btn-primary" id="next_question_button">Next</button>`
              : `<button class="btn btn-primary" id="grade_quiz_button">Grade</button>`}
          </div>
        </div>

        <div class="card mt-16">
          <div class="between"><h3 style="margin:0">Question List</h3>
            <small class="muted">${Object.keys(this.answers).length}/${total} answered</small></div>
          <div class="q-palette" id="palette">
            ${this.quiz.questions.map((qq, i) => {
              let c = '';
              if (i === this.idx) c = 'current';
              else if (this.answers[qq.id] != null) c = 'done';
              return `<button data-jump="${i}" class="${c}">${i + 1}</button>`;
            }).join('')}
          </div>
        </div>
      </div>`;

    this.wire(el);
  },

  wire(el) {
    const q = this.quiz.questions[this.idx];

    el.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => {
      this.tool = this.tool === b.dataset.tool ? 'none' : b.dataset.tool; this.paint(el);
    });
    el.querySelectorAll('[data-conf]').forEach(b => b.onclick = () => {
      if (this.graded[q.id]) return;
      this.confidence[q.id] = b.dataset.conf;
      this.paint(el);
    });
    ['tool-calc', 'tool-labs', 'tool-note'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.onclick = () => toast(btn.textContent.trim() + ' is mocked');
    });
    document.getElementById('mark-btn').onclick = () => {
      this.marked[q.id] = !this.marked[q.id];
      toast(this.marked[q.id] ? 'Question marked' : 'Mark removed'); this.paint(el);
    };

    el.querySelectorAll('[data-aid]').forEach(a => a.onclick = () => {
      const aid = parseInt(a.dataset.aid, 10);
      if (!this.confidence[q.id]) {
        toast('Rate confidence before selecting an answer');
        return;
      }
      if (this.tool === 'strikeout') {
        this.struck[q.id] = this.struck[q.id] || new Set();
        this.struck[q.id].has(aid) ? this.struck[q.id].delete(aid) : this.struck[q.id].add(aid);
        this.paint(el); return;
      }
      if (this.graded[q.id] && this.openBook) return; // locked after grading in open-book mode
      this.answers[q.id] = aid;
      this.graded[q.id] = true;
      if (this.openBook) this.showExp[q.id] = true;
      this.paint(el);
    });

    // NGN inputs (dropdown cloze + matrix grid)
    el.querySelectorAll('[data-cloze]').forEach(sel => sel.onchange = () => {
      if (!this.confidence[q.id]) { toast('Rate confidence before selecting an answer'); this.paint(el); return; }
      this.ngn[q.id] = this.ngn[q.id] || {};
      this.ngn[q.id][sel.dataset.cloze] = sel.value;
      if (this.hasResponse(q)) { this.graded[q.id] = true; if (this.openBook) this.showExp[q.id] = true; }
      this.paint(el);
    });
    el.querySelectorAll('[data-mrow]').forEach(r => r.onchange = () => {
      if (!this.confidence[q.id]) { toast('Rate confidence before selecting an answer'); this.paint(el); return; }
      this.ngn[q.id] = this.ngn[q.id] || {};
      this.ngn[q.id][r.dataset.mrow] = r.dataset.mcol;
      if (this.hasResponse(q)) { this.graded[q.id] = true; if (this.openBook) this.showExp[q.id] = true; }
      this.paint(el);
    });

    if (this.tool === 'highlight') {
      const stem = document.getElementById('q-stem');
      if (stem) {
        stem.style.cursor = 'text';
        stem.onmouseup = () => {
          const sel = window.getSelection();
          if (sel && sel.toString().length) {
            document.execCommand('hiliteColor', false, '#fde68a');
            toast('Highlight saved');
            sel.removeAllRanges();
          }
        };
      }
    }

    document.getElementById('check-answer')?.addEventListener('click', () => {
      openModal({
        title: 'Check Answer',
        body: `<p>Your first response is used for grading in Tutor mode. You can attempt the question again in this quiz, but your graded response will not change.</p>`,
        confirmLabel: 'Check Answer',
        onConfirm: () => { this.graded[q.id] = true; this.showExp[q.id] = true; this.paint(el); }
      });
    });
    document.getElementById('toggle-exp')?.addEventListener('click', () => {
      this.showExp[q.id] = !this.showExp[q.id]; this.paint(el);
    });

    document.getElementById('prev')?.addEventListener('click', () => { this.idx = Math.max(0, this.idx - 1); this.paint(el); });
    document.getElementById('pause')?.addEventListener('click', () => toast('Quiz paused (mocked)'));
    document.getElementById('next_question_button')?.addEventListener('click', () => { this.idx++; this.paint(el); });
    document.getElementById('grade_quiz_button')?.addEventListener('click', () => this.gradeModal());
    el.querySelectorAll('[data-jump]').forEach(b => b.onclick = () => { this.idx = +b.dataset.jump; this.paint(el); });

    // review-mode + figure/media + question feedback
    document.getElementById('back-to-results')?.addEventListener('click', () => { location.hash = '#/results/' + this.quiz.id; });
    document.getElementById('figure-media')?.addEventListener('click', () => toast('Figure / Media viewer is mocked'));
    document.getElementById('qfeedback-submit')?.addEventListener('click', () => toast('Thanks for your feedback', 'success'));
    el.querySelectorAll('#q-stars [data-star]').forEach(s => s.onclick = () => {
      const n = +s.dataset.star;
      el.querySelectorAll('#q-stars [data-star]').forEach(x => x.textContent = (+x.dataset.star <= n) ? '★' : '☆');
    });
  },

  gradeModal() {
    const adaptiveDaily = this.mode === 'adaptive-daily';
    const fridayCheckpoint = this.mode === 'friday-checkpoint';
    openModal({
      title: this.quiz.name,
      body: `<p>${fridayCheckpoint ? 'Friday Checkpoint is complete. Review your session scorecard before opening the weekly report.' : 'This session is complete. Review your confidence and accuracy scorecard.'}</p>`,
      confirmLabel: 'View Scorecard',
      onConfirm: () => {
        clearInterval(this.timer);
        this.quiz.questions.forEach(q => { if (this.hasResponse(q)) this.graded[q.id] = true; });
        const score = this.score();
        this.logActivity(score);
        if (fridayCheckpoint) {
          AdaptivePrep.markCheckpointComplete(score);
        }
        this.scorecardVisible = true;
        this.paint(document.getElementById('view-content'));
      }
    });
    // align with the maestro element id for the modal confirm
    document.getElementById('modal-ok').id = 'grade_quiz_modal_grade_quiz_button';
  },

  score() {
    if (!this.quiz || !this.quiz.questions.length) return 0;
    let correct = 0;
    this.quiz.questions.forEach(q => { if (this.gradedState(q) === 'Correct') correct++; });
    return Math.round((correct / this.quiz.questions.length) * 100);
  }
};
