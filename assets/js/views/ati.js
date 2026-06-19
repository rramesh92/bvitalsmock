window.Views = window.Views || {};
// ATI integration — ATI-branded header wrapping embedded BoardVitals content.
// Per product doc: iframe-style embed, only NCLEX-PN / NCLEX-RN, quiz-sharing disabled.
window.Views.ati = {
  render(root) {
    root.innerHTML = `
      <div class="ati-shell">
        <header class="ati-header">
          <div class="ati-brand">ATI <span>Nursing Education</span></div>
          <nav><a href="#/ati">Home</a><a href="#/ati">My ATI</a><a href="#/ati">Resources</a><a href="#/ati">Help</a></nav>
          <div class="ati-user">${Icon.user} Nursing Student</div>
        </header>
        <div class="ati-embed-note">${Icon.shield} Powered by BoardVitals — embedded question bank experience (ATI students: NCLEX-PN &amp; NCLEX-RN only).</div>

        <main class="ati-content">
          <h1>NCLEX Practice — Powered by BoardVitals</h1>
          <p class="muted">Quiz-sharing features are disabled for ATI users.</p>

          <div class="section-label mt-16">Your Question Banks</div>
          <div class="grid cols-2">
            ${[['NCLEX-RN (Next Gen)', 2600], ['NCLEX-PN', 1900]].map(([n, q]) => `
              <div class="panel-card">
                <div class="between"><h3 style="margin:0">${n}</h3><span class="pill warn">NGN</span></div>
                <p class="muted">${q.toLocaleString()} board-style questions with explanations.</p>
                <button class="btn btn-primary" data-start>${Icon.bolt} Start Quiz</button>
              </div>`).join('')}
          </div>

          <div class="grid cols-3 mt-16">
            <div class="card stat"><div class="value">42%</div><div class="label">Score</div></div>
            <div class="card stat"><div class="value">128</div><div class="label">Answered</div></div>
            <div class="card stat"><div class="value">36<small style="font-size:14px">th</small></div><div class="label">Peer percentile</div></div>
          </div>
        </main>
        <div class="ati-foot">© 2026 ATI · Content delivered by BoardVitals (mock embed)</div>
      </div>`;
    if (!document.getElementById('css-ati')) {
      const s = document.createElement('style'); s.id = 'css-ati';
      s.textContent = `
        .ati-shell{min-height:100vh;background:#eef3f6;display:flex;flex-direction:column}
        .ati-header{background:#0b5d8f;color:#fff;display:flex;align-items:center;gap:24px;padding:0 26px;height:60px}
        .ati-header .ati-brand{font-weight:800;font-size:22px;letter-spacing:1px} .ati-header .ati-brand span{font-size:11px;font-weight:600;opacity:.85;letter-spacing:.5px}
        .ati-header nav{display:flex;gap:18px;margin-left:10px} .ati-header nav a{color:#dcebf5;font-weight:600;font-size:14px} .ati-header nav a:hover{color:#fff}
        .ati-header .ati-user{margin-left:auto;display:flex;align-items:center;gap:6px;font-weight:600;font-size:13px} .ati-header .ati-user svg{width:18px;height:18px}
        .ati-embed-note{background:#fff4d6;border-bottom:1px solid #f0dca0;color:#8a5d12;padding:8px 26px;font-size:12.5px;display:flex;align-items:center;gap:8px} .ati-embed-note svg{width:15px;height:15px}
        .ati-content{flex:1;max-width:1080px;width:100%;margin:0 auto;padding:24px 26px}
        .ati-foot{background:#0b3d5c;color:#bcd3e3;text-align:center;padding:14px;font-size:12px}`;
      document.head.appendChild(s);
    }
    root.querySelectorAll('[data-start]').forEach(b => b.onclick = () => toast('Launching embedded quiz (mocked)'));
  }
};
