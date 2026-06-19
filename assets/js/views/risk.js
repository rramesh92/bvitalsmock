window.Views = window.Views || {};
window.Views.risk = {
  async render(el) {
    if (UIState.force === 'loading') { el.innerHTML = `<div class="grid cols-2">${skeleton(5)}${skeleton(5)}</div>`; return; }
    if (UIState.force === 'empty') { el.innerHTML = emptyState('shield', 'Not Enough Data', 'Answer at least 10 questions in a subject for your Risk Category to populate.', '<a class="btn btn-primary" href="#/create-quiz">Build a focused quiz</a>'); return; }
    el.innerHTML = skeleton(5);
    let d;
    try { d = await DB.load('risk-assessment'); }
    catch (e) { el.innerHTML = errorState(e.message); return; }
    if (UIState.force === 'error') { el.innerHTML = errorState('Could not load your readiness data.'); return; }

    this.injectCss();
    const sgColor = { good:'#327d1c', warn:'#f76902', risk:'#df0000', muted:'#a5a5a5' };
    const scoreColor = d.readiness_score >= 75 ? 'var(--good)' : d.readiness_score >= 50 ? 'var(--warn)' : 'var(--risk)';

    // group subjects by the 4 real risk categories
    const order = ['On Track','Needs Improvement','At Risk','Not Enough Data'];
    const grouped = order.map(cat => ({ cat, items: d.subjects.filter(s => s.risk_category === cat) })).filter(g => g.items.length);

    el.innerHTML = `
      <div class="page-head"><div>
        <h1>Risk Assessment</h1>
        <p class="subtitle">${H.esc(App.currentBank().name)} · exam ${H.date(d.exam_date)}</p>
      </div></div>

      <div class="grid cols-2" style="grid-template-columns:1fr 1.4fr">
        <div>
          <div class="section-label">Readiness</div>
          <div class="panel-card" style="text-align:center">
            <div class="donut" style="background:conic-gradient(${scoreColor} calc(${d.readiness_score}*1%), #e9edf1 0);position:relative;width:140px;height:140px;margin:8px auto">
              <div class="hole" style="width:104px;height:104px"><div><div class="big">${d.readiness_score}</div><small class="muted">readiness</small></div></div>
            </div>
            <div style="margin-top:8px"><span class="risk-badge ${d.readiness_category==='On Track'?'good':d.readiness_category==='Needs Improvement'?'warn':d.readiness_category==='At Risk'?'risk':'muted'}">${H.esc(d.readiness_category)}</span></div>
            <div style="margin-top:6px"><small class="muted">Peer Rank ${d.peer_percentile}<sup>th</sup> Percentile</small></div>
          </div>

          <div class="section-label mt-16">Subject Risk Distribution</div>
          <div class="panel-card">
            <div class="donut-wrap" style="gap:14px;justify-content:center">
              ${riskDistDonut(d.distribution)}
              <div class="risk-legend" style="text-align:left">
                ${d.distribution.map(r => `<div class="ln"><span class="risk-badge ${r.color}">${r.percent}%</span> ${H.esc(r.category)}</div>`).join('')}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="section-label">Readiness by area</div>
          <div class="panel-card pad-0">
            <table class="data">
              <thead><tr><th>Risk Category</th><th>Subjects</th></tr></thead>
              <tbody>${grouped.map(g => `<tr>
                <td style="white-space:nowrap"><span class="risk-cat"><span class="dot" style="background:${sgColor[colorFor(g.cat)]}"></span>${H.esc(g.cat)}</span></td>
                <td>${g.items.map(s => `${H.esc(s.subject)}${s.score!=null?` <small class="muted">(${s.score}%)</small>`:''}`).join(' · ')}</td>
              </tr>`).join('')}</tbody>
            </table>
          </div>

          <div class="panel-card mt-16">
            <h4 style="margin-top:0">${Icon.target} Recommendation</h4>
            <p class="mb-0">${H.esc(d.recommendation)}</p>
            <a class="btn btn-primary mt-16" href="#/create-quiz">Build a focused quiz</a>
          </div>
        </div>
      </div>`;
  },

  injectCss() {
    if (document.getElementById('css-risk')) return;
    const s = document.createElement('style');
    s.id = 'css-risk';
    s.textContent = `
      .risk-cat{display:inline-flex;align-items:center;gap:6px;font-weight:600}
      .risk-cat .dot{width:10px;height:10px;border-radius:50%;display:inline-block}
      .risk-legend .ln{margin:3px 0;font-size:12.5px}`;
    document.head.appendChild(s);
  }
};

function colorFor(cat) {
  return cat === 'On Track' ? 'good' : cat === 'Needs Improvement' ? 'warn' : cat === 'At Risk' ? 'risk' : 'muted';
}

function riskDistDonut(dist) {
  const colors = { good: '#327d1c', warn: '#f76902', risk: '#df0000', muted: '#a5a5a5' };
  let acc = 0; const segs = [];
  dist.forEach(r => { if (r.percent > 0) { segs.push(`${colors[r.color]} ${acc}% ${acc + r.percent}%`); acc += r.percent; } });
  const grad = segs.length ? segs.join(', ') : '#c2ccd5 0% 100%';
  return `<div class="donut" style="background:conic-gradient(${grad});position:relative;width:108px;height:108px">
    <div class="hole" style="width:74px;height:74px"></div></div>`;
}
