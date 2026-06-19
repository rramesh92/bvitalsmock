/* App shell + hash router. Top-nav layout matching stg-bv.ascendlearning.com.
   Views register themselves on window.Views. */
window.Views = window.Views || {};

// sub-nav: some entries are dropdowns (children). Tabs highlight by `match` routes.
// Matches the real authenticated sub-nav: Admin▾, Dashboard, Quiz▾, Performance▾,
// Clinical Pearls, My CME/CE, Practice Exams. Admin menu = Classes + Assignments
// (Question/User/Usage are extra mock admin screens kept reachable here too).
const SUBNAV = [
  { label: 'Admin', caret: true, match: ['b2b', 'class-detail', 'question-management', 'user-management', 'usage-reports'], children: [
    { label: 'Classes', route: 'b2b/classes' },
    { label: 'Assignments', route: 'b2b/assignments' },
    { label: 'Question Management', route: 'question-management' },
    { label: 'User Management', route: 'user-management' },
    { label: 'Usage Reports', route: 'usage-reports' },
  ]},
  { label: 'Dashboard', route: 'dashboard', match: ['dashboard'] },
  { label: 'Quiz', caret: true, match: ['create-quiz', 'my-quizzes', 'take-quiz', 'results'], children: [
    { label: 'Create Quiz', route: 'create-quiz' },
    { label: 'My Quizzes', route: 'my-quizzes' },
  ]},
  { label: 'Performance', caret: true, match: ['performance', 'risk', 'performance-timeline', 'practice-exam-performance'], children: [
    { label: 'Performance Timeline', route: 'performance-timeline' },
    { label: 'Performance by Subject', route: 'performance' },
    { label: 'Readiness / Risk (mock)', route: 'risk' },
  ]},
  { label: 'Clinical Pearls', route: 'clinical-pearls', match: ['clinical-pearls'] },
  { label: 'My CME/CE', route: 'cme', match: ['cme'] },
  { label: 'Practice Exams', action: 'practice-exams', button: true, match: ['practice-exam-performance'] },
];
const BROWSE = [
  { label: 'Question Banks', route: 'question-banks' },
  { label: 'Search Questions', route: 'search' },
];

