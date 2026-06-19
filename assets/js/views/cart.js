window.Views = window.Views || {};
window.Views['cart'] = {
  async render(el, params) {
    if (UIState.force === 'loading') { el.innerHTML = `${skeleton(4)}${skeleton(3)}`; return; }
    el.innerHTML = `${skeleton(4)}${skeleton(3)}`;

    let d;
    try { d = await DB.load('cart'); }
    catch (e) { el.innerHTML = errorState(e.message); return; }
    if (UIState.force === 'error') { el.innerHTML = errorState('Could not load your cart.'); return; }

    injectCartCss();

    // work on a clone so removes are local-only
    this._cart = UIState.force === 'empty'
      ? { items: [], subtotal: 0, discount: 0, tax: 0, total: 0, currency: d.currency }
      : JSON.parse(JSON.stringify(d));

    this.paint(el);
  },

  money(n) { return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0 })}`; },

  recompute() {
    const c = this._cart;
    c.subtotal = c.items.reduce((s, i) => s + i.original_price * i.qty, 0);
    const discounted = c.items.reduce((s, i) => s + i.price * i.qty, 0);
    c.discount = c.subtotal - discounted;
    c.total = discounted + (c.tax || 0);
  },

  paint(el) {
    const c = this._cart;

    if (!c.items.length) {
      el.innerHTML = `
        <div class="page-head"><div><h1>Your Cart</h1></div></div>
        ${emptyState('inbox', 'Your cart is empty', 'Browse our question banks to find the right prep for your specialty.',
          `<a class="btn btn-primary" href="#/question-banks">Browse Question Banks</a>`)}`;
      return;
    }

    this.recompute();

    el.innerHTML = `
      <div class="page-head"><div><h1>Your Cart</h1>
        <p class="subtitle">${c.items.length} item${c.items.length > 1 ? 's' : ''} in your cart</p></div></div>

      <div class="grid cols-2 cart-grid">
        <div>
          <div class="section-label">Items</div>
          <div class="panel-card" style="padding:0">
            <table class="data cart-table">
              <thead><tr><th>Question Bank</th><th>Plan</th><th>Qty</th><th class="ta-r">Price</th><th></th></tr></thead>
              <tbody>
                ${c.items.map(i => `
                  <tr data-id="${i.id}">
                    <td>
                      <div class="cart-name">${H.esc(i.question_bank)}</div>
                      ${i.cme ? `<div class="cart-cme good">${Icon.award} ${H.esc(i.cme_label || 'CME included')}</div>` : ''}
                    </td>
                    <td><span class="pill">${H.esc(i.plan)}</span><div class="muted cart-dur">${H.esc(i.duration_label)}</div></td>
                    <td>
                      <div class="cart-qty">
                        <button class="qbtn" data-act="dec" data-id="${i.id}" aria-label="decrease">−</button>
                        <span class="qval">${i.qty}</span>
                        <button class="qbtn" data-act="inc" data-id="${i.id}" aria-label="increase">+</button>
                      </div>
                    </td>
                    <td class="ta-r">
                      <div class="cart-price">${this.money(i.price * i.qty)}</div>
                      ${i.original_price > i.price ? `<div class="cart-orig muted">${this.money(i.original_price * i.qty)}</div>` : ''}
                    </td>
                    <td class="ta-r">
                      <button class="btn btn-secondary cart-rm" data-rm="${i.id}" title="Remove">${Icon.x}</button>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div class="section-label">Order Summary</div>
          <div class="panel-card cart-summary">
            <div class="ln"><span>Subtotal</span><span>${this.money(c.subtotal)}</span></div>
            ${c.discount > 0 ? `<div class="ln"><span>Discount</span><span class="good">−${this.money(c.discount)}</span></div>` : ''}
            <div class="ln"><span>Estimated Tax</span><span>${this.money(c.tax || 0)}</span></div>
            <div class="ln cart-total"><span>Total</span><span>${this.money(c.total)}</span></div>
            <button class="btn btn-primary btn-block" id="cart-checkout" style="margin-top:14px">Proceed to Checkout</button>
            <a class="btn btn-secondary btn-block" href="#/question-banks" style="margin-top:8px">Continue Shopping</a>
          </div>
        </div>
      </div>`;

    el.querySelectorAll('[data-act]').forEach(b => b.onclick = () => {
      const item = c.items.find(i => String(i.id) === b.dataset.id);
      if (!item) return;
      if (b.dataset.act === 'inc') item.qty++;
      else if (item.qty > 1) item.qty--;
      this.paint(el);
    });

    el.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
      c.items = c.items.filter(i => String(i.id) !== b.dataset.rm);
      toast('Removed from cart');
      this.paint(el);
    });

    el.querySelector('#cart-checkout').onclick = () => { location.hash = '#/checkout'; };
  }
};

function injectCartCss() {
  if (document.getElementById('css-cart')) return;
  const st = document.createElement('style');
  st.id = 'css-cart';
  st.textContent = `
    .cart-grid{align-items:start}
    .ta-r{text-align:right}
    .cart-name{font-weight:600;color:var(--navy-900)}
    .cart-cme{display:inline-flex;align-items:center;gap:5px;font-size:12px;margin-top:4px}
    .cart-cme svg{width:14px;height:14px}
    .cart-dur{font-size:12px;margin-top:3px}
    .cart-price{font-weight:700;color:var(--navy-900)}
    .cart-orig{font-size:12px;text-decoration:line-through}
    .cart-qty{display:inline-flex;align-items:center;gap:8px}
    .cart-qty .qbtn{width:26px;height:26px;border:1px solid var(--line);background:#fff;border-radius:6px;cursor:pointer;font-size:16px;line-height:1;color:var(--navy-900)}
    .cart-qty .qbtn:hover{border-color:var(--info);color:var(--info)}
    .cart-qty .qval{min-width:16px;text-align:center;font-weight:600}
    .cart-rm{padding:6px 9px}
    .cart-rm svg{width:14px;height:14px;display:block}
    .cart-summary .ln{display:flex;justify-content:space-between;padding:7px 0;font-size:14px;border-bottom:1px solid var(--line)}
    .cart-summary .ln:last-of-type{border-bottom:0}
    .cart-summary .cart-total{font-size:17px;font-weight:700;color:var(--navy-900);border-top:2px solid var(--line);border-bottom:0;margin-top:4px;padding-top:12px}`;
  document.head.appendChild(st);
}
