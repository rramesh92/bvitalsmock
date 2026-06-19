window.Views = window.Views || {};
window.Views.account = {
  tab: 'profile',
  async render(el) {
    el.innerHTML = skeleton(6);
    let s, u;
    try { s = await DB.load('subscriptions'); u = App.user; }
    catch (e) { el.innerHTML = errorState(e.message); return; }

    injectAccountCss();

    const tabs = [
      ['profile', 'Profile'],
      ['products', 'My Products'],
      ['password', 'Reset Password'],
      ['cards', 'Credit Cards'],
      ['privacy', 'Privacy & Sharing']
    ];

    el.innerHTML = `
      <div class="page-head"><div><h1>Settings</h1></div>
        <button class="btn btn-secondary" id="logout-btn">Sign out</button></div>

      <div class="card pad-0 settings-tray">
        <div class="settings-navhead">${H.esc(u.first_name)} ${H.esc(u.last_name)}</div>
        <div class="seg settings-seg" id="acct-tabs">
          ${tabs.map(t => `<button data-tab="${t[0]}" class="${this.tab===t[0]?'active':''}">${t[1]}</button>`).join('')}
        </div>
        <div class="settings-body" id="acct-body"></div>
      </div>`;

    const renderBody = () => {
      const body = document.getElementById('acct-body');
      if (this.tab === 'profile') body.innerHTML = this.profileHtml(u);
      else if (this.tab === 'products') body.innerHTML = this.productsHtml(s);
      else if (this.tab === 'password') body.innerHTML = this.passwordHtml();
      else if (this.tab === 'cards') body.innerHTML = this.cardsHtml(s);
      else body.innerHTML = this.privacyHtml();
      this.bindBody(body);
    };
    renderBody();

    el.querySelectorAll('#acct-tabs button').forEach(b => b.onclick = () => {
      this.tab = b.dataset.tab;
      el.querySelectorAll('#acct-tabs button').forEach(x => x.classList.toggle('active', x === b));
      renderBody();
    });
    document.getElementById('logout-btn').onclick = () => App.logout();
  },

  profileHtml(u) {
    return `
      <h2 class="settings-h2">Profile</h2>
      <div class="settings-form">
        <div class="row" style="margin-bottom:18px">
          <div class="avatar" style="width:52px;height:52px;font-size:18px">${H.initials(u.first_name, u.last_name)}</div>
          <div><b>${H.esc(u.first_name)} ${H.esc(u.last_name)}</b><br><small class="muted">${H.esc(u.email)}</small></div>
        </div>
        <div class="field"><label>Email</label><input type="email" value="${H.esc(u.email)}"/></div>
        <div class="field"><label>First Name</label><input value="${H.esc(u.first_name)}"/></div>
        <div class="field"><label>Last Name</label><input value="${H.esc(u.last_name)}"/></div>
        <div class="field"><label>Profession</label>
          <select><option selected>${H.esc(u.sub_user_type)}</option><option>Physician</option><option>Medical Student</option><option>Nurse</option></select></div>
        <div class="field"><label>Specialty</label>
          <select><option selected>Internal Medicine</option><option>Cardiology</option><option>Family Medicine</option></select></div>
        <button class="btn btn-primary" id="profile-save">Save</button>
      </div>`;
  },

  productsHtml(s) {
    const groups = [
      ['active', 'Active'],
      ['delayed', 'Delayed'],
      ['expired', 'Expired']
    ];
    return `<h2 class="settings-h2">My Products</h2>
      ${groups.map(([key, label]) => {
        const rows = s.subscriptions.filter(x => x.status === key);
        if (!rows.length) return '';
        return `<div class="my-products-section">
          <h3 class="settings-h3">${label}</h3>
          <table class="data products-table">
            <tbody>${rows.map(x => `<tr>
              <td>
                <b>${H.esc(x.question_bank)}</b>
                ${x.plan ? `<div class="muted" style="font-size:12.5px">${H.esc(x.plan)}${x.price ? ` · $${x.price}` : ''}</div>` : ''}
                <div class="muted" style="font-size:12.5px">Expires ${H.date(x.expiration_date)}</div>
                ${key === 'active' ? `<div class="bxd-row"><label>Board Exam Date:</label>
                  <input type="date" data-bxd="${x.id}" value="${x.board_exam_date || ''}"/></div>` : ''}
              </td>
              <td style="text-align:right;white-space:nowrap">
                ${key === 'active' ? '<button class="btn btn-danger" data-reset="' + x.id + '">Reset</button>' : ''}
              </td>
            </tr>`).join('')}</tbody>
          </table>
        </div>`;
      }).join('')}`;
  },

  passwordHtml() {
    return `<h2 class="settings-h2">Reset Password</h2>
      <div class="settings-form">
        <p class="muted" style="font-size:12.5px">All fields <i>are required</i></p>
        <div class="field"><label>Current Password</label><input type="password"/></div>
        <div class="field"><label>New Password</label><input type="password"/></div>
        <div class="field"><label>Confirm New Password</label><input type="password"/></div>
        <button class="btn btn-primary" id="pw-save">Save</button>
      </div>`;
  },

  cardsHtml(s) {
    const cards = s.payment_methods || [];
    return `<h2 class="settings-h2">My Credit Cards</h2>
      ${cards.length ? `<table class="data products-table"><tbody>${cards.map(p => `<tr>
        <td><b>**** **** **** ${p.last4}</b>${p.default ? ' <span class="pill">Default</span>' : ''}
          <div class="muted" style="font-size:12.5px">Expires on: ${p.exp_month}/${p.exp_year}</div></td>
        <td style="text-align:right;white-space:nowrap">
          <button class="btn btn-primary" data-editcard="${p.id}">Edit</button>
          <button class="btn btn-danger" data-rmcard="${p.last4}" style="margin-left:8px">Remove</button></td>
      </tr>`).join('')}</tbody></table>`
        : '<p class="muted">No credit card on file</p>'}`;
  },

  privacyHtml() {
    const st = AdaptivePrep.read();
    return `<h2 class="settings-h2">Privacy & Sharing</h2>
      <div class="settings-form">
        <div class="panel-card" style="padding:16px">
          <div class="between" style="align-items:flex-start;gap:12px">
            <div>
              <h3 class="settings-h3">Share Adaptive Prep details with instructors</h3>
              <p class="muted mb-0">When this is off, class reports show only aggregate cohort trends. Your daily sessions, Friday Checkpoint score, confidence ratings, and weekly report details stay private.</p>
            </div>
            <label class="row" style="gap:8px;font-weight:700;color:var(--navy-900)">
              <input type="checkbox" id="adaptive-share-toggle" ${st.share_with_admin ? 'checked' : ''}/>
              ${st.share_with_admin ? 'On' : 'Off'}
            </label>
          </div>
        </div>
        <div class="panel-card" style="padding:16px;margin-top:16px">
          <h3 class="settings-h3">Early completion handling</h3>
          <p class="muted">When practice overlaps with another day's planned topic, choose whether to ask each time or apply your saved choice.</p>
          <div class="field mb-0">
            <label>Preference</label>
            <select id="early-completion-pref">
              <option value="" ${!st.early_completion_preference ? 'selected' : ''}>Ask every time</option>
              <option value="mark" ${st.early_completion_preference === 'mark' ? 'selected' : ''}>Mark the planned day complete</option>
              <option value="separate" ${st.early_completion_preference === 'separate' ? 'selected' : ''}>Keep activity and plan separate</option>
            </select>
          </div>
        </div>
      </div>`;
  },

  bindBody(body) {
    const save = body.querySelector('#profile-save');
    if (save) save.onclick = () => toast('Profile saved', 'success');
    const pw = body.querySelector('#pw-save');
    if (pw) pw.onclick = () => toast('Password updated', 'success');
    body.querySelectorAll('[data-reset]').forEach(b => b.onclick = () => toast('Question bank reset is mocked'));
    body.querySelectorAll('[data-editcard]').forEach(b => b.onclick = () => toast('Edit Credit Card form is mocked'));
    body.querySelectorAll('[data-rmcard]').forEach(b => b.onclick = () => toast(`Remove card ending in ${b.dataset.rmcard} is mocked`));
    body.querySelectorAll('[data-bxd]').forEach(b => b.onchange = () => toast('Board exam date saved', 'success'));
    const share = body.querySelector('#adaptive-share-toggle');
    if (share) share.onchange = () => {
      AdaptivePrep.setShareWithAdmin(share.checked);
      toast(share.checked ? 'Adaptive Prep sharing is on' : 'Adaptive Prep sharing is off', 'success');
      this.tab = 'privacy';
      const root = document.getElementById('view-content');
      if (root) this.render(root);
    };
    const earlyPref = body.querySelector('#early-completion-pref');
    if (earlyPref) earlyPref.onchange = () => {
      AdaptivePrep.setEarlyCompletionPreference(earlyPref.value || null);
      toast('Early completion preference saved', 'success');
    };
  }
};

function injectAccountCss() {
  if (document.getElementById('css-account')) return;
  const st = document.createElement('style');
  st.id = 'css-account';
  st.textContent = `
    .settings-tray{border:1px solid var(--line);overflow:hidden}
    .settings-navhead{padding:14px 20px;font-weight:700;color:var(--navy-900);border-bottom:1px solid var(--line);background:var(--teal-050)}
    .settings-seg{margin:0;border-bottom:1px solid var(--line);border-radius:0}
    .settings-body{padding:24px}
    .settings-h2{margin:0 0 18px;font-size:20px;color:var(--navy-900)}
    .settings-h3{margin:0 0 10px;font-size:15px;color:var(--navy-900)}
    .settings-form{max-width:520px}
    .my-products-section{margin-bottom:32px}
    .products-table td{vertical-align:middle}
    .bxd-row{display:flex;align-items:center;gap:8px;margin-top:8px}
    .bxd-row label{font-size:12.5px;color:var(--muted);margin:0}
    .bxd-row input{max-width:170px}`;
  document.head.appendChild(st);
}
