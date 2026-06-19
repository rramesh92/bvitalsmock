/* Admin Question Management — questions table (search/filter/paginate),
   create/edit form (Details + Answers w/ validation + preview), CSV upload mode.
   Models javascript/app/pages/QuestionManagement/*. Self-contained mock. */
window.Views = window.Views || {};
window.Views['question-management'] = {
  mode: 'list',          // 'list' | 'form' | 'upload'
  editingId: null,       // when form opened on an existing question
  page: 1,
  perPage: 8,
  search: '',
  subject: 'all',
  form: null,            // working form state in 'form' mode

  injectCss() {
    if (document.getElementById('css-question-management')) return;
    const s = document.createElement('style');
    s.id = 'css-question-management';
    s.textContent = `
      .qm-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px}
      .qm-toolbar .qm-search{flex:1;min-width:200px;position:relative}
      .qm-toolbar .qm-search input{width:100%;padding:9px 12px 9px 34px;border:1px solid var(--line);border-radius:8px;font-size:14px}
      .qm-toolbar .qm-search svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--muted)}
      .qm-toolbar select{padding:9px 12px;border:1px solid var(--line);border-radius:8px;font-size:14px;background:#fff;min-width:170px}
      .qm-stem{max-width:420px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:var(--navy-900)}
      .qm-subj{display:inline-block;font-size:11px;background:var(--teal-050);color:var(--info);border-radius:5px;padding:2px 7px;margin:1px 3px 1px 0;white-space:nowrap}
      .qm-rowact{display:flex;gap:6px;justify-content:flex-end}
      .qm-pager{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 4px;flex-wrap:wrap}
      .qm-pager .pg-info{font-size:12.5px;color:var(--muted)}
      .qm-pager .pg-ctrl{display:flex;align-items:center;gap:8px}
      .qm-pager .pg-ctrl button{min-width:84px}
      .qm-form-sec{margin-bottom:18px}
      .qm-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
      .qm-err{color:var(--risk);font-size:12px;margin-top:4px;display:flex;gap:5px;align-items:center}
      .qm-err svg{width:13px;height:13px}
      .qm-field label{display:block;font-weight:600;font-size:13px;color:var(--navy-900);margin-bottom:5px}
      .qm-field .req{color:var(--risk);margin-left:2px}
      .qm-field input[type=text],.qm-field textarea,.qm-field select{width:100%;border:1px solid var(--line);border-radius:8px;padding:9px 11px;font-size:14px;font-family:inherit}
      .qm-field textarea{resize:vertical;min-height:74px}
      .qm-field.invalid input,.qm-field.invalid textarea,.qm-field.invalid select{border-color:var(--risk)}
      .qm-count{font-size:11px;color:var(--muted);text-align:right;margin-top:3px}
      .qm-subj-multi{display:flex;flex-wrap:wrap;gap:7px}
      .qm-subj-multi label{display:inline-flex;align-items:center;gap:6px;font-weight:500;font-size:12.5px;border:1px solid var(--line);border-radius:18px;padding:5px 11px;cursor:pointer;background:#fff}
      .qm-subj-multi label.on{background:var(--teal-050);border-color:var(--info);color:var(--info)}
      .qm-answer{border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin-bottom:10px;background:#fbfcfd}
      .qm-answer .ah{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}
      .qm-answer .ah b{color:var(--navy-900)}
      .qm-answer.correct{border-color:var(--good);background:#f3f8ec}
      .qm-correct{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--good);cursor:pointer}
      .qm-dropzone{border:2px dashed var(--line);border-radius:12px;padding:34px;text-align:center;background:#fafbfc;cursor:pointer}
      .qm-dropzone:hover{border-color:var(--info);background:var(--teal-050)}
      .qm-dropzone svg{width:34px;height:34px;color:var(--info)}
      .qm-dropzone h4{margin:8px 0 4px;color:var(--navy-900)}
      .qm-dropzone p{margin:0;color:var(--muted);font-size:13px}
      .qm-instr{font-size:13px;color:var(--navy-900);line-height:1.7;padding-left:18px;margin:8px 0}
      .qm-prev-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px}
      .qm-prev-meta .mlabel{font-size:11px;text-transform:uppercase;letter-spacing:.03em;color:var(--muted)}
      .qm-prev-meta .mval{font-weight:600;color:var(--navy-900)}
      .qm-prev-ans{border:1px solid var(--line);border-radius:8px;padding:9px 12px;margin-bottom:7px}
      .qm-prev-ans.correct{border-color:var(--good);background:#f3f8ec}
      @media(max-width:760px){.qm-form-grid,.qm-prev-meta{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  },

  async render(el) {
    this.injectCss();
    el.innerHTML = skeleton(6);
    let data;
    try { data = await DB.load('questions-admin'); }
    catch (e) { el.innerHTML = errorState(e.message); return; }
    this.data = data;
    this.el = el;
    this.draw();
  },

  draw() {
    if (this.mode === 'form') return this.drawForm();
    if (this.mode === 'upload') return this.drawUpload();
    this.drawList();
  },

  /* ---------------- LIST ---------------- */
  drawList() {
    const subjects = this.data.subjects;
    const all = this.data.questions;
    const filtered = all.filter(q => {
      const matchSearch = !this.search ||
        q.stem.toLowerCase().includes(this.search.toLowerCase()) ||
        String(q.id).includes(this.search);
      const matchSubj = this.subject === 'all' || q.subjects.includes(this.subject);
      return matchSearch && matchSubj;
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / this.perPage));
    if (this.page > totalPages) this.page = totalPages;
    const start = (this.page - 1) * this.perPage;
    const pageRows = filtered.slice(start, start + this.perPage);

    const statusPill = q => q.status === 'active'
      ? '<span class="pill good">Active</span>'
      : '<span class="pill muted">Draft</span>';
    const diffPill = d => {
      const cls = d === 'Easy' ? 'good' : d === 'Hard' ? 'risk' : 'warn';
      return `<span class="pill ${cls}">${H.esc(d)}</span>`;
    };

    this.el.innerHTML = `
      <div class="page-head"><div><h1>Question Management</h1>
        <p class="subtitle">${H.esc(this.data.question_bank)} &middot; Authoring console</p></div>
        <div class="row" style="gap:8px">
          <button class="btn btn-secondary" id="qm-upload-btn">${Icon.inbox} Bulk Upload</button>
          <button class="btn btn-primary" id="qm-create-btn">${Icon.plus} Create Question</button>
        </div></div>

      <div class="qm-toolbar">
        <div class="qm-search">${Icon.search}
          <input id="qm-search" type="text" placeholder="Search by stem or QID&hellip;" value="${H.esc(this.search)}"/></div>
        <select id="qm-subject">
          <option value="all">All subjects</option>
          ${subjects.map(s => `<option value="${H.esc(s)}" ${this.subject === s ? 'selected' : ''}>${H.esc(s)}</option>`).join('')}
        </select>
      </div>

      ${filtered.length === 0
        ? emptyState('inbox', 'No questions found', 'Try adjusting your search or subject filter.')
        : `<div class="panel-card pad-0"><table class="data">
            <thead><tr>
              <th style="width:78px">QID</th><th>Stem</th><th>Subject(s)</th>
              <th style="width:96px">Difficulty</th><th style="width:84px">Status</th>
              <th style="width:120px">Last Updated</th><th style="width:160px"></th>
            </tr></thead>
            <tbody>${pageRows.map(q => `<tr>
              <td class="muted">#${q.id}</td>
              <td><div class="qm-stem">${H.esc(q.stem)}</div></td>
              <td>${q.subjects.map(s => `<span class="qm-subj">${H.esc(s)}</span>`).join('')}</td>
              <td>${diffPill(q.difficulty)}</td>
              <td>${statusPill(q)}</td>
              <td class="muted">${H.date(q.updated_at)}</td>
              <td><div class="qm-rowact">
                <button class="btn btn-ghost" data-act="preview" data-id="${q.id}" title="Preview">${Icon.search}</button>
                <button class="btn btn-ghost" data-act="edit" data-id="${q.id}" title="Edit">${Icon.cog}</button>
                <button class="btn btn-ghost" data-act="delete" data-id="${q.id}" title="Delete">${Icon.x}</button>
              </div></td>
            </tr>`).join('')}</tbody>
          </table></div>

          <div class="qm-pager">
            <div class="pg-info">Showing ${filtered.length ? start + 1 : 0}&ndash;${start + pageRows.length} of ${filtered.length} question${filtered.length === 1 ? '' : 's'}</div>
            <div class="pg-ctrl">
              <button class="btn btn-secondary" id="qm-prev" ${this.page === 1 ? 'disabled' : ''}>Prev</button>
              <span class="pg-info">Page ${this.page} of ${totalPages}</span>
              <button class="btn btn-secondary" id="qm-next" ${this.page === totalPages ? 'disabled' : ''}>Next</button>
            </div>
          </div>`}
    `;

    // wire toolbar
    this.el.querySelector('#qm-create-btn').onclick = () => this.openForm(null);
    this.el.querySelector('#qm-upload-btn').onclick = () => { this.mode = 'upload'; this.draw(); };
    const search = this.el.querySelector('#qm-search');
    search.oninput = (e) => { this.search = e.target.value; this.page = 1; this.drawList(); this.el.querySelector('#qm-search').focus(); };
    this.el.querySelector('#qm-subject').onchange = (e) => { this.subject = e.target.value; this.page = 1; this.drawList(); };
    const prev = this.el.querySelector('#qm-prev'); if (prev) prev.onclick = () => { if (this.page > 1) { this.page--; this.drawList(); } };
    const next = this.el.querySelector('#qm-next'); if (next) next.onclick = () => { if (this.page < totalPages) { this.page++; this.drawList(); } };

    // row actions
    this.el.querySelectorAll('[data-act]').forEach(b => {
      const id = +b.dataset.id;
      const q = this.data.questions.find(x => x.id === id);
      if (b.dataset.act === 'preview') b.onclick = () => this.preview(q);
      else if (b.dataset.act === 'edit') b.onclick = () => this.openForm(id);
      else b.onclick = () => this.confirmDelete(q);
    });
  },

  confirmDelete(q) {
    openModal({
      title: 'Delete question',
      body: `<p>Delete question <b>#${q.id}</b>? This action cannot be undone.</p>
        <p class="muted" style="font-size:13px">${H.esc(q.stem.slice(0, 120))}&hellip;</p>`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        this.data.questions = this.data.questions.filter(x => x.id !== q.id);
        toast('Question deleted', 'success');
        this.drawList();
      }
    });
  },

  /* ---------------- FORM (create/edit) ---------------- */
  openForm(id) {
    this.editingId = id;
    if (id != null) {
      const q = this.data.questions.find(x => x.id === id);
      this.form = {
        stem: q.stem,
        subjects: [...q.subjects],
        difficulty: q.difficulty,
        explanation: '',
        isPrivate: !q.shared,
        answers: Array.from({ length: Math.min(q.num_answers, 5) }, (_, i) => ({ text: i === 0 ? 'Sample answer ' + H.letter(i) : '', correct: i === 0 }))
      };
    } else {
      this.form = {
        stem: '', subjects: [], difficulty: 'Medium', explanation: '', isPrivate: false,
        answers: [{ text: '', correct: false }, { text: '', correct: false }]
      };
    }
    this.mode = 'form';
    this.draw();
  },

  validate() {
    const f = this.form, e = {};
    if (!f.stem.trim()) e.stem = 'Question stem is required.';
    else if (f.stem.length > 4000) e.stem = 'Question stem must be 4000 characters or fewer.';
    if (!f.subjects.length) e.subjects = 'Select at least one subject.';
    if (f.explanation.length > 6000) e.explanation = 'Explanation must be 6000 characters or fewer.';
    const nonEmpty = f.answers.filter(a => a.text.trim());
    if (nonEmpty.length < 2) e.answers = 'At least two answer choices are required.';
    else if (!f.answers.some(a => a.correct && a.text.trim())) e.answers = 'Mark at least one non-empty answer as correct.';
    return e;
  },

  drawForm() {
    const f = this.form;
    const errs = this.validate();
    const valid = Object.keys(errs).length === 0;
    const isEdit = this.editingId != null;
    const errLine = msg => msg ? `<div class="qm-err">${Icon.alert}<span>${H.esc(msg)}</span></div>` : '';

    this.el.innerHTML = `
      <div class="page-head"><div><h1>${isEdit ? 'Edit Question #' + this.editingId : 'Create Question'}</h1>
        <p class="subtitle">${H.esc(this.data.question_bank)}</p></div>
        <button class="btn btn-ghost" id="qm-back">${Icon.list} Back to list</button></div>

      <div class="panel-card">
        <div class="section-label" style="margin-top:0">Details</div>
        <div class="qm-form-sec">
          <div class="qm-field ${errs.stem ? 'invalid' : ''}" style="margin-bottom:14px">
            <label>Question Stem<span class="req">*</span></label>
            <textarea id="f-stem" placeholder="Write question stem here">${H.esc(f.stem)}</textarea>
            <div class="qm-count">${f.stem.length}/4000 characters</div>
            ${errLine(errs.stem)}
          </div>

          <div class="qm-field ${errs.subjects ? 'invalid' : ''}" style="margin-bottom:14px">
            <label>Subject<span class="req">*</span></label>
            <div class="qm-subj-multi">
              ${this.data.subjects.map(s => `<label class="${f.subjects.includes(s) ? 'on' : ''}">
                <input type="checkbox" data-subj="${H.esc(s)}" ${f.subjects.includes(s) ? 'checked' : ''} style="display:none"/>
                ${f.subjects.includes(s) ? Icon.check : ''} ${H.esc(s)}</label>`).join('')}
            </div>
            ${errLine(errs.subjects)}
          </div>

          <div class="qm-form-grid">
            <div class="qm-field">
              <label>Difficulty</label>
              <select id="f-diff">
                ${['Easy', 'Medium', 'Hard'].map(d => `<option ${f.difficulty === d ? 'selected' : ''}>${d}</option>`).join('')}
              </select>
            </div>
            <div class="qm-field" style="display:flex;align-items:flex-end">
              <label style="font-weight:500;display:inline-flex;gap:8px;align-items:center;cursor:pointer">
                <input type="checkbox" id="f-private" ${f.isPrivate ? 'checked' : ''}/> Keep this question private</label>
            </div>
          </div>

          <div class="qm-field ${errs.explanation ? 'invalid' : ''}" style="margin-top:14px">
            <label>Explanation</label>
            <textarea id="f-expl" placeholder="Write the answer explanation here">${H.esc(f.explanation)}</textarea>
            <div class="qm-count">${f.explanation.length}/6000 characters</div>
            ${errLine(errs.explanation)}
          </div>
        </div>

        <div class="section-label">Answer Choices</div>
        <div class="qm-form-sec" id="qm-answers">
          ${f.answers.map((a, i) => `
            <div class="qm-answer ${a.correct && a.text.trim() ? 'correct' : ''}">
              <div class="ah"><b>Answer ${H.letter(i)}</b>
                <button class="btn btn-ghost" data-rm="${i}" ${f.answers.length <= 2 ? 'disabled' : ''}>${Icon.x} Remove</button></div>
              <div class="qm-field"><textarea data-ans="${i}" placeholder="Write answer here">${H.esc(a.text)}</textarea>
                <div class="qm-count">${a.text.length}/750 characters</div></div>
              <label class="qm-correct"><input type="checkbox" data-correct="${i}" ${a.correct ? 'checked' : ''}/> Mark as correct answer</label>
            </div>`).join('')}
          ${errLine(errs.answers)}
          <button class="btn btn-secondary" id="qm-add-ans">${Icon.plus} Add Answer</button>
        </div>

        <div class="row" style="gap:10px;border-top:1px solid var(--line);padding-top:16px">
          <button class="btn btn-secondary" id="qm-preview">${Icon.search} Preview</button>
          <span style="flex:1"></span>
          <button class="btn btn-primary" id="qm-save" ${valid ? '' : 'disabled'}>
            ${isEdit ? 'Save Changes' : 'Save Question'}</button>
        </div>
        ${valid ? '' : '<div class="qm-err" style="justify-content:flex-end">' + Icon.alert + '<span>Resolve the highlighted fields to enable Save.</span></div>'}
      </div>`;

    // wiring (re-render on change so validation/counts update live)
    this.el.querySelector('#qm-back').onclick = () => { this.mode = 'list'; this.draw(); };
    const stem = this.el.querySelector('#f-stem');
    stem.oninput = (e) => { f.stem = e.target.value; this.drawForm(); this.el.querySelector('#f-stem').focus(); };
    this.el.querySelector('#f-diff').onchange = (e) => { f.difficulty = e.target.value; };
    this.el.querySelector('#f-private').onchange = (e) => { f.isPrivate = e.target.checked; };
    const expl = this.el.querySelector('#f-expl');
    expl.oninput = (e) => { f.explanation = e.target.value; this.drawForm(); this.el.querySelector('#f-expl').focus(); };

    this.el.querySelectorAll('[data-subj]').forEach(c => c.onchange = () => {
      const s = c.dataset.subj;
      if (f.subjects.includes(s)) f.subjects = f.subjects.filter(x => x !== s);
      else f.subjects.push(s);
      this.drawForm();
    });
    this.el.querySelectorAll('[data-ans]').forEach(t => t.oninput = (e) => {
      f.answers[+t.dataset.ans].text = e.target.value; this.drawForm();
      const re = this.el.querySelector(`[data-ans="${t.dataset.ans}"]`); if (re) { re.focus(); re.setSelectionRange(re.value.length, re.value.length); }
    });
    this.el.querySelectorAll('[data-correct]').forEach(c => c.onchange = () => {
      f.answers[+c.dataset.correct].correct = c.checked; this.drawForm();
    });
    this.el.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
      if (f.answers.length > 2) { f.answers.splice(+b.dataset.rm, 1); this.drawForm(); }
    });
    this.el.querySelector('#qm-add-ans').onclick = () => { f.answers.push({ text: '', correct: false }); this.drawForm(); };
    this.el.querySelector('#qm-preview').onclick = () => this.previewForm();
    const save = this.el.querySelector('#qm-save');
    if (valid) save.onclick = () => {
      toast(isEdit ? 'Question saved' : 'Question created', 'success');
      this.mode = 'list'; this.draw();
    };
  },

  previewForm() {
    this.preview({
      id: this.editingId || 'NEW',
      stem: this.form.stem || '(empty stem)',
      subjects: this.form.subjects,
      difficulty: this.form.difficulty,
      explanation: this.form.explanation,
      answers: this.form.answers.filter(a => a.text.trim())
    });
  },

  preview(q) {
    const answers = q.answers || Array.from({ length: q.num_answers || 4 }, (_, i) => ({
      text: 'Answer choice ' + H.letter(i), correct: i === 0
    }));
    openModal({
      title: 'Question Preview',
      confirmLabel: 'Close',
      body: `
        <div class="muted" style="font-size:12px;margin-bottom:10px">QID: ${H.esc(String(q.id))}</div>
        <div class="qm-prev-meta">
          <div><div class="mlabel">Question Bank</div><div class="mval">${H.esc(this.data.question_bank)}</div></div>
          <div><div class="mlabel">Subject</div><div class="mval">${q.subjects && q.subjects.length ? q.subjects.map(H.esc).join(', ') : '&mdash;'}</div></div>
          <div><div class="mlabel">Difficulty</div><div class="mval">${H.esc(q.difficulty || '&mdash;')}</div></div>
        </div>
        <div class="section-label" style="margin-top:0">Question Stem</div>
        <p style="color:var(--navy-900)">${H.esc(q.stem)}</p>
        <div class="section-label">Answer Choices</div>
        ${answers.map((a, i) => `<div class="qm-prev-ans ${a.correct ? 'correct' : ''}">
          <b>${H.letter(i)}.</b> ${H.esc(a.text)} ${a.correct ? '<span class="pill good" style="float:right">' + Icon.check + ' Correct</span>' : ''}</div>`).join('')}
        ${q.explanation ? '<div class="section-label">Explanation</div><p class="muted" style="font-size:13px">' + H.esc(q.explanation) + '</p>' : ''}`
    });
  },

  /* ---------------- UPLOAD ---------------- */
  drawUpload() {
    this.el.innerHTML = `
      <div class="page-head"><div><h1>Bulk Upload Questions</h1>
        <p class="subtitle">${H.esc(this.data.question_bank)}</p></div>
        <button class="btn btn-ghost" id="qm-up-back">${Icon.list} Back to list</button></div>

      <div class="panel-card">
        <div class="qm-dropzone" id="qm-drop">
          ${Icon.inbox}
          <h4>Drag &amp; drop your CSV here</h4>
          <p>or click to browse &middot; CSV files only (max 1,000 rows)</p>
          <input type="file" id="qm-file" accept=".csv" style="display:none"/>
        </div>
      </div>

      <div class="panel-card">
        <div class="section-label" style="margin-top:0">Upload instructions</div>
        <ol class="qm-instr">
          <li>CSV files only. The first row must be a header row.</li>
          <li>Required columns: <b>stem</b>, <b>subject</b>, <b>difficulty</b>, <b>answer_a&hellip;answer_e</b>, <b>correct_answer</b>.</li>
          <li>Use a single subject name per column; separate multiple subjects with a pipe (|).</li>
          <li>Difficulty must be one of: Easy, Medium, Hard.</li>
          <li>Rich-text and images are not supported via CSV import.</li>
        </ol>
        <a href="javascript:void(0)" class="template-link" onclick="toast('Template download mocked')">Need a template? Download the CSV template</a>
      </div>`;

    this.el.querySelector('#qm-up-back').onclick = () => { this.mode = 'list'; this.draw(); };
    const drop = this.el.querySelector('#qm-drop');
    const file = this.el.querySelector('#qm-file');
    drop.onclick = () => file.click();
    file.onchange = () => { if (file.files.length) toast('CSV upload is mocked: ' + file.files[0].name, 'success'); };
    drop.ondragover = (e) => { e.preventDefault(); drop.style.borderColor = 'var(--info)'; };
    drop.ondragleave = () => { drop.style.borderColor = ''; };
    drop.ondrop = (e) => { e.preventDefault(); drop.style.borderColor = ''; toast('CSV upload is mocked', 'success'); };
  }
};
