window.Views = window.Views || {};
// B2C product detail / pricing page (no login) — mirrors a specialty PDP.
window.Views['product-page'] = {
  async render(root) {
    let d;
    try { d = (await DB.load('storefront')).product; }
    catch (e) { root.innerHTML = errorState(e.message); return; }
    const cls = ['pdp-master', 'pdp-prepare', 'pdp-cram', 'pdp-free'];
    const cell = (v) => v === true ? '<span class="pdp-check">✓</span>' : (v === false ? '<span class="muted">—</span>' : H.esc(v));

    root.innerHTML = `
      ${App.marketingHeaderHtml()}
      <div class="mk-page">
        <div class="crumb">${d.breadcrumb.map(H.esc).join(' &nbsp;&rsaquo;&nbsp; ')}</div>
        <h1 style="font-size:34px;color:var(--navy-900)">${H.esc(d.title)}</h1>
        <p style="max-width:880px">${H.esc(d.blurb)}</p>

        <div style="text-align:center;margin-top:10px"><span class="pdp-best">★ Best Value</span></div>
        <table class="pdp-plans">
          <thead><tr>
            <th style="width:30%"></th>
            ${d.plans.map((p, i) => `<th><div class="pdp-plan-head ${cls[i]}"><div class="nm">${H.esc(p.name)}</div><div class="dur">${H.esc(p.duration || '&nbsp;')}</div></div></th>`).join('')}
          </tr></thead>
          <tbody>
            <tr><td class="feat">Choose your plan</td>
              ${d.plans.map(p => `<td><div class="pdp-price">${p.free ? '$0' : '$' + p.price}</div>${p.save ? `<div class="pdp-save">${H.esc(p.save)}</div>` : ''}</td>`).join('')}
            </tr>
            ${d.features.map(f => `<tr><td class="feat">${H.esc(f.label)}</td>${f.values.map(v => `<td>${cell(v)}</td>`).join('')}</tr>`).join('')}
            <tr><td></td>
              ${d.plans.map(p => `<td><button class="btn ${p.free ? 'btn-secondary' : 'btn-primary'}" data-buy="${H.esc(p.name)}" data-free="${p.free}">${p.free ? 'Start Free Trial' : 'Add to Cart'}</button></td>`).join('')}
            </tr>
          </tbody>
        </table>
        <div style="height:36px"></div>
      </div>
      ${App.footerHtml()}`;

    root.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
      if (b.dataset.free === 'true') { location.hash = '#/register'; }
      else { toast(`Added ${d.specialty} — ${b.dataset.buy} to cart`, 'success'); location.hash = '#/cart'; }
    });
  }
};
