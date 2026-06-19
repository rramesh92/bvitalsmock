window.Views = window.Views || {};
// B2C public storefront landing (no login) — mirrors stg-bv.ascendlearning.com home.
window.Views.storefront = {
  product: 'exam', // exam | cme
  tab: 'INITIAL CERTIFICATION',
  async render(root) {
    let d;
    try { d = await DB.load('storefront'); }
    catch (e) { root.innerHTML = errorState(e.message); return; }

    const specs = d.spec_tabs[this.tab] || [];
    root.innerHTML = `
      ${App.marketingHeaderHtml()}
      <div class="mk-hero"><div class="mk-page">
        <h1>The Standard in Healthcare Board Exam Prep &amp; CME</h1>
        <p><b>Join the 1.5M+ practitioners</b> who've trusted BoardVitals online practice questions to prepare for their board exams and earn CME credits.</p>
        <div class="mk-finder">
          <div class="between" style="margin-bottom:12px"><b>Get started today and gain exam-ready confidence</b>
            <a href="#/storefront">Institutional Packages</a></div>
          <div class="row-controls">
            <div class="seg" id="sf-product">
              <button data-p="exam" class="${this.product==='exam'?'active':''}">Exam Prep</button>
              <button data-p="cme" class="${this.product==='cme'?'active':''}">CME</button>
            </div>
            <select class="field-inline" id="sf-occ"><option>Select Occupation</option>${d.occupations.map(o=>`<option>${H.esc(o)}</option>`).join('')}</select>
            <select class="field-inline" id="sf-spec"><option>Select Specialty/Exam</option>${specs.map(s=>`<option>${H.esc(s)}</option>`).join('')}</select>
            <button class="btn btn-primary" id="sf-find">Find My Question Bank</button>
          </div>
        </div>
      </div></div>

      <div class="mk-page mk-stats">
        <div class="mk-stat"><div class="n">2K+</div><div class="l">Institutions Trust BoardVitals</div></div>
        <div class="mk-stat"><div class="n">1.5M+</div><div class="l">Practitioners Trained</div></div>
        <div class="mk-stat"><div class="n">35</div><div class="l">Accredited CME Specialties</div></div>
      </div>

      <div class="mk-page" style="padding-bottom:40px">
        <h2 style="text-align:center">Try BoardVitals Free Today</h2>
        <p class="muted" style="text-align:center">No credit card required. Find your specialty below.</p>
        <div class="mk-spec-tabs" id="sf-tabs">
          ${Object.keys(d.spec_tabs).map(t=>`<button data-t="${H.esc(t)}" class="${this.tab===t?'active':''}">${H.esc(t)}</button>`).join('')}
        </div>
        <div class="mk-spec-grid">
          ${specs.map(s=>`<a href="#/product-page" data-spec="${H.esc(s)}">${H.esc(s)}</a>`).join('')}
        </div>
      </div>
      ${App.footerHtml()}`;

    if (!document.getElementById('css-mk-inline')) {
      const st = document.createElement('style'); st.id = 'css-mk-inline';
      st.textContent = `.field-inline{font:inherit;padding:10px 12px;border:1px solid var(--line);border-radius:6px;background:#fff;cursor:pointer}`;
      document.head.appendChild(st);
    }
    root.querySelectorAll('#sf-product button').forEach(b => b.onclick = () => { this.product = b.dataset.p; this.render(root); });
    root.querySelectorAll('#sf-tabs button').forEach(b => b.onclick = () => { this.tab = b.dataset.t; this.render(root); });
    document.getElementById('sf-find').onclick = () => { location.hash = '#/product-page'; };
  }
};