const App = {
  user: null, banks: null, selectedBankId: null, authed: false,

  async boot() {
    try {
      this.user = await DB.load('user');
      this.banks = await DB.load('question-banks');
      this.selectedBankId = this.banks.selected_question_bank_id;
    } catch (e) {}
    window.addEventListener('hashchange', () => this.route());
    this.route();
  },

  currentBank() {
    return (this.banks?.question_banks || []).find(b => b.id === this.selectedBankId) || {};
  },

  // Public (no-login) routes render full-page into #root (their own chrome).
  PUBLIC: ['storefront', 'product-page', 'register', 'login', 'ati', 'lti-launch'],

  route() {
    const hash = location.hash.replace(/^#\/?/, '');
    const [path, ...rest] = hash.split('/');
    const route = path || (this.authed ? 'dashboard' : 'storefront');
    if (this.PUBLIC.includes(route)) {
      this.closeMenus();
      this._built = false;
      const root = document.getElementById('root');
      root.innerHTML = '';
      (Views[route] || Views.storefront).render(root, rest);
      return;
    }
    if (!this.authed) { location.hash = '#/storefront'; return; }
    this.renderShell();
    const view = Views[route] || Views['dashboard'];
    view.render(document.getElementById('view-content'), rest);
    this.highlightNav(route);
  },

  // Public marketing header (navy utility bar + white nav) used by B2C pages.
  marketingHeaderHtml() {
    const specialties = ['Cardiology', 'Internal Medicine', 'Emergency Medicine', 'Family Medicine', 'Pediatrics', 'Psychiatry', 'Surgery', 'Radiology'];
    return `<div class="mk-header">
      <div class="mk-util">
        <a href="#/storefront">SUPPORT</a><span>|</span>
        <a href="#/login">LOG IN</a>
        <a class="mk-register" href="#/register">Register</a>
      </div>
      <div class="mk-nav">
        <a href="#/storefront" class="mk-logo"><img src="assets/img/board-vitals-logo.png" alt="BoardVitals" style="height:34px;display:block"/></a>
        <a href="#/storefront">Board Review ▾</a>
        <a href="#/storefront">CME</a>
        <a href="#/storefront">Nursing</a>
        <a href="#/storefront">Medical Students</a>
        <a href="#/storefront">More Specialties ▾</a>
        <a href="#/storefront">Institutions</a>
        <a href="#/storefront">Blog</a>
        <span class="mk-search"><input placeholder="Search Specialty/Exam"/></span>
        <a href="#/cart" class="mk-cart" title="Cart">${Icon.cart}</a>
      </div>
    </div>`;
  },

  renderLogin() {
    this.closeMenus();
    document.getElementById('root').innerHTML = '';
    document.getElementById('shell-built') && delete this._built;
    this._built = false;
    Views.login.render(document.getElementById('root'));
  },

  renderShell() {
    if (this._built && document.getElementById('view-content')) return;
    const u = this.user || { first_name: 'Guest', last_name: '' };
    const bank = this.currentBank();
    document.getElementById('root').innerHTML = `
      <div class="bv-shell">
        <header class="bv-header">
          <div class="bv-logo"><img src="assets/img/board-vitals-logo-white.png" alt="BoardVitals" style="height:30px;display:block" /></div>
          <div class="bv-qb">
            <span class="lbl">Question Bank:</span>
            <select id="qb-select" title="Active question bank"></select>
          </div>
          <button class="h-btn" id="cme-btn">My CME/CE</button>
          <button class="bv-exp" id="exp-badge" title="Plan Ends: June 3, 2028">EXTEND</button>
          <span class="bv-divider"></span>
          <a class="h-link" href="#/dashboard">HELP CENTER</a>
          <button class="icon-btn" id="cart-btn" title="Cart" style="color:#cdd9e4">${Icon.cart}</button>
          <span class="bv-divider"></span>
          <span class="bv-user" id="user-menu">${H.esc((u.first_name + (u.last_name?(' '+u.last_name):''))).toUpperCase()} ▾</span>
        </header>

        <nav class="bv-subnav" id="subnav"></nav>

        <main class="bv-main"><div class="bv-content" id="view-content"></div></main>
        ${this.footerHtml()}
      </div>`;
    this.renderSubnav();
    this.renderBankSwitcher();
    this.wire();
    this._built = true;
  },

  renderSubnav() {
    const nav = document.getElementById('subnav');
    nav.innerHTML = SUBNAV.map((it, i) => {
      if (it.children) {
        return `<a href="#" data-menu="m${i}" class="nav-tab">${it.label} <span class="caret">▼</span></a>`;
      }
      const cls = it.button ? 'review-btn' : '';
      if (it.action) return `<a class="${cls} nav-tab" href="#" data-action="${it.action}">${H.esc(it.label)}</a>`;
      return `<a class="${cls} nav-tab" href="#/${it.route}">${H.esc(it.label)}</a>`;
    }).join('') + `
      <div class="right">
        <a href="#" class="browse" data-menu="browse">Browse Questions <span class="caret">▼</span></a>
        <div class="bv-search"><input id="q-search" placeholder="Search Questions" />
          <button id="q-search-btn">${Icon.search || Icon.target}</button></div>
      </div>`;

    // dropdown menus
    nav.querySelectorAll('[data-menu]').forEach(a => a.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      const id = a.dataset.menu;
      this.closeMenus();
      let items = id === 'browse' ? BROWSE : SUBNAV[parseInt(id.slice(1))].children;
      const rect = a.getBoundingClientRect();
      const menu = document.createElement('div');
      menu.className = 'panel'; menu.id = 'dropdown';
      menu.style.cssText = `position:fixed;top:${rect.bottom+2}px;left:${rect.left}px;right:auto;width:200px`;
      menu.onclick = (ev) => ev.stopPropagation();
      menu.innerHTML = items.map(c => `<a class="notif" style="font-weight:600;color:var(--navy-800)" href="#/${c.route}">${H.esc(c.label)}</a>`).join('');
      document.body.appendChild(menu);
      menu.querySelectorAll('a').forEach(x => x.addEventListener('click', () => this.closeMenus()));
    });

    // action items (e.g. Practice Exams modal)
    nav.querySelectorAll('[data-action]').forEach(a => a.onclick = (e) => {
      e.preventDefault();
      if (a.dataset.action === 'practice-exams') this.practiceExamsModal();
    });
  },

  async practiceExamsModal() {
    let p; try { p = await DB.load('practice-exams'); } catch (e) { p = { exams: [] }; }
    const body = `<h2 style="margin:0 0 14px;font-size:17px;color:var(--navy-900)">Which exam are you preparing for?</h2>
      <div class="pe-list">${p.exams.map((name, i) => `
        <label class="pe-opt"><input type="radio" name="pe" value="${H.esc(name)}" data-pe/> <span>${H.esc(name)}</span></label>`).join('')}</div>`;
    openModal({
      title: 'Available Practice Exams',
      body,
      confirmLabel: 'Continue',
      onConfirm: () => { location.hash = '#/take-quiz'; }
    });
    // real modal: Continue is disabled until a radio is picked
    const ok = document.getElementById('modal-ok');
    if (ok) {
      ok.disabled = true;
      document.querySelectorAll('[data-pe]').forEach(r => r.addEventListener('change', () => { ok.disabled = false; }));
    }
    if (!document.getElementById('css-pe')) {
      const s = document.createElement('style'); s.id = 'css-pe';
      s.textContent = `.pe-list{max-height:50vh;overflow:auto;display:flex;flex-direction:column;gap:2px}
        .pe-opt{display:flex;align-items:center;gap:10px;padding:8px 6px;border-radius:6px;cursor:pointer;font-size:13.5px}
        .pe-opt:hover{background:var(--bg)}`;
      document.head.appendChild(s);
    }
  },

  renderBankSwitcher() {
    const sel = document.getElementById('qb-select');
    if (!sel || !this.banks) return;
    sel.innerHTML = this.banks.question_banks
      .map(b => `<option value="${b.id}" ${b.id === this.selectedBankId ? 'selected' : ''}>${H.esc(b.name)}</option>`).join('');
    sel.onchange = (e) => {
      this.selectedBankId = parseInt(e.target.value, 10);
      toast(`Switched to ${this.currentBank().name}`, 'success');
      this.route();
    };
  },

  wire() {
    document.getElementById('cme-btn').onclick = () => { location.hash = '#/cme'; };
    document.getElementById('exp-badge').onclick = () => toast('Extend your plan (mocked)');
    document.getElementById('cart-btn').onclick = () => { location.hash = '#/cart'; };
    document.getElementById('q-search-btn').onclick = () => { location.hash = '#/search'; };
    document.getElementById('q-search').onkeydown = (e) => { if (e.key === 'Enter') location.hash = '#/search'; };
    document.getElementById('user-menu').onclick = (e) => {
      e.stopPropagation(); this.closeMenus();
      const rect = e.target.getBoundingClientRect();
      const menu = document.createElement('div');
      menu.className = 'panel'; menu.id = 'dropdown';
      menu.style.cssText = `position:fixed;top:${rect.bottom+8}px;right:18px;left:auto;width:230px`;
      menu.onclick = (ev) => ev.stopPropagation();
      menu.innerHTML = `
        <a class="notif" style="font-weight:600;color:var(--navy-800)" href="#/account">Account & Billing</a>
        <a class="notif" style="font-weight:600;color:var(--navy-800)" href="#/cart">Cart &amp; Checkout</a>
        <a class="notif" style="font-weight:600;color:var(--navy-800)" href="#/states-demo">UI States Demo</a>
        <a class="notif" style="font-weight:600;color:var(--muted)" href="#/storefront">View: B2C Storefront</a>
        <a class="notif" style="font-weight:600;color:var(--muted)" href="#/ati">View: ATI embed</a>
        <a class="notif" style="font-weight:600;color:var(--muted)" href="#/lti-launch">View: LTI launch</a>
        <a class="notif" style="font-weight:600;color:var(--muted)" href="#/no-subscriptions">View: No Subscriptions</a>
        <a class="notif" style="font-weight:600;color:var(--muted)" href="#/not-yet-verified">View: Not Yet Verified</a>
        <a class="notif" style="font-weight:600;color:var(--risk)" href="#" id="logout-link">Sign out</a>`;
      document.body.appendChild(menu);
      menu.querySelectorAll('a').forEach(x => x.addEventListener('click', () => this.closeMenus()));
      document.getElementById('logout-link').addEventListener('click', (ev) => { ev.preventDefault(); this.logout(); });
    };
    document.addEventListener('click', () => this.closeMenus());
  },

  footerHtml() {
    const yr = 2026;
    const col = (title, links) => `<div class="ft-col"><h4>${title}</h4><ul>${links.map(l => `<li><a href="${l[1]}">${H.esc(l[0])}</a></li>`).join('')}</ul></div>`;
    return `<footer class="bv-footer">
      <div class="bv-footer-inner">
        ${col('SUPPORT', [['Customer Support','#/dashboard'],['Help FAQs','#/dashboard'],['support@boardvitals.com','#/dashboard'],['(877) 221-1529','#/dashboard']])}
        ${col('COMPANY', [['About BoardVitals','#/dashboard'],['Testimonials','#/dashboard'],['Institutions','#/dashboard'],['Terms & Conditions','#/dashboard'],['Privacy Policy','#/dashboard']])}
        ${col('RESOURCES', [['BoardVitals Blog','#/dashboard'],['What is CME?','#/cme'],['CME Coach','#/cme'],['Understanding the NCLEX®','#/question-banks'],['Refer a Friend','#/dashboard']])}
        <div class="ft-col">
          <h4>MOBILE APP</h4>
          <div class="ft-badges"><span class="ft-badge"> App Store</span><span class="ft-badge">▶ Google Play</span></div>
          <h4 style="margin-top:18px">FOLLOW</h4>
          <div class="ft-social"><span>f</span><span>𝕏</span><span>in</span><span>◉</span></div>
        </div>
      </div>
      <div class="bv-footer-bar">© ${yr} BoardVitals · Mock UI — static replica for stakeholder review (not the live site)</div>
    </footer>`;
  },

  closeMenus() { document.getElementById('dropdown')?.remove(); },

  highlightNav(route) {
    const tabs = document.querySelectorAll('#subnav .nav-tab');
    let i = 0;
    SUBNAV.forEach(it => {
      const tab = tabs[i++];
      if (tab) tab.classList.toggle('active', (it.match || []).includes(route));
    });
  },

  logout() { this.authed = false; this._built = false; location.hash = '#/login'; },
};

