window.Views = window.Views || {};
window.Views['checkout'] = {
  // form model
  form: { name: '', email: '', card: '', exp: '', cvc: '', zip: '' },
  touched: {},

  async render(el, params) {
    if (UIState.force === 'loading') { el.innerHTML = `${skeleton(4)}${skeleton(4)}`; return; }
    el.innerHTML = `${skeleton(4)}${skeleton(4)}`;

    let d;
    try { d = await DB.load('cart'); }
    catch (e) { el.innerHTML = errorState(e.message); return; }
    if (UIState.force === 'error') { el.innerHTML = errorState('Could not load checkout.'); return; }

    injectCheckoutCss();

    this._cart = (UIState.force === 'empty')
      ? { items: [], subtotal: 0, discount: 0, tax: 0, total: 0, currency: d.currency }
      : d;
    this.form = { name: '', email: '', card: '', exp: '', cvc: '', zip: '' };
    this.touched = {};

    if (!this._cart.items.length) {
      el.innerHTML = `
        <div class="page-head"><div><h1>Checkout</h1></div></div>
        ${emptyState('inbox', 'Your cart is empty', 'Add a question bank before checking out.',
          `<a class="btn btn-primary" href="#/question-banks">Browse Question Banks</a>`)}`;
      return;
    }

    this.paint(el);
  },

  money(n) { return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0 })}`; },

  // validators -> error message or ''
  errors() {
    const f = this.form;
    const e = {};
    if (!f.name.trim()) e.name = 'Name on card is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Enter a valid email address.';
    const digits = f.card.replace(/\s+/g, '');
    if (!/^\d{15,16}$/.test(digits)) e.card = 'Card number must be 15–16 digits.';
    if (!/^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/.test(f.exp.trim())) e.exp = 'Use MM/YY format.';
    if (!/^\d{3,4}$/.test(f.cvc.trim())) e.cvc = 'CVC must be 3–4 digits.';
    if (!/^\d{5}$/.test(f.zip.trim())) e.zip = 'Enter a 5-digit ZIP code.';
    return e;
  },

  isValid() { return Object.keys(this.errors()).length === 0; },

  paint(el) {
    const c = this._cart;

    el.innerHTML = `
      <div class="page-head"><div><h1>Checkout</h1>
        <p class="subtitle">Secure payment — your card is processed by Stripe (mocked)</p></div></div>

      <div class="grid cols-2 chk-grid">
        <div>
          <div class="section-label">Payment Details</div>
          <div class="panel-card">
            <form id="chk-form" novalidate>
              ${this.fieldRow('name', 'Name on card', 'text', 'Jane Doe')}
              ${this.fieldRow('email', 'Email', 'email', 'jane@example.com')}
              ${this.fieldRow('card', 'Card number', 'text', '4242 4242 4242 4242')}
              <div class="grid cols-3">
                ${this.fieldRow('exp', 'Expiry (MM/YY)', 'text', '04/27')}
                ${this.fieldRow('cvc', 'CVC', 'text', '123')}
                ${this.fieldRow('zip', 'Billing ZIP', 'text', '10001')}
              </div>
              <button type="submit" class="btn btn-primary btn-block" id="chk-place" disabled style="margin-top:8px">Place Order</button>
              <p class="muted chk-secure">${Icon.shield} Mock checkout — no real payment is processed.</p>
            </form>
          </div>
        </div>

        <div>
          <div class="section-label">Order Summary</div>
          <div class="panel-card chk-summary">
            ${c.items.map(i => `
              <div class="chk-line">
                <div>
                  <div class="chk-name">${H.esc(i.question_bank)}</div>
                  <div class="muted chk-meta">${H.esc(i.plan)} · ${H.esc(i.duration_label)}${i.qty > 1 ? ` · x${i.qty}` : ''}</div>
                </div>
                <div class="chk-price">${this.money(i.price * i.qty)}</div>
              </div>`).join('')}
            <div class="ln"><span>Subtotal</span><span>${this.money(c.subtotal)}</span></div>
            ${c.discount > 0 ? `<div class="ln"><span>Discount</span><span class="good">−${this.money(c.discount)}</span></div>` : ''}
            <div class="ln"><span>Estimated Tax</span><span>${this.money(c.tax || 0)}</span></div>
            <div class="ln chk-total"><span>Total</span><span>${this.money(c.total)}</span></div>
            <a class="btn btn-secondary btn-block" href="#/cart" style="margin-top:12px">Back to Cart</a>
          </div>
        </div>
      </div>`;

    const place = el.querySelector('#chk-place');
    const sync = () => { place.disabled = !this.isValid(); };

    el.querySelectorAll('[data-f]').forEach(inp => {
      inp.oninput = () => { this.form[inp.dataset.f] = inp.value; sync(); this.refreshError(el, inp.dataset.f); };
      inp.onblur = () => { this.touched[inp.dataset.f] = true; this.refreshError(el, inp.dataset.f); };
    });

    el.querySelector('#chk-form').onsubmit = (e) => {
      e.preventDefault();
      if (!this.isValid()) {
        Object.keys(this.form).forEach(k => { this.touched[k] = true; this.refreshError(el, k); });
        return;
      }
      toast('Order placed (mocked)', 'success');
    };

    sync();
  },

  fieldRow(key, label, type, placeholder) {
    return `<label class="field chk-field" data-field="${key}">
      <span>${H.esc(label)}</span>
      <input data-f="${key}" type="${type}" placeholder="${H.esc(placeholder)}" autocomplete="off" />
      <span class="chk-err" id="chk-err-${key}"></span>
    </label>`;
  },

  refreshError(el, key) {
    const wrap = el.querySelector(`.chk-field[data-field="${key}"]`);
    const span = el.querySelector(`#chk-err-${key}`);
    if (!wrap || !span) return;
    const msg = this.touched[key] ? (this.errors()[key] || '') : '';
    span.textContent = msg;
    wrap.classList.toggle('has-err', !!msg);
  }
};

function injectCheckoutCss() {
  if (document.getElementById('css-checkout')) return;
  const st = document.createElement('style');
  st.id = 'css-checkout';
  st.textContent = `
    .chk-grid{align-items:start}
    .chk-field{position:relative}
    .chk-err{display:block;color:var(--risk);font-size:12px;min-height:15px;margin-top:3px}
    .chk-field.has-err input{border-color:var(--risk)}
    .chk-secure{display:flex;align-items:center;gap:6px;font-size:12px;margin-top:10px}
    .chk-secure svg{width:14px;height:14px}
    .chk-summary .chk-line{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--line)}
    .chk-name{font-weight:600;color:var(--navy-900);font-size:14px}
    .chk-meta{font-size:12px;margin-top:2px}
    .chk-price{font-weight:600;color:var(--navy-900)}
    .chk-summary .ln{display:flex;justify-content:space-between;padding:7px 0;font-size:14px;border-bottom:1px solid var(--line)}
    .chk-summary .chk-total{font-size:17px;font-weight:700;color:var(--navy-900);border-top:2px solid var(--line);border-bottom:0;margin-top:4px;padding-top:12px}`;
  document.head.appendChild(st);
}
