window.Views = window.Views || {};
window.Views['question-banks'] = {
  async render(el) {
    el.innerHTML = `<div class="grid cols-3">${skeleton(4)}${skeleton(4)}${skeleton(4)}</div>`;
    let d;
    try { d = await DB.load('question-banks'); }
    catch (e) { el.innerHTML = errorState(e.message); return; }

    injectBanksCss();

    const subscribed = App.user && App.user.whitelisted_question_bank_ids || [];

    el.innerHTML = `
      <div class="page-head">
        <div><h1>Try BoardVitals Free Today</h1>
          <p class="subtitle">No credit card required. Find your specialty below</p></div>
      </div>
      <div class="grid cols-3">
        ${d.question_banks.map(b => {
          const selected = b.id === App.selectedBankId;
          const owned = subscribed.indexOf(b.id) !== -1;
          const cme = (b.cme_product_credits && b.cme_product_credits[0]) || null;
          return `<div class="card bank-card ${selected ? 'is-selected' : ''}">
            ${selected ? `<div class="bank-check">${Icon.check}</div>` : ''}
            <div class="between">
              <span class="pill ${owned ? 'good' : 'muted'}">${b.occupation}</span>
              ${b.is_ngn ? '<span class="pill warn">NGN</span>' : ''}
            </div>
            <h3 class="mt-8 bank-name">${H.esc(b.name)}</h3>
            <div class="muted bank-board">${H.esc(b.board_info)}</div>
            <p class="muted bank-blurb">${H.esc(b.brief_marketing_blurb)}</p>
            <div class="row" style="gap:18px;margin:12px 0">
              <div class="stat"><span class="value" style="font-size:20px">${b.rounded_question_count.toLocaleString()}+</span><span class="label">Questions</span></div>
              <div class="stat"><span class="value ${H.scoreClass(b.pass_likelihood_score)}" style="font-size:20px">${b.pass_likelihood_score}%</span><span class="label">Pass likelihood</span></div>
            </div>
            <div class="legend bank-legend">
              ${cme ? `<span class="pill good">CME · ${cme.credits} ${H.esc(cme.type)}</span>` : ''}
              ${b.has_clinical_pearls ? '<span class="pill">Clinical Pearls</span>' : ''}
              ${b.adaptive_available ? '<span class="pill">Adaptive</span>' : ''}
            </div>
            ${owned
              ? `<button class="btn ${selected ? 'btn-secondary' : 'btn-primary'} btn-block" data-bank="${b.id}">
                  ${selected ? 'Currently active' : 'Switch to this bank'}</button>`
              : `<button class="btn btn-primary btn-block" data-cart="${b.id}">Add to Cart</button>
                 <button class="btn btn-secondary btn-block" data-trial="${b.id}" style="margin-top:8px">Access Free Questions</button>`}
          </div>`;
        }).join('')}
      </div>`;

    el.querySelectorAll('[data-bank]').forEach(btn => btn.onclick = () => {
      App.selectedBankId = parseInt(btn.dataset.bank, 10);
      App.renderBankSwitcher();
      toast(`Switched to ${App.currentBank().name}`, 'success');
      location.hash = '#/dashboard';
    });
    el.querySelectorAll('[data-cart]').forEach(btn => btn.onclick = () => toast('Add to Cart is mocked'));
    el.querySelectorAll('[data-trial]').forEach(btn => btn.onclick = () => toast('Free trial signup is mocked'));
  }
};

function injectBanksCss() {
  if (document.getElementById('css-banks')) return;
  const st = document.createElement('style');
  st.id = 'css-banks';
  st.textContent = `
    .bank-card{position:relative;display:flex;flex-direction:column}
    .bank-card.is-selected{border-color:var(--info);box-shadow:0 0 0 1px var(--info) inset}
    .bank-check{position:absolute;top:12px;right:12px;width:22px;height:22px;color:var(--good)}
    .bank-check svg{width:22px;height:22px}
    .bank-name{color:var(--navy-900)}
    .bank-board{font-size:12px;margin-top:2px}
    .bank-blurb{min-height:42px;margin:8px 0 0;font-size:13px}
    .bank-legend{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 14px}
    .bank-card .btn-block{margin-top:auto}`;
  document.head.appendChild(st);
}