/* ---- global modal + toast helpers ---- */
window.openModal = function ({ title, body, confirmLabel = 'Confirm', onConfirm, danger }) {
  const host = document.getElementById('modal-host');
  host.innerHTML = `<div class="overlay" id="overlay">
    <div class="modal">
      <div class="modal-head"><h3 style="margin:0">${H.esc(title)}</h3>
        <button class="icon-btn" id="modal-x">${Icon.x}</button></div>
      <div class="modal-body">${body}</div>
      <div class="modal-foot">
        <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="modal-ok">${H.esc(confirmLabel)}</button>
      </div>
    </div></div>`;
  const close = () => { host.innerHTML = ''; };
  document.getElementById('overlay').onclick = (e) => { if (e.target.id === 'overlay') close(); };
  document.getElementById('modal-x').onclick = close;
  document.getElementById('modal-cancel').onclick = close;
  document.getElementById('modal-ok').onclick = () => { close(); onConfirm && onConfirm(); };
};
window.closeModal = () => { document.getElementById('modal-host').innerHTML = ''; };

window.toast = function (msg, type = '', opts = {}) {
  const host = document.getElementById('toast-host');
  const el = document.createElement('div');
  el.className = `toast ${type} ${opts.onClick ? 'toast-action' : ''}`;
  el.innerHTML = `${type === 'success' ? Icon.check : type === 'error' ? Icon.alert : Icon.bell}<span>${H.esc(msg)}</span>`;
  if (opts.onClick) {
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.onclick = () => opts.onClick();
    el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') opts.onClick(); };
  }
  host.appendChild(el);
  setTimeout(() => el.remove(), opts.duration || 3200);
};

document.addEventListener('DOMContentLoaded', () => App.boot());
window.App = App;
