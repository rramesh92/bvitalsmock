window.Views = window.Views || {};
// LTI partner launch — a partner LMS launches BoardVitals via LTI (embedded, minimal chrome).
window.Views['lti-launch'] = {
  render(root) {
    root.innerHTML = `
      <div class="lti-shell">
        <header class="lti-header">
          <div class="lti-partner">Partner LMS</div>
          <span class="lti-sep">›</span>
          <div class="lti-bv"><img src="assets/img/board-vitals-logo-white.png" alt="BoardVitals" style="height:22px;vertical-align:middle"/></div>
          <a class="lti-return" href="#/lti-launch">⤴ Return to Partner LMS</a>
        </header>
        <div class="lti-launchbar">${Icon.shield} Launched via LTI from <b>Partner LMS</b> — single sign-on session (no BoardVitals login required).</div>

        <main class="lti-content">
          <h1>Cardiology Assignment — Block 3</h1>
          <p class="muted">Assigned through your LMS · 25 questions · Test mode · Due Jun 28, 2026</p>
          <div class="panel-card" style="max-width:560px">
            <h3>Ready to begin?</h3>
            <p class="muted">Your results sync back to Partner LMS when you submit.</p>
            <div class="row" style="gap:10px">
              <button class="btn btn-primary" id="lti-start">${Icon.bolt} Launch Assignment</button>
              <span class="pill muted">Grade passback: enabled</span>
            </div>
          </div>
        </main>
      </div>`;
    if (!document.getElementById('css-lti')) {
      const s = document.createElement('style'); s.id = 'css-lti';
      s.textContent = `
        .lti-shell{min-height:100vh;background:var(--bg);display:flex;flex-direction:column}
        .lti-header{background:#3b2f63;color:#fff;display:flex;align-items:center;gap:12px;padding:0 24px;height:56px}
        .lti-header .lti-partner{font-weight:800;font-size:16px} .lti-header .lti-sep{opacity:.6} .lti-header .lti-return{margin-left:auto;color:#d6cdf0;font-weight:600;font-size:13px}
        .lti-launchbar{background:var(--teal-050);border-bottom:1px solid #cfe0f5;color:var(--navy-800);padding:9px 24px;font-size:12.5px;display:flex;align-items:center;gap:8px} .lti-launchbar svg{width:15px;height:15px}
        .lti-content{flex:1;max-width:900px;width:100%;margin:0 auto;padding:26px 24px}`;
      document.head.appendChild(s);
    }
    document.getElementById('lti-start').onclick = () => { App.authed = true; location.hash = '#/take-quiz'; };
  }
};
