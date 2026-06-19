window.Views = window.Views || {};
window.Views.login = {
  render(root) {
    injectLoginCss();
    root.innerHTML = `
      <div class="auth-wrap login-centered">
        <div class="account-wall">
          <div class="login-brand">${Icon.logo || ''}<b>BoardVitals</b></div>
          <div class="panel panel-default">
            <div class="panel-heading">
              <h3 class="panel-title">Login to continue to BoardVitals</h3>
            </div>
            <div class="panel-body">
              <form class="auth-form" id="login-form">
                <div class="field">
                  <input id="email" type="email" class="form-control" placeholder="Email" value="jordan.avery@example.com" />
                </div>
                <div class="field">
                  <input id="password" type="password" class="form-control" placeholder="Password" value="••••••••••" />
                </div>
                <label class="remember-row">
                  <input id="remember-cb" type="checkbox" checked /> Remember me
                </label>
                <button type="submit" class="btn btn-primary btn-block btn-lg">Login</button>
                <div class="login-links">
                  <a href="#/login" id="forgot-btn" class="need-help">Forgot your password?</a>
                </div>
                <button type="button" class="btn btn-secondary btn-block" id="sso-btn">Continue with institution SSO / LTI</button>
                <p class="muted login-foot">
                  Already registered? <a href="#/login">Log In</a> · Mock UI — no real authentication.</p>
              </form>
            </div>
          </div>
        </div>
      </div>`;
    const signIn = () => { App.authed = true; location.hash = '#/dashboard'; };
    document.getElementById('login-form').onsubmit = (e) => { e.preventDefault(); signIn(); };
    document.getElementById('sso-btn').onclick = () => { toast('SSO/LTI launch is mocked', ''); signIn(); };
    document.getElementById('forgot-btn').onclick = (e) => { e.preventDefault(); toast('Password reset is mocked', ''); };
  }
};

function injectLoginCss() {
  if (document.getElementById('css-login')) return;
  const st = document.createElement('style');
  st.id = 'css-login';
  st.textContent = `
    .login-centered{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8f8f8;padding:24px}
    .account-wall{width:100%;max-width:460px}
    .login-brand{display:flex;align-items:center;gap:8px;justify-content:center;margin-bottom:18px;color:var(--navy-900);font-size:22px}
    .login-brand svg{height:30px}
    .panel.panel-default{background:#fff;border:1px solid var(--line);border-radius:8px;overflow:hidden;box-shadow:0 2px 14px rgba(27,57,80,.08)}
    .panel-heading{padding:18px 24px;border-bottom:1px solid var(--line);background:var(--teal-050)}
    .panel-title{margin:0;font-size:18px;color:var(--navy-900);text-align:center;font-weight:700}
    .panel-body{padding:24px}
    .login-centered .form-control{width:100%}
    .remember-row{display:flex;gap:8px;align-items:center;font-size:13px;color:var(--muted);margin:4px 0 18px;font-weight:500}
    .btn-primary.btn-lg{background:var(--info);border-color:var(--info);color:#fff}
    .login-links{text-align:center;margin:14px 0}
    .login-links a{font-size:13px}
    .login-foot{text-align:center;font-size:12.5px;margin-top:20px}`;
  document.head.appendChild(st);
}
