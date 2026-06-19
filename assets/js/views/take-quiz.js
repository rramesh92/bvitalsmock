window.Views = window.Views || {};
window.Views['take-quiz'] = {
  quiz: null, idx: 0, answers: {}, graded: {}, showExp: {}, tool: 'none', struck: {}, marked: {}, seconds: 0, timer: null,

  async render(el) {
    if (!document.getElementById('css-take-quiz')) {
      const s = document.createElement('style'); s.id = 'css-take-quiz';
      s.textContent = `
        .tq-header{background:var(--navy-900);color:#fff;border-radius:8px 8px 0 0;padding:12px 16px}
        .tq-title{display:flex;align-items:center;justify-content:space-between;gap:12px}
        .tq-title .name{font-weight:700;font-size:15px}
        .tq-title .count{font-size:13px;color:#cdd8e2}
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
    try { this.quiz = await DB.load('quiz'); }
    catch (e) { el.innerHTML = errorState(e.message); return; }
    this.idx = 0; this.answers = {}; this.graded = {}; this.showExp = {}; this.struck = {}; this.ngn = {}; this.tool = 'none';
    this.openBook = this.quiz.type === 'tutor' || this.quiz.type === 'study';
    this.quiz.questions.forEach(q => { this.marked[q.id] = q.marked; });
    this.startTimer();
    this.paint(el);
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
    if (q.ngn_type === 'dropdown') {
      const st = this.ngn[q.id] || {};
      return `<div class="ngn-cloze">${q.cloze.map(c => {
        if (!c.id) return H.esc(c.text);
        const ok = revealed && st[c.id] === c.answer;
        const bad = revealed && st[c.id] && st[c.id] !== c.answer;
        return `${H.esc(c.text)}<select class="ngn-dd ${ok ? 'good' : bad ? 'bad' : ''}" data-cloze="${c.id}" ${revealed ? 'disabled' : ''}>
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
          return `<td class="ngn-cell ${cls}"><label><input type="radio" name="${r.id}" data-mrow="${r.id}" data-mcol="${H.esc(c)}" ${sel ? 'checked' : ''} ${revealed ? 'disabled' : ''}/></label></td>`;
        }).join('')}</tr>`).join('')}</tbody></table>`;
    }
    return '';
  },

  paint(el) {
    const q = this.quiz.questions[this.idx];
    const total = this.quiz.questions.length;
    const selected = this.answers[q.id];
    const checked = this.graded[q.id];
    const revealed = checked && (this.showExp[q.id] || !this.openBook);
    const gradedState = this.gradedState(q);

    el.innerHTML = `
      <div class="quiz-shell">
        <div class="tq-header">
          <div class="tq-title">
            <span class="name">${H.esc(this.quiz.name)}</span>
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

        <div class="card" style="border-radius:0 0 8px 8px">
          <div class="between">
            <div class="q-meta">
              <span class="pill muted">${H.esc(q.subject)}</span>
              <span class="pill ${q.difficulty_level === 'hard' ? 'risk' : q.difficulty_level === 'easy' ? 'good' : 'warn'} tag-mode">${q.difficulty_level}</span>
            </div>
          </div>

          <button class="btn btn-secondary" id="figure-media" style="padding:5px 12px;margin-bottom:10px">${Icon.book} Figure/Media</button>
          <p class="q-stem" id="q-stem">${H.esc(q.lead_in)}</p>

          <div id="answers">
            ${q.ngn_type ? this.renderNgn(q, revealed) : q.answers.map((a, i) => {
              const isSel = selected === a.id;
              let cls = 'answer';
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
                ${q.resources?.length ? `<p class="mt-8 mb-0"><b>References:</b> ${q.resources.map(r => `<a href="${r.url}">${H.esc(r.title)}</a>`).join(', ')}</p>` : ''}
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
      if (this.tool === 'strikeout') {
        this.struck[q.id] = this.struck[q.id] || new Set();
        this.struck[q.id].has(aid) ? this.struck[q.id].delete(aid) : this.struck[q.id].add(aid);
        this.paint(el); return;
      }
      if (this.graded[q.id] && this.openBook) return; // locked after grading in open-book mode
      this.answers[q.id] = aid;
      if (!this.openBook) this.graded[q.id] = true; // closed-book: immediate feedback
      this.paint(el);
    });

    // NGN inputs (dropdown cloze + matrix grid)
    el.querySelectorAll('[data-cloze]').forEach(sel => sel.onchange = () => {
      this.ngn[q.id] = this.ngn[q.id] || {};
      this.ngn[q.id][sel.dataset.cloze] = sel.value;
      if (!this.openBook && this.hasResponse(q)) this.graded[q.id] = true;
      this.paint(el);
    });
    el.querySelectorAll('[data-mrow]').forEach(r => r.onchange = () => {
      this.ngn[q.id] = this.ngn[q.id] || {};
      this.ngn[q.id][r.dataset.mrow] = r.dataset.mcol;
      if (!this.openBook && this.hasResponse(q)) this.graded[q.id] = true;
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
    openModal({
      title: this.quiz.name,
      body: `<p>The Quiz has been completed. Submit to see your results.</p>`,
      confirmLabel: 'Submit',
      onConfirm: () => { clearInterval(this.timer); location.hash = '#/results/' + this.quiz.id; }
    });
    // align with the maestro element id for the modal confirm
    document.getElementById('modal-ok').id = 'grade_quiz_modal_grade_quiz_button';
  }
};
