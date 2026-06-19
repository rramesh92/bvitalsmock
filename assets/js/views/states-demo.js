window.Views = window.Views || {};
window.Views['states-demo'] = {
  async render(el) {
    el.innerHTML = `
      <div class="page-head"><div><h1>UI States Demo</h1>
        <p class="subtitle">Force loading / empty / error states on data screens, and preview alerts, modals & toasts</p></div></div>

      <div class="card">
        <h3>Force a global data state</h3>
        <p class="muted">Sets a flag the data screens (Dashboard, Performance, My Quizzes) read on next render.</p>
        <div class="seg" id="force">
          <button data-f="" class="${!UIState.force?'active':''}">Normal</button>
          <button data-f="loading" class="${UIState.force==='loading'?'active':''}">Loading</button>
          <button data-f="empty" class="${UIState.force==='empty'?'active':''}">Empty</button>
          <button data-f="error" class="${UIState.force==='error'?'active':''}">Error</button>
        </div>
        <p class="mt-16"><a class="btn btn-secondary" href="#/dashboard">Open Dashboard with this state →</a>
          <a class="btn btn-secondary" href="#/my-quizzes">My Quizzes →</a></p>
      </div>

      <div class="grid cols-2 mt-16">
        <div class="card"><h3>Loading (skeleton)</h3>${skeleton(4)}</div>
        <div class="card"><h3>Empty state</h3>${emptyState('inbox','Nothing here yet','Your list is empty — create something to get started.','<button class="btn btn-primary mt-8">Primary action</button>')}</div>
        <div class="card"><h3>Error state</h3>${errorState('The server returned a 500 while loading this resource.')}</div>
        <div class="card"><h3>Alerts</h3>
          <div class="error-banner" style="background:var(--good-bg);border-color:#bfe3ca;color:#216a3c;margin-bottom:10px">${Icon.check}<div>Success — your changes were saved.</div></div>
          <div class="error-banner" style="background:var(--warn-bg);border-color:#f0d9a8;color:#8a5d12;margin-bottom:10px">${Icon.clock}<div>Warning — your trial ends in 1 day.</div></div>
          <div class="error-banner">${Icon.alert}<div>Error — payment method declined.</div></div>
        </div>
      </div>

      <div class="card mt-16"><h3>Interactive components</h3>
        <div class="row" style="gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary" id="t-success">Success toast</button>
          <button class="btn btn-secondary" id="t-info">Info toast</button>
          <button class="btn btn-danger" id="t-error">Error toast</button>
          <button class="btn btn-secondary" id="m-open">Open modal</button>
          <button class="btn btn-danger" id="m-danger">Destructive modal</button>
        </div>
      </div>`;

    el.querySelectorAll('#force button').forEach(b => b.onclick = () => {
      UIState.force = b.dataset.f || null;
      toast(`Forced state: ${UIState.force || 'normal'}`);
      this.render(el);
    });
    document.getElementById('t-success').onclick = () => toast('Saved successfully', 'success');
    document.getElementById('t-info').onclick = () => toast('Heads up — quiz autosaved');
    document.getElementById('t-error').onclick = () => toast('Could not sync responses', 'error');
    document.getElementById('m-open').onclick = () => openModal({ title: 'Example modal', body: '<p>This is a standard confirmation modal used across the app (e.g. grading a quiz, claiming CME).</p>', confirmLabel: 'Got it', onConfirm: () => toast('Confirmed') });
    document.getElementById('m-danger').onclick = () => openModal({ title: 'Delete this quiz?', body: '<p>This action cannot be undone.</p>', confirmLabel: 'Delete', danger: true, onConfirm: () => toast('Deleted', 'error') });
  }
};
