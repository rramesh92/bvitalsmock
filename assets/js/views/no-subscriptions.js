window.Views = window.Views || {};
window.Views['no-subscriptions'] = {
  async render(el) {
    this.injectCss();
    el.innerHTML = `
      <div class="ns-wrap">
        <div class="ns-welcome">
          <h1>Welcome to BoardVitals!</h1>
          <p class="subtitle">You don't have any active subscriptions yet.</p>
        </div>

        <div class="panel-card ns-card">
          <div class="ns-icon">${Icon.inbox}</div>
          <h2>No active subscriptions</h2>
          <p class="muted">Browse our question banks to get started, or try out free questions before you buy. If you purchased BoardVitals from another source, enter your access code below.</p>
          <div class="ns-ctas">
            <a class="btn btn-primary" href="#/question-banks">Browse Question Banks</a>
            <button class="btn btn-secondary" id="ns-free">Access Free Questions</button>
          </div>
        </div>

        <div class="grid cols-2 mt-16">
          <div class="panel-card">
            <h3>Individual user</h3>
            <p class="muted">If you purchased BoardVitals from another source and were provided with an access code, enter it here.</p>
            <div class="ns-code">
              <input type="text" id="ns-access-code" placeholder="Enter access code" />
              <button class="btn btn-primary" id="ns-redeem">Redeem</button>
            </div>
          </div>
          <div class="panel-card">
            <h3>Institutional user</h3>
            <p class="muted">If you are a first-time institutional user and your institution has access to BoardVitals, please reach out to your institution directly.</p>
            <p class="muted">If your access previously came through your institution, it may have changed. Contact your institution for more information.</p>
          </div>
        </div>
      </div>`;

    el.querySelector('#ns-free').onclick = () => { location.hash = '#/question-banks'; toast('Loading free sample questions', 'info'); };
    el.querySelector('#ns-redeem').onclick = () => {
      const code = el.querySelector('#ns-access-code').value.trim();
      if (!code) return toast('Enter an access code first', 'warn');
      toast('Access code redeemed (mock)', 'success');
    };
  },

  injectCss() {
    if (document.getElementById('css-no-subscriptions')) return;
    const s = document.createElement('style');
    s.id = 'css-no-subscriptions';
    s.textContent = `
      .ns-wrap{max-width:860px;margin:0 auto}
      .ns-welcome{text-align:center;margin:8px 0 22px}
      .ns-card{text-align:center;padding:36px 28px}
      .ns-card h2{margin:8px 0 6px;color:var(--navy-900)}
      .ns-card .ns-icon{width:56px;height:56px;margin:0 auto 8px;color:var(--info)}
      .ns-card .ns-icon svg{width:56px;height:56px}
      .ns-card p{max-width:520px;margin:0 auto 18px}
      .ns-ctas{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
      .ns-code{display:flex;gap:10px;margin-top:12px}
      .ns-code input{flex:1;padding:9px 12px;border:1px solid var(--line);border-radius:6px;font:inherit}`;
    document.head.appendChild(s);
  }
};
