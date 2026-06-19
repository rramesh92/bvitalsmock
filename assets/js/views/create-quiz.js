window.Views = window.Views || {};
window.Views['create-quiz'] = {
  state: {
    mode: 'test', status: 'All', filterMarked: false, keyword: '',
    difficulty: new Set(), subjects: new Set(), count: 10, timed: false, name: ''
  },

  async render(el) {
    if (!document.getElementById('css-create-quiz')) {
      const s = document.createElement('style'); s.id = 'css-create-quiz';
      s.textContent = `
        .cq-modes{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .cq-bookcard{border:1px solid var(--line);border-radius:8px;padding:16px}
        .cq-bookcard .cq-book-label{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:10px}
        .cq-modeopt{padding:10px 0}
        .cq-modeopt + .cq-modeopt{border-top:1px solid var(--line);margin-top:6px}
        .cq-radio{display:flex;align-items:center;gap:9px;cursor:pointer;font-weight:700;color:var(--navy-900)}
        .cq-radio .dot{width:18px;height:18px;border-radius:50%;border:2px solid #b9c4cf;flex:0 0 18px;position:relative}
        .cq-modeopt.on .cq-radio .dot{border-color:var(--info)}
        .cq-modeopt.on .cq-radio .dot::after{content:"";position:absolute;inset:3px;border-radius:50%;background:var(--info)}
        .cq-desc{list-style:disc;margin:8px 0 0 28px;padding:0;color:var(--muted);font-size:12.5px;line-height:1.5}
        .cq-desc em{font-style:italic}
        .cq-chips{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
        .cq-chip{border:1px solid var(--line);background:#fff;border-radius:6px;padding:7px 12px;font-size:13px;font-weight:600;color:var(--navy-900);cursor:pointer}
        .cq-chip.on{background:var(--info);border-color:var(--info);color:#fff}
        .cq-chip:disabled{opacity:.45;cursor:not-allowed}
        .cq-check{display:inline-flex;align-items:center;gap:7px;cursor:pointer;font-size:13px;font-weight:600;color:var(--navy-900)}
        .cq-check .box{width:16px;height:16px;border:2px solid #b9c4cf;border-radius:3px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;color:#fff}
        .cq-check.on .box{background:var(--info);border-color:var(--info)}
        .cq-subjects{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-top:10px}
        .cq-subj{display:flex;align-items:center;gap:8px;padding:6px 2px;cursor:pointer;font-size:13.5px;color:var(--navy-900);border-bottom:1px solid #f0f3f6}
        .cq-subj .box{width:16px;height:16px;border:2px solid #b9c4cf;border-radius:3px;flex:0 0 16px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;color:#fff}
        .cq-subj.on .box{background:var(--info);border-color:var(--info)}
        .cq-presets{display:flex;align-items:center;gap:0}
        .cq-presets .cq-chip{border-radius:0}
        .cq-presets .cq-chip:first-child{border-radius:6px 0 0 6px}
        .cq-presets .cq-chip:last-child{border-radius:0 6px 6px 0;border-left:0}
        .cq-numwrap{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
        .cq-numinput{width:90px;padding:8px 10px;border:1px solid var(--info);border-radius:6px;font-size:15px;font-weight:700;color:var(--navy-900)}
        .cq-nameinput{width:100%;max-width:420px;padding:9px 12px;border:1px solid var(--line);border-radius:6px;font-size:14px}
      `;
      document.head.appendChild(s);
    }

    el.innerHTML = skeleton(6);
    let o;
    try { o = await DB.load('quiz-create-options'); }
    catch (e) { el.innerHTML = errorState(e.message); return; }
    const st = this.state;
    if (!st.name) st.name = `${App.currentBank().name} ${H.date(new Date().toISOString())}`;

    const closed = o.modes.filter(m => m.book === 'closed');
    const open = o.modes.filter(m => m.book === 'open');
    const modeOpt = m => `
      <div class="cq-modeopt ${st.mode === m.key ? 'on' : ''}" data-mode="${m.key}">
        <span class="cq-radio"><span class="dot"></span>${m.label}</span>
        <ul class="cq-desc">${m.description.map(d => `<li>${d}</li>`).join('')}</ul>
      </div>`;

    el.innerHTML = `
      <div class="page-head"><div><h1>Create Quiz</h1>
        <p class="subtitle">${H.esc(App.currentBank().name)}</p></div></div>

      <div class="section-label">Quiz Mode</div>
      <div class="panel-card">
        <div class="cq-modes" id="cq-modes">
          <div class="cq-bookcard"><div class="cq-book-label">Closed Book</div>${closed.map(modeOpt).join('')}</div>
          <div class="cq-bookcard"><div class="cq-book-label">Open Book</div>${open.map(modeOpt).join('')}</div>
        </div>
      </div>

      <div class="section-label">Question Status</div>
      <div class="panel-card">
        <div class="cq-chips" id="cq-status">
          ${o.question_statuses.map(q => `<button class="cq-chip ${st.status === q.key ? 'on' : ''}" data-status="${q.key}">${q.label} (${q.count})</button>`).join('')}
          <span style="width:1px;height:24px;background:var(--line);margin:0 4px"></span>
          <label class="cq-check ${st.filterMarked ? 'on' : ''}" id="cq-marked"><span class="box">${st.filterMarked ? '✓' : ''}</span>Marked (${o.marked_count})</label>
          <input id="cq-keyword" placeholder="Keyword search" value="${H.esc(st.keyword)}"
            style="margin-left:auto;padding:7px 10px;border:1px solid var(--line);border-radius:6px;font-size:13px;width:200px">
        </div>
      </div>

      <div class="section-label">Difficulty Level</div>
      <div class="panel-card">
        <div class="cq-chips" id="cq-difficulty">
          ${o.difficulty_levels.map(d => `<button class="cq-chip ${(d.key === 'all' ? st.difficulty.size === 0 : st.difficulty.has(d.key)) ? 'on' : ''}" data-diff="${d.key}" ${d.count ? '' : 'disabled'}>${d.label} (${d.count})</button>`).join('')}
        </div>
      </div>

      <div class="section-label">Select Subject</div>
      <div class="panel-card">
        <div class="cq-chips">
          <label class="cq-check ${st.subjects.size === 0 ? 'on' : ''}" id="cq-all-subjects"><span class="box">${st.subjects.size === 0 ? '✓' : ''}</span>All Subjects</label>
          <button class="cq-chip" id="cq-clear" style="margin-left:auto">Clear</button>
        </div>
        <div class="cq-subjects" id="cq-subjects">
          ${o.subjects.map(s => `<label class="cq-subj ${st.subjects.has(String(s.id)) ? 'on' : ''}" data-subj="${s.id}">
            <span class="box">${st.subjects.has(String(s.id)) ? '✓' : ''}</span>${H.esc(s.name)} (${s.available})</label>`).join('')}
        </div>
      </div>

      <div class="section-label">Number of Questions (Max ${o.max_questions})</div>
      <div class="panel-card">
        <div class="muted" style="font-size:12.5px;font-weight:700;margin-bottom:10px">Questions Available (${o.subjects.reduce((a, s) => a + s.available, 0)})</div>
        <div class="cq-numwrap">
          <div class="cq-presets" id="cq-presets">
            ${o.question_total_presets.map(n => `<button class="cq-chip ${st.count === n ? 'on' : ''}" data-preset="${n}">${n}</button>`).join('')}
          </div>
          <input type="number" id="cq-count" class="cq-numinput" min="1" max="${o.max_questions}" value="${st.count}">
          <small class="muted">10 questions = 1 CME Credit</small>
        </div>
      </div>

      <div class="section-label">Timed Mode</div>
      <div class="panel-card">
        <div class="cq-presets" id="cq-timed">
          <button class="cq-chip ${!st.timed ? 'on' : ''}" data-timed="false">Untimed</button>
          <button class="cq-chip ${st.timed ? 'on' : ''}" data-timed="true">Timed</button>
        </div>
      </div>

      <div class="section-label">Quiz Name</div>
      <div class="panel-card">
        <input id="cq-name" class="cq-nameinput" value="${H.esc(st.name)}" placeholder="Quiz name">
      </div>

      <div style="margin-top:18px">
        <button class="btn btn-primary btn-lg" id="start-quiz">${st.mode === 'adaptive' ? 'Start CAT Exam' : 'Start Quiz'}</button>
      </div>`;

    this.wire(el, o);
  },

  wire(el, o) {
    const st = this.state;
    const refreshStart = () => {
      document.getElementById('start-quiz').textContent = st.mode === 'adaptive' ? 'Start CAT Exam' : 'Start Quiz';
    };

    el.querySelectorAll('[data-mode]').forEach(m => m.onclick = () => {
      st.mode = m.dataset.mode;
      el.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('on', x === m));
      refreshStart();
    });

    el.querySelectorAll('#cq-status [data-status]').forEach(b => b.onclick = () => {
      st.status = b.dataset.status;
      el.querySelectorAll('#cq-status [data-status]').forEach(x => x.classList.toggle('on', x === b));
    });
    document.getElementById('cq-marked').onclick = () => {
      st.filterMarked = !st.filterMarked;
      const m = document.getElementById('cq-marked');
      m.classList.toggle('on', st.filterMarked);
      m.querySelector('.box').textContent = st.filterMarked ? '✓' : '';
    };
    document.getElementById('cq-keyword').oninput = (e) => { st.keyword = e.target.value; };

    const diffWrap = document.getElementById('cq-difficulty');
    diffWrap.querySelectorAll('[data-diff]').forEach(b => b.onclick = () => {
      const k = b.dataset.diff;
      if (k === 'all') st.difficulty.clear();
      else { st.difficulty.has(k) ? st.difficulty.delete(k) : st.difficulty.add(k); }
      diffWrap.querySelectorAll('[data-diff]').forEach(x => {
        const on = x.dataset.diff === 'all' ? st.difficulty.size === 0 : st.difficulty.has(x.dataset.diff);
        x.classList.toggle('on', on);
      });
    });

    const subjWrap = document.getElementById('cq-subjects');
    const allBtn = document.getElementById('cq-all-subjects');
    const syncSubjects = () => {
      subjWrap.querySelectorAll('[data-subj]').forEach(s => {
        const on = st.subjects.has(s.dataset.subj);
        s.classList.toggle('on', on);
        s.querySelector('.box').textContent = on ? '✓' : '';
      });
      const allOn = st.subjects.size === 0;
      allBtn.classList.toggle('on', allOn);
      allBtn.querySelector('.box').textContent = allOn ? '✓' : '';
    };
    subjWrap.querySelectorAll('[data-subj]').forEach(s => s.onclick = () => {
      const id = s.dataset.subj;
      st.subjects.has(id) ? st.subjects.delete(id) : st.subjects.add(id);
      syncSubjects();
    });
    allBtn.onclick = () => { st.subjects.clear(); syncSubjects(); };
    document.getElementById('cq-clear').onclick = () => { st.subjects.clear(); syncSubjects(); };

    const countInput = document.getElementById('cq-count');
    const presets = document.getElementById('cq-presets');
    const syncCount = () => {
      presets.querySelectorAll('[data-preset]').forEach(x => x.classList.toggle('on', +x.dataset.preset === st.count));
      countInput.value = st.count;
    };
    presets.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => { st.count = +b.dataset.preset; syncCount(); });
    countInput.oninput = (e) => {
      let v = parseInt(e.target.value, 10) || 0;
      if (v > o.max_questions) v = o.max_questions;
      st.count = v;
      presets.querySelectorAll('[data-preset]').forEach(x => x.classList.toggle('on', +x.dataset.preset === st.count));
    };

    const timed = document.getElementById('cq-timed');
    timed.querySelectorAll('[data-timed]').forEach(b => b.onclick = () => {
      st.timed = b.dataset.timed === 'true';
      timed.querySelectorAll('[data-timed]').forEach(x => x.classList.toggle('on', x === b));
    });

    document.getElementById('cq-name').oninput = (e) => { st.name = e.target.value; };

    document.getElementById('start-quiz').onclick = () => {
      toast(st.mode === 'adaptive' ? 'CAT Exam started' : 'Quiz started', 'success');
      location.hash = '#/take-quiz/90042';
    };
  }
};
