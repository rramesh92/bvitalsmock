/* Admin User Management — users table (search/role filter/paginate + row actions),
   Add User modal w/ validation, Bulk Upload Users section + confirmation snapshot.
   Models javascript/app/pages/UserManagement/*. Self-contained mock. */
window.Views = window.Views || {};
window.Views['user-management'] = {
  page: 1,
  perPage: 8,
  search: '',
  role: 'all',
  showSnapshot: false,

  injectCss() {
    if (document.getElementById('css-user-management')) return;
    const s = document.createElement('style');
    s.id = 'css-user-management';
    s.textContent = `
      .um-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px}
      .um-toolbar .um-search{flex:1;min-width:200px;position:relative}
      .um-toolbar .um-search input{width:100%;padding:9px 12px 9px 34px;border:1px solid var(--line);border-radius:8px;font-size:14px}
      .um-toolbar .um-search svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--muted)}
      .um-toolbar select{padding:9px 12px;border:1px solid var(--line);border-radius:8px;font-size:14px;background:#fff;min-width:150px}
      .um-name{display:flex;align-items:center;gap:10px}
      .um-avatar{width:30px;height:30px;border-radius:50%;background:var(--teal-050);color:var(--info);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex:0 0 auto}
      .um-rowact{display:flex;gap:6px;justify-content:flex-end}
      .um-pager{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 4px;flex-wrap:wrap}
      .um-pager .pg-info{font-size:12.5px;color:var(--muted)}
      .um-pager .pg-ctrl{display:flex;align-items:center;gap:8px}
      .um-pager .pg-ctrl button{min-width:84px}
      .um-snap-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:14px}
      .um-snap-cards .card{text-align:center}
      .um-snap-cards .num{font-size:30px;font-weight:700}
      .um-snap-cards .num.good{color:var(--good)}
      .um-snap-cards .num.warn{color:var(--warn)}
      .um-snap-cards .num.risk{color:var(--risk)}
      .um-snap-cards .lbl{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.03em}
      .um-dropzone{border:2px dashed var(--line);border-radius:12px;padding:30px;text-align:center;background:#fafbfc;cursor:pointer}
      .um-dropzone:hover{border-color:var(--info);background:var(--teal-050)}
      .um-dropzone svg{width:32px;height:32px;color:var(--info)}
      .um-dropzone h4{margin:8px 0 4px;color:var(--navy-900)}
      .um-dropzone p{margin:0;color:var(--muted);font-size:13px}
      .um-instr{font-size:13px;color:var(--navy-900);line-height:1.7;padding-left:18px;margin:8px 0}
      .um-mdl-err{color:var(--risk);font-size:12px;margin-top:4px}
      .um-mdl .field input,.um-mdl .field select{width:100%;border:1px solid var(--line);border-radius:8px;padding:9px 11px;font-size:14px}
      .um-mdl .field input.invalid{border-color:var(--risk)}
      @media(max-width:760px){.um-snap-cards{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  },

  async render(el) {
    this.injectCss();
    el.innerHTML = skeleton(6);
    let data;
    try { data = await DB.load('users-admin'); }
    catch (e) { el.innerHTML = errorState(e.message); return; }
    this.data = data;
    this.el = el;
    this.draw();
  },

  draw() {
    const all = this.data.users;
    const filtered = all.filter(u => {
      const name = `${u.first_name} ${u.last_name}`.toLowerCase();
      const matchSearch = !this.search ||
        name.includes(this.search.toLowerCase()) ||
        u.email.toLowerCase().includes(this.search.toLowerCase());
      const matchRole = this.role === 'all' || u.role === this.role;
      return matchSearch && matchRole;
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / this.perPage));
    if (this.page > totalPages) this.page = totalPages;
    const start = (this.page - 1) * this.perPage;
    const pageRows = filtered.slice(start, start + this.perPage);

    const rolePill = r => {
      const map = { admin: 'good', instructor: 'warn', student: 'muted' };
      return `<span class="pill ${map[r] || 'muted'}">${r.charAt(0).toUpperCase() + r.slice(1)}</span>`;
    };
    const statusPill = st => {
      const map = { active: 'good', invited: 'warn', disabled: 'risk' };
      return `<span class="pill ${map[st] || 'muted'}">${st.charAt(0).toUpperCase() + st.slice(1)}</span>`;
    };

    this.el.innerHTML = `
      <div class="page-head"><div><h1>User Management</h1>
        <p class="subtitle">${H.esc(this.data.organization)}</p></div>
        <button class="btn btn-primary" id="um-add-btn">${Icon.plus} Add User</button></div>

      <div class="um-toolbar">
        <div class="um-search">${Icon.search}
          <input id="um-search" type="text" placeholder="Search name or email&hellip;" value="${H.esc(this.search)}"/></div>
        <select id="um-role">
          <option value="all">All roles</option>
          <option value="student" ${this.role === 'student' ? 'selected' : ''}>Student</option>
          <option value="instructor" ${this.role === 'instructor' ? 'selected' : ''}>Instructor</option>
          <option value="admin" ${this.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </div>

      ${filtered.length === 0
        ? emptyState('users', 'No users found', 'Try adjusting your search or role filter.')
        : `<div class="panel-card pad-0"><table class="data">
            <thead><tr>
              <th>Name</th><th>Email</th><th style="width:120px">Role</th>
              <th style="width:100px">Status</th><th style="width:120px">Last Active</th><th style="width:130px"></th>
            </tr></thead>
            <tbody>${pageRows.map(u => `<tr>
              <td><div class="um-name"><span class="um-avatar">${H.initials(u.first_name, u.last_name)}</span>
                <b>${H.esc(u.first_name)} ${H.esc(u.last_name)}</b></div></td>
              <td class="muted">${H.esc(u.email)}</td>
              <td>${rolePill(u.role)}</td>
              <td>${statusPill(u.status)}</td>
              <td class="muted">${u.last_active ? H.date(u.last_active) : '&mdash;'}</td>
              <td><div class="um-rowact">
                <button class="btn btn-ghost" data-act="role" data-id="${u.id}" title="Change role">${Icon.shield}</button>
                <button class="btn btn-ghost" data-act="toggle" data-id="${u.id}" title="${u.status === 'disabled' ? 'Reactivate' : 'Deactivate'}">${u.status === 'disabled' ? Icon.check : Icon.x}</button>
              </div></td>
            </tr>`).join('')}</tbody>
          </table></div>

          <div class="um-pager">
            <div class="pg-info">Showing ${filtered.length ? start + 1 : 0}&ndash;${start + pageRows.length} of ${filtered.length} user${filtered.length === 1 ? '' : 's'}</div>
            <div class="pg-ctrl">
              <button class="btn btn-secondary" id="um-prev" ${this.page === 1 ? 'disabled' : ''}>Prev</button>
              <span class="pg-info">Page ${this.page} of ${totalPages}</span>
              <button class="btn btn-secondary" id="um-next" ${this.page === totalPages ? 'disabled' : ''}>Next</button>
            </div>
          </div>`}

      <div class="between" style="margin:18px 0 12px"><div class="section-label" style="margin:0">Bulk Upload Users</div>
        <button class="btn btn-secondary" id="um-snap-toggle">${this.showSnapshot ? 'Hide' : 'View'} last upload result</button></div>
      <div class="panel-card">
        <div class="um-dropzone" id="um-drop">
          ${Icon.inbox}
          <h4>Drag &amp; drop a CSV of users</h4>
          <p>or click to browse &middot; CSV files only</p>
          <input type="file" id="um-file" accept=".csv" style="display:none"/>
        </div>
        <ol class="um-instr">
          <li>CSV files only. Format must be three columns: &lt;first name&gt;, &lt;last name&gt;, &lt;email address&gt;.</li>
          <li>You can only upload one role per CSV file. To upload multiple roles, create separate files.</li>
          <li>Invalid characters in names are removed; invalid or duplicate emails are skipped.</li>
        </ol>
        <a href="javascript:void(0)" class="template-link" onclick="toast('Template download mocked')">Need a template? Download the CSV template</a>
      </div>

      <div id="um-snapshot">${this.showSnapshot ? this.snapshot() : ''}</div>`;

    // wiring
    this.el.querySelector('#um-add-btn').onclick = () => this.addUser();
    const search = this.el.querySelector('#um-search');
    search.oninput = (e) => { this.search = e.target.value; this.page = 1; this.draw(); this.el.querySelector('#um-search').focus(); };
    this.el.querySelector('#um-role').onchange = (e) => { this.role = e.target.value; this.page = 1; this.draw(); };
    const prev = this.el.querySelector('#um-prev'); if (prev) prev.onclick = () => { if (this.page > 1) { this.page--; this.draw(); } };
    const next = this.el.querySelector('#um-next'); if (next) next.onclick = () => { if (this.page < totalPages) { this.page++; this.draw(); } };
    this.el.querySelector('#um-snap-toggle').onclick = () => { this.showSnapshot = !this.showSnapshot; this.draw(); };

    const drop = this.el.querySelector('#um-drop');
    const file = this.el.querySelector('#um-file');
    drop.onclick = () => file.click();
    file.onchange = () => { if (file.files.length) { this.showSnapshot = true; toast('CSV uploaded (mock): ' + file.files[0].name, 'success'); this.draw(); } };
    drop.ondragover = (e) => { e.preventDefault(); drop.style.borderColor = 'var(--info)'; };
    drop.ondragleave = () => { drop.style.borderColor = ''; };
    drop.ondrop = (e) => { e.preventDefault(); drop.style.borderColor = ''; this.showSnapshot = true; toast('CSV uploaded (mock)', 'success'); this.draw(); };

    this.el.querySelectorAll('[data-act]').forEach(b => {
      const u = this.data.users.find(x => x.id === +b.dataset.id);
      if (b.dataset.act === 'role') b.onclick = () => this.changeRole(u);
      else b.onclick = () => this.toggleStatus(u);
    });
  },

  changeRole(u) {
    openModal({
      title: `Update role for ${H.esc(u.first_name)} ${H.esc(u.last_name)}`,
      body: `<div class="um-mdl"><div class="field"><label>Role</label>
        <select id="um-newrole">
          <option value="student" ${u.role === 'student' ? 'selected' : ''}>Student</option>
          <option value="instructor" ${u.role === 'instructor' ? 'selected' : ''}>Instructor</option>
          <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select></div></div>`,
      confirmLabel: 'Update',
      onConfirm: () => {
        const sel = document.getElementById('um-newrole');
        u.role = sel ? sel.value : u.role;
        toast('Role updated', 'success'); this.draw();
      }
    });
  },

  toggleStatus(u) {
    const disabling = u.status !== 'disabled';
    openModal({
      title: disabling ? 'Deactivate user' : 'Reactivate user',
      body: `<p>${disabling ? 'Deactivate' : 'Reactivate'} <b>${H.esc(u.first_name)} ${H.esc(u.last_name)}</b> (${H.esc(u.email)})?</p>`,
      confirmLabel: disabling ? 'Deactivate' : 'Reactivate',
      danger: disabling,
      onConfirm: () => { u.status = disabling ? 'disabled' : 'active'; toast(disabling ? 'User deactivated' : 'User reactivated', 'success'); this.draw(); }
    });
  },

  addUser() {
    // Use a live-captured draft so validation can run before the shared openModal closes.
    const draft = { first: '', last: '', email: '', role: 'student' };
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    openModal({
      title: 'Add User',
      confirmLabel: 'Send invite',
      body: `<div class="um-mdl">
        <div class="field"><label>First name</label><input id="au-first" type="text" placeholder="First name"/>
          <div class="um-mdl-err" id="au-first-err"></div></div>
        <div class="field"><label>Last name</label><input id="au-last" type="text" placeholder="Last name"/>
          <div class="um-mdl-err" id="au-last-err"></div></div>
        <div class="field"><label>Email</label><input id="au-email" type="text" placeholder="name@example.com"/>
          <div class="um-mdl-err" id="au-email-err"></div></div>
        <div class="field"><label>Role</label><select id="au-role">
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
          <option value="admin">Admin</option></select></div>
      </div>`,
      onConfirm: () => {
        // The modal has closed by now; commit using the live-captured draft and validate.
        const errs = {};
        if (!draft.first.trim()) errs.first = 'First name is required.';
        if (!draft.last.trim()) errs.last = 'Last name is required.';
        if (!draft.email.trim()) errs.email = 'Email is required.';
        else if (!emailRe.test(draft.email.trim())) errs.email = 'Enter a valid email address.';
        else if (this.data.users.some(u => u.email.toLowerCase() === draft.email.trim().toLowerCase()))
          errs.email = 'A user with this email already exists.';
        if (Object.keys(errs).length) { toast(Object.values(errs)[0], 'error'); this.addUser(); return; }
        this.data.users.unshift({
          id: Date.now(), first_name: draft.first.trim(), last_name: draft.last.trim(),
          email: draft.email.trim(), role: draft.role, status: 'invited', last_active: null
        });
        toast('Invitation sent', 'success'); this.page = 1; this.draw();
      }
    });
    // Bind live capture + inline validation feedback.
    const bind = (id, key, validate) => {
      const inp = document.getElementById(id);
      const err = document.getElementById(id + '-err');
      if (!inp) return;
      inp.value = draft[key];
      inp.oninput = () => {
        draft[key] = inp.value;
        const msg = validate ? validate(inp.value) : '';
        if (err) err.textContent = msg || '';
        inp.classList.toggle('invalid', !!msg);
      };
    };
    bind('au-first', 'first', v => v.trim() ? '' : 'First name is required.');
    bind('au-last', 'last', v => v.trim() ? '' : 'Last name is required.');
    bind('au-email', 'email', v => !v.trim() ? 'Email is required.' : (emailRe.test(v.trim()) ? '' : 'Enter a valid email address.'));
    const roleSel = document.getElementById('au-role');
    if (roleSel) roleSel.onchange = () => { draft.role = roleSel.value; };
  },

  /* ---------------- BULK SNAPSHOT ---------------- */
  snapshot() {
    const s = this.data.bulk_upload_snapshot;
    return `
      <div class="section-label">Upload Confirmation &mdash; ${H.esc(s.filename)}</div>
      <p class="muted" style="font-size:12px;margin:-4px 0 12px">Role applied: ${H.esc(s.role)}</p>
      <div class="um-snap-cards">
        <div class="card"><div class="num good">${s.created}</div><div class="lbl">Created</div></div>
        <div class="card"><div class="num warn">${s.skipped}</div><div class="lbl">Skipped</div></div>
        <div class="card"><div class="num risk">${s.errors}</div><div class="lbl">Errors</div></div>
      </div>

      <div class="grid cols-2">
        <div class="panel-card pad-0">
          <h3 style="padding:16px 16px 0;margin:0">Users successfully uploaded</h3>
          <table class="data">
            <thead><tr><th>First</th><th>Last</th><th>Email</th><th>Role</th></tr></thead>
            <tbody>${s.success_list.map(u => `<tr>
              <td>${H.esc(u.first_name)}</td><td><b>${H.esc(u.last_name)}</b></td>
              <td class="muted">${H.esc(u.email)}</td><td>${H.esc(u.role)}</td></tr>`).join('')}</tbody>
          </table>
        </div>
        <div class="panel-card pad-0">
          <h3 style="padding:16px 16px 0;margin:0">Users not uploaded</h3>
          <table class="data">
            <thead><tr><th>First</th><th>Last</th><th>Email</th><th>Reason</th></tr></thead>
            <tbody>${[...s.failure_list, ...(s.skipped_list || [])].map(u => `<tr>
              <td>${H.esc(u.first_name)}</td><td><b>${H.esc(u.last_name)}</b></td>
              <td class="muted">${H.esc(u.email)}</td>
              <td><span class="pill risk">${H.esc(u.reason)}</span></td></tr>`).join('')}</tbody>
          </table>
        </div>
      </div>`;
  }
};
