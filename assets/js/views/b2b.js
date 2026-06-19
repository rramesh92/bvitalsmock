window.Views = window.Views || {};
// Institutional / instructor admin area — mirrors the real /dashboard/classes,
// /dashboard/classes/:id and /dashboard/assignments screens (instructor login).
window.Views.b2b = {
  classTab: 'mine',        // mine | delegated
  asgTab: 'assignments',   // assignments | lms | delegated

  async render(el, params) {
    const sub = params[0] || 'classes';
    if (sub === 'class') return this.classDetail(el, params[1]);
    el.innerHTML = skeleton(6);
    let g, a;
    try { g = await DB.load('b2b-member-groups'); a = await DB.load('b2b-assignments'); }
    catch (e) { el.innerHTML = errorState(e.message); return; }
    this.injectCss();

    const tab = sub === 'assignments' ? 'assignments' : 'classes';
    el.innerHTML = `
      ${this.orgBar(g.organization, g.organizations)}
      <div class="seg admin-seg" id="admin-seg">
        <button data-s="classes" class="${tab==='classes'?'active':''}">Classes</button>
        <button data-s="assignments" class="${tab==='assignments'?'active':''}">Assignments</button>
      </div>
      <div id="admin-body" class="mt-16"></div>`;
    el.querySelectorAll('#admin-seg button').forEach(b => b.onclick = () => { location.hash = `#/b2b/${b.dataset.s}`; });
    const body = el.querySelector('#admin-body');
    tab === 'assignments' ? this.assignmentsView(body, a) : this.classesView(body, g);
  },

  orgBar(org, orgs) {
    return `<div class="org-bar">
      <span class="muted" style="font-weight:600">Organization:</span>
      <select class="org-select">${(orgs||[org]).map(o => `<option ${o===org?'selected':''}>${H.esc(o)}</option>`).join('')}</select>
      <span class="pill good" style="margin-left:auto">${Icon.shield} Instructor — TESTINSTRUCTOR1</span>
    </div>`;
  },

  /* ---------------- Classes list ---------------- */
  classesView(body, g) {
    const rows = this.classTab === 'mine' ? g.classes : g.delegated_classes;
    body.innerHTML = `
      <div class="page-head"><div><h1>Classes</h1></div>
        <button class="btn btn-primary" id="new-class">Create New Class</button></div>
      <div class="between" style="flex-wrap:wrap;gap:10px">
        <div class="seg" id="class-tabs">
          <button data-t="mine" class="${this.classTab==='mine'?'active':''}">My Classes</button>
          <button data-t="delegated" class="${this.classTab==='delegated'?'active':''}">Delegated Classes</button>
        </div>
        <div class="row" style="gap:12px">
          <div class="bv-search" style="background:#fff"><input placeholder="Class Name" id="class-q"/><button>${Icon.search}</button></div>
          <a href="#" id="archived-classes">View Archived Classes</a>
        </div>
      </div>
      <div class="panel-card pad-0 mt-16">
        ${rows && rows.length ? `<table class="data">
          <thead><tr><th>Class Name ▾</th><th>Recipients</th><th>Delegates</th><th>Class Created</th><th></th><th></th></tr></thead>
          <tbody>${rows.map(c => `<tr>
            <td><b>${H.esc(c.name)}</b></td>
            <td>${c.recipients}</td>
            <td>${c.delegates}</td>
            <td>${H.date(c.created)}</td>
            <td style="text-align:right;white-space:nowrap">
              <a href="#/b2b/class/${c.id}">View</a> <span class="muted">|</span>
              <a href="#" data-edit="${c.id}">Edit</a></td>
            <td style="text-align:center"><button class="icon-btn" title="Archive" data-arch="${c.id}">${Icon.inbox}</button></td>
          </tr>`).join('')}</tbody></table>`
        : emptyState('users', 'No classes', this.classTab==='mine'?'Create a class to enroll students.':'No classes have been delegated to you.', '')}
      </div>`;
    body.querySelectorAll('#class-tabs button').forEach(b => b.onclick = () => { this.classTab = b.dataset.t; this.classesView(body, g); });
    body.querySelector('#new-class').onclick = () => this.createClassModal();
    body.querySelector('#archived-classes').onclick = (e) => { e.preventDefault(); toast('Archived classes (mocked)'); };
    body.querySelectorAll('[data-edit]').forEach(b => b.onclick = (e) => { e.preventDefault(); toast('Edit class (mocked)'); });
    body.querySelectorAll('[data-arch]').forEach(b => b.onclick = () => openModal({ title: 'Archive class?', body: '<p>The class will be moved to archived classes.</p>', confirmLabel: 'Archive', danger: true, onConfirm: () => toast('Class archived', 'success') }));
  },

  /* ---------------- Class detail (students) ---------------- */
  async classDetail(el, id) {
    el.innerHTML = skeleton(5);
    let g; try { g = await DB.load('b2b-member-groups'); } catch (e) { el.innerHTML = errorState(e.message); return; }
    this.injectCss();
    const c = (g.class_detail && g.class_detail[id]) || g.classes.find(x => String(x.id) === String(id)) || { name: 'Class', recipients: 0, delegates: 0, students: [], delegate_list: [], created: null };
    const students = c.students || [];
    const sharing = AdaptivePrep.read().share_with_admin;
    el.innerHTML = `
      ${this.orgBar(g.organization, g.organizations)}
      <div class="page-head">
        <div><h1>${H.esc(c.name)}</h1>
          <div class="muted" style="margin-top:4px">${H.date(c.created)} &nbsp;|&nbsp; ${c.recipients} Recipients &nbsp;|&nbsp; ${c.delegates} Delegates
            &nbsp; <a href="#" id="edit-class">Edit Class</a></div></div>
        <button class="btn btn-primary" id="class-perf">Class Performance</button>
      </div>
      <a href="#/b2b/classes" style="display:inline-block;margin-bottom:12px">&lt; Back</a>
      <div class="panel-card" style="padding:12px 16px;margin-bottom:14px">
        <b style="color:var(--navy-900)">Adaptive Prep visibility:</b>
        <span class="muted">${sharing ? 'Student opted in. Individual Adaptive Prep details may be shown.' : 'Student details are private. Class reports show aggregate cohort trends only.'}</span>
      </div>
      <div class="section-label">Students</div>
      <div class="panel-card pad-0">
        ${students.length ? `<table class="data">
          <thead><tr><th>Email ▾</th><th>First Name</th><th>Last Name</th><th></th></tr></thead>
          <tbody>${students.map(s => `<tr>
            <td>${H.esc(s.email)}</td><td>${H.esc(s.first_name)}</td><td>${H.esc(s.last_name)}</td>
            <td style="text-align:right;white-space:nowrap">
              ${sharing ? '<a href="#/practice-exam-performance/501">View Performance</a> <span class="muted">|</span><a href="#/my-quizzes">View Quizzes</a> <span class="muted">|</span>' : '<span class="muted">Individual Adaptive Prep details private</span> <span class="muted">|</span>'}
              <a href="#" data-rm="${H.esc(s.email)}" style="color:var(--risk)">Remove</a></td>
          </tr>`).join('')}</tbody></table>`
        : emptyState('users','No students','This class has no enrolled students yet.','')}
      </div>
      <div class="section-label mt-16">Delegates <span class="muted" title="Delegates can manage this class on your behalf">(?)</span></div>
      <div class="panel-card"><div class="bv-tabrow-empty">No Delegates Found</div></div>`;
    el.querySelector('#class-perf').onclick = () => this.classPerformance(c.name);
    el.querySelector('#edit-class').onclick = (e) => { e.preventDefault(); toast('Edit class (mocked)'); };
    el.querySelectorAll('[data-rm]').forEach(b => b.onclick = (e) => { e.preventDefault(); openModal({ title: 'Remove student?', body: `<p>Remove <b>${H.esc(b.dataset.rm)}</b> from this class?</p>`, confirmLabel: 'Remove', danger: true, onConfirm: () => toast('Student removed', 'success') }); });
  },

  async classPerformance(name) {
    let r; try { r = await DB.load('b2b-class-reports'); } catch (e) { r = null; }
    const c = r ? (r.cohort_summary || {
      avg_percent_correct: r.performance?.class?.average_score || 64,
      questions_answered: r.summary?.questions_answered || 0
    }) : { avg_percent_correct: 64, questions_answered: 0 };
    const ap = r?.adaptive_prep;
    const sharing = AdaptivePrep.read().share_with_admin;
    openModal({
      title: `Class Performance — ${name}`,
      body: `<div class="grid cols-2" style="gap:12px">
        <div class="card stat" style="box-shadow:none;background:var(--bg)"><div class="value ${H.scoreClass(c.avg_percent_correct)}">${c.avg_percent_correct}%</div><div class="label">Average score</div></div>
        <div class="card stat" style="box-shadow:none;background:var(--bg)"><div class="value">${(c.questions_answered||0).toLocaleString()}</div><div class="label">Questions answered</div></div>
      </div>${ap ? `<div class="grid cols-3 mt-16" style="gap:12px">
        <div class="card stat" style="box-shadow:none;background:var(--bg)"><div class="value good">${ap.cohort_on_track_percent}%</div><div class="label">Cohort on-track this week</div></div>
        <div class="card stat" style="box-shadow:none;background:var(--bg)"><div class="value">${ap.daily_session_completion_percent}%</div><div class="label">Daily session completion</div></div>
        <div class="card stat" style="box-shadow:none;background:var(--bg)"><div class="value">${ap.friday_checkpoint_completion_percent}%</div><div class="label">Friday Checkpoint completion</div></div>
      </div>
      ${sharing ? `<div class="panel-card mt-16" style="padding:12px 16px">
        <b style="color:var(--navy-900)">${H.esc(ap.opted_in_student.name)}</b>
        <div class="muted">Daily session: ${H.esc(ap.opted_in_student.daily_session_status)} · Friday Checkpoint: ${ap.opted_in_student.friday_checkpoint_score}%</div>
        <div class="muted">${H.esc(ap.opted_in_student.weekly_report_summary)}</div>
      </div>` : `<p class="muted mt-8 mb-0">Individual Adaptive Prep details are hidden because the student has not opted in.</p>`}` : ''}
      <p class="muted mt-8 mb-0">Full class performance report opens in the reports view with aggregate subject activity.</p>`,
      confirmLabel: 'Open full report', onConfirm: () => { location.hash = '#/usage-reports'; }
    });
  },

  createClassModal() {
    openModal({
      title: 'Create New Class',
      body: `<div class="field"><label>Class name</label><input placeholder="e.g. PGY-1 Cohort 2026"/></div>
        <div class="field"><label>Add students by email (comma-separated)</label><input placeholder="student1@school.edu, student2@school.edu"/></div>`,
      confirmLabel: 'Create Class', onConfirm: () => toast('Class created', 'success')
    });
  },

  /* ---------------- Assignments ---------------- */
  assignmentsView(body, a) {
    const rows = this.asgTab === 'lms' ? a.lms_assignments : this.asgTab === 'delegated' ? a.delegated_assignments : a.assignments;
    body.innerHTML = `
      <div class="page-head"><div><h1>Assignments</h1></div></div>
      <div class="section-label">Create Assignments</div>
      <div class="grid cols-2" style="gap:16px;align-items:start">
        <div class="panel-card">
          <div class="row" style="gap:12px;margin-bottom:14px">
            <button class="btn btn-primary" id="new-template">New Assignment Template</button>
            <button class="btn btn-primary" id="existing-template">Existing Assignment Template</button>
          </div>
          <p class="muted mb-0" style="font-size:13px">To send an <b>assignment</b>, the first step is to create an <b>assignment template</b>. These define the number, type, subjects, and other criteria of the question set that make up an assignment. Once you have your assignment template, you can use (and re-use) it to send an assignment to a group of students.</p>
        </div>
        <div class="panel-card">
          <button class="btn btn-primary btn-block" id="adaptive-exam" style="margin-bottom:14px">Adaptive Exam</button>
          <p class="muted mb-0" style="font-size:13px"><b>Adaptive exams</b> cover the full range of topics within a specialty and vary in length depending on the performance of the user. <b>Adaptive exams</b> do not require an <b>assignment template</b>.</p>
        </div>
      </div>

      <div class="between mt-24" style="flex-wrap:wrap;gap:10px">
        <div class="seg" id="asg-tabs">
          <button data-t="assignments" class="${this.asgTab==='assignments'?'active':''}">Assignments</button>
          <button data-t="lms" class="${this.asgTab==='lms'?'active':''}">LMS Assignments</button>
          <button data-t="delegated" class="${this.asgTab==='delegated'?'active':''}">Delegated Assignments</button>
        </div>
        <a href="#" id="archived-asg">View Archived Assignments</a>
      </div>
      <div class="panel-card pad-0 mt-16">
        ${rows && rows.length ? `<table class="data">
          <thead><tr><th>Name</th><th>Class</th><th>Template</th><th>Question Bank</th><th>Completed</th><th>Start</th><th>End</th><th></th></tr></thead>
          <tbody>${rows.map(x => `<tr>
            <td><b>${H.esc(x.name)}</b></td>
            <td>${H.esc(x.class) || '<span class="muted">—</span>'}</td>
            <td>${H.esc(x.template)}</td>
            <td>${H.esc(x.question_bank)}</td>
            <td>${H.esc(x.completed)}</td>
            <td>${x.start ? H.date(x.start) : ''}</td>
            <td>${x.end ? H.date(x.end) : ''}</td>
            <td style="text-align:right;white-space:nowrap"><a href="#" data-vw>View</a> <span class="muted">|</span> <a href="#" data-ed>Edit</a></td>
          </tr>`).join('')}</tbody></table>`
        : emptyState('inbox', 'No assignments', this.asgTab==='lms'?'No LMS assignments yet.':this.asgTab==='delegated'?'No delegated assignments.':'Create an assignment template to send your first assignment.', '')}
      </div>`;
    body.querySelectorAll('#asg-tabs button').forEach(b => b.onclick = () => { this.asgTab = b.dataset.t; this.assignmentsView(body, a); });
    body.querySelector('#new-template').onclick = () => this.newTemplateModal();
    body.querySelector('#existing-template').onclick = () => toast('Pick an existing template (mocked)');
    body.querySelector('#adaptive-exam').onclick = () => toast('Create adaptive exam (mocked)');
    body.querySelector('#archived-asg').onclick = (e) => { e.preventDefault(); toast('Archived assignments (mocked)'); };
    body.querySelectorAll('[data-vw],[data-ed]').forEach(b => b.onclick = (e) => { e.preventDefault(); toast('Assignment action (mocked)'); });
  },

  newTemplateModal() {
    openModal({
      title: 'New Assignment Template',
      body: `<div class="field"><label>Template name</label><input placeholder="e.g. Cardiology Set 1"/></div>
        <div class="field"><label>Question bank</label><select><option>BoardVitals Team Training</option><option>Addiction Medicine</option><option>NCLEX-PN</option></select></div>
        <div class="field"><label>Number of questions</label><input type="number" value="25"/></div>
        <div class="field"><label>Mode</label><select><option>Tutor</option><option>Test</option><option>Adaptive (CAT)</option></select></div>`,
      confirmLabel: 'Create Template', onConfirm: () => toast('Template created', 'success')
    });
  },

  injectCss() {
    if (document.getElementById('css-b2b')) return;
    const s = document.createElement('style');
    s.id = 'css-b2b';
    s.textContent = `
      .org-bar{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--line);border-radius:6px;padding:10px 14px;margin-bottom:14px}
      .org-bar .org-select{font:inherit;font-weight:700;color:var(--navy-900);border:1px solid var(--line);border-radius:5px;padding:6px 28px 6px 12px;min-width:240px;cursor:pointer}
      .admin-seg{margin:0}`;
    document.head.appendChild(s);
  }
};
