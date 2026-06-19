window.Views = window.Views || {};
window.Views['not-yet-verified'] = {
  async render(el) {
    this.injectCss();
    const name = App.user ? `${App.user.first_name || ''} ${App.user.last_name || ''}`.trim() : '';
    el.innerHTML = `
      <div class="nv-wrap">
        <div class="nv-welcome">
          <h1>Welcome to BoardVitals${name ? `, ${H.esc(name)}` : ''}!</h1>
          <p class="subtitle">Confirm your email to verify your account. Be sure to check spam or junk if you don't see it in your inbox.</p>
        </div>

        <div class="grid cols-2">
          <button class="panel-card nv-choice" id="nv-individual" type="button">
            <div class="nv-ic">${Icon.user}</div>
            <h2>Individual user</h2>
            <p class="muted">I signed up on my own to study with BoardVitals question banks.</p>
            <span class="nv-go">Continue ›</span>
          </button>
          <button class="panel-card nv-choice" id="nv-institutional" type="button">
            <div class="nv-ic">${Icon.users}</div>
            <h2>Institutional user</h2>
            <p class="muted">My school or program gave me access to BoardVitals.</p>
            <span class="nv-go">Continue ›</span>
          </button>
        </div>

        <div class="panel-card nv-resend">
          <span class="nv-ic-sm">${Icon.bell}</span>
          <p>Need to resend the confirmation email? <a href="#" id="nv-resend">Resend now</a>.</p>
        </div>
      </div>`;

    el.querySelector('#nv-individual').onclick = () => toast('Selected: Individual user', 'info');
    el.querySelector('#nv-institutional').onclick = () => toast('Selected: Institutional user', 'info');
    el.querySelector('#nv-resend').onclick = (e) => { e.preventDefault(); toast('Confirmation email resent', 'success'); };
  },

  injectCss() {
    if (document.getElementById('css-not-yet-verified')) return;
    const s = document.createElement('style');
    s.id = 'css-not-yet-verified';
    s.textContent = `
      .nv-wrap{max-width:860px;margin:0 auto}
      .nv-welcome{text-align:center;margin:8px 0 22px}
      .nv-choice{text-align:center;cursor:pointer;border:1px solid var(--line);background:#fff;font:inherit;transition:border-color .15s,box-shadow .15s}
      .nv-choice:hover{border-color:var(--info);box-shadow:0 2px 10px rgba(27,57,80,.08)}
      .nv-choice h2{margin:8px 0 6px;color:var(--navy-900)}
      .nv-choice .nv-ic{width:44px;height:44px;margin:0 auto 6px;color:var(--info)}
      .nv-choice .nv-ic svg{width:44px;height:44px}
      .nv-choice .nv-go{display:inline-block;margin-top:10px;font-weight:700;color:var(--info)}
      .nv-resend{display:flex;align-items:center;gap:10px;margin-top:16px;background:var(--teal-050)}
      .nv-resend .nv-ic-sm{width:22px;height:22px;color:var(--info);flex:0 0 auto}
      .nv-resend .nv-ic-sm svg{width:22px;height:22px}
      .nv-resend p{margin:0}`;
    document.head.appendChild(s);
  }
};
