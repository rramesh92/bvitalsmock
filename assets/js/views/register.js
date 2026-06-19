window.Views = window.Views || {};
// B2C registration (no login) — mirrors /users/sign_up.
window.Views.register = {
  render(root) {
    root.innerHTML = `
      ${App.marketingHeaderHtml()}
      <div class="mk-page" style="padding:32px 26px">
        <div class="card" style="max-width:760px;margin:0 auto;background:#f3f5f7">
          <div class="between" style="margin-bottom:18px">
            <h1 style="margin:0;color:var(--navy-900)">Register</h1>
            <span class="muted">Already registered? <a href="#/login">Log In</a></span>
          </div>
          <form id="reg-form" style="max-width:560px;margin:0 auto">
            <div class="grid cols-2">
              <div class="field"><label>First Name</label><input id="r-first" required/></div>
              <div class="field"><label>Last Name</label><input id="r-last" required/></div>
            </div>
            <div class="field"><label>Email Address</label><input id="r-email" type="email" required/></div>
            <div class="field"><label>Password</label><input id="r-pw" type="password" required/></div>
            <div class="field"><label>Confirm Password</label><input id="r-pw2" type="password" required/></div>
            <div class="field"><label>Your profession is: <span class="text-risk">*</span></label>
              <select id="r-prof" required><option value="">Select…</option>
                <option>Physician</option><option>Physician Assistant</option><option>Nurse Practitioner</option>
                <option>Nurse</option><option>Medical Student</option><option>Resident</option><option>Other</option></select></div>
            <div id="r-err" class="error-banner" style="display:none;margin-bottom:12px"></div>
            <button type="submit" class="btn btn-primary btn-block btn-lg">Create an account</button>
            <p class="muted mt-8" style="text-align:center;font-size:12px">Mock UI — no real account is created.</p>
          </form>
        </div>
      </div>
      ${App.footerHtml()}`;

    document.getElementById('reg-form').onsubmit = (e) => {
      e.preventDefault();
      const v = (id) => document.getElementById(id).value.trim();
      const err = document.getElementById('r-err');
      const show = (m) => { err.style.display = 'flex'; err.innerHTML = `${Icon.alert}<div>${H.esc(m)}</div>`; };
      if (!v('r-first') || !v('r-last') || !v('r-email') || !v('r-pw') || !v('r-prof')) return show('Please complete all required fields.');
      if (v('r-pw') !== v('r-pw2')) return show('Passwords do not match.');
      App.authed = true; toast('Account created', 'success'); location.hash = '#/dashboard';
    };
  }
};
