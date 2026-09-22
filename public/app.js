'use strict';

const viewLabels = {
  command: 'Commandement',
  flows: 'Chaîne de valeur',
  portfolio: 'Portefeuille',
  evidence: 'Preuves & mesure',
  strategy: 'Stratégie',
  scenarios: 'Scénarios',
  research: 'Contexte entreprise'
};

const mechanismLabels = {
  augmentation: 'Augmentation humaine',
  automation: 'Automatisation',
  intelligence: 'Intelligence décisionnelle',
  decision: 'Aide à la décision',
  platform: 'Socle & plateforme'
};

const valueTypeLabels = {
  capacity: 'Capacité productive',
  revenue: 'Revenu',
  cost: 'Coûts évités',
  risk: 'Risque maîtrisé',
  experience: 'Expérience & qualité'
};

const stageLabels = {
  experiment: 'Expérience',
  pilot: 'Pilote',
  active: 'Déployé',
  scaled: 'À l’échelle'
};

const statusLabels = {
  active: 'Actif',
  scaled: 'À l’échelle',
  watch: 'À surveiller',
  stopped: 'Arrêté'
};

const flowLabels = {
  budget: 'Budget engagé', talent: 'Temps & expertise', data: 'Données & preuve',
  augmentation: 'Augmentation', automation: 'Automatisation', intelligence: 'Intelligence', decision: 'Décision', platform: 'Plateforme',
  capacity: 'Capacité libérée', revenue: 'Revenu incrémental', cost: 'Coûts évités', risk: 'Risque réduit', experience: 'Expérience améliorée',
  realized: 'Valeur constatée', defendable: 'Valeur défendable', potential: 'Valeur potentielle'
};

const app = {
  state: null,
  view: 'command',
  portfolioFilter: 'all',
  search: '',
  scenario: { adoption: 1, confidence: 1, attribution: 1, speed: 1, reinvestment: .65 },
  installPrompt: null
};

if (new URLSearchParams(location.search).has('capture')) document.documentElement.classList.add('capture-mode');

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number(value) || 0));
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[character]);
const number = (value, digits = 0) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(Number(value) || 0);
const currency = (value, compact = false) => new Intl.NumberFormat('fr-FR', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 0, notation: compact ? 'compact' : 'standard', compactDisplay: 'short'
}).format(Number(value) || 0);
const percent = (value, digits = 0) => `${number(Number(value) || 0, digits)} %`;
const dateLabel = (value) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Une erreur est survenue.');
  return data;
}

function stageBadge(item) {
  const color = item.stage === 'scaled' ? 'green' : item.stage === 'active' ? 'blue' : item.stage === 'pilot' ? 'orange' : 'amber';
  return `<span class="badge ${color}">${escapeHtml(stageLabels[item.stage] || item.stage)}</span>`;
}

function statusBadge(item) {
  const color = item.status === 'scaled' ? 'green' : item.status === 'active' ? 'blue' : item.status === 'watch' ? 'amber' : 'red';
  return `<span class="badge ${color}">${escapeHtml(statusLabels[item.status] || item.status)}</span>`;
}

function proofLabel(level) {
  return ['Intuition', 'Observation', 'Mesure rapprochée', 'Attribution robuste'][Math.max(0, Math.min(3, Number(level || 1) - 1))];
}

function pageHead(eyebrow, title, description, actions = '') {
  return `<header class="page-head">
    <div><span class="eyebrow">${escapeHtml(eyebrow)}</span><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div>
    ${actions ? `<div class="head-actions">${actions}</div>` : ''}
  </header>`;
}

function sparkline(values) {
  const safe = values.length ? values : [0];
  const width = 240, height = 56, padding = 4;
  const max = Math.max(...safe), min = Math.min(...safe);
  const range = max - min || 1;
  const points = safe.map((value, index) => {
    const x = padding + (index / Math.max(1, safe.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return [x, y];
  });
  const path = points.map((point, index) => `${index ? 'L' : 'M'}${point[0].toFixed(1)},${point[1].toFixed(1)}`).join(' ');
  const area = `${path} L${points.at(-1)[0].toFixed(1)},${height} L${points[0][0].toFixed(1)},${height} Z`;
  return `<svg class="sparkline" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ff8a3d" stop-opacity=".32"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></linearGradient></defs>
    <path class="area" d="${area}"/><path class="line" d="${path}"/>
    <circle cx="${points.at(-1)[0]}" cy="${points.at(-1)[1]}" r="3"/>
  </svg>`;
}

function topInitiatives(limit = 5) {
  return [...app.state.portfolio.initiatives]
    .filter(item => item.status !== 'stopped')
    .sort((a, b) => b.risk_adjusted_value - a.risk_adjusted_value)
    .slice(0, limit);
}

function departmentValues() {
  const result = new Map();
  for (const item of app.state.portfolio.initiatives) {
    const name = item.department_name;
    if (!result.has(name)) result.set(name, { name, potential: 0, defendable: 0, realized: 0 });
    const row = result.get(name);
    row.potential += Number(item.annualized_value) || 0;
    row.defendable += Number(item.risk_adjusted_value) || 0;
    row.realized += Math.min(Number(item.actual_value) || 0, Number(item.risk_adjusted_value) || 0);
  }
  return [...result.values()].sort((a, b) => b.defendable - a.defendable);
}

function renderSignals() {
  if (!app.state) return;
  const totals = app.state.portfolio.totals;
  $('#signalStream').innerHTML = `
    <span class="signal-item">Valeur défendable <b>${currency(totals.risk_adjusted_value, true)}</b></span>
    <span class="signal-item">Valeur constatée <b class="positive">${currency(totals.realized_value, true)}</b></span>
    <span class="signal-item">Confiance <b>${percent(totals.confidence)}</b></span>
    <span class="signal-item">Preuves fortes <b class="${totals.evidence_coverage < 60 ? 'warning' : 'positive'}">${percent(totals.evidence_coverage)}</b></span>
    <span class="signal-item">Initiatives actives <b>${totals.active_count}</b></span>`;
}

function renderCommand() {
  const { totals } = app.state.portfolio;
  const score = totals.value_score;
  const gap = Math.max(0, totals.gross_value - totals.risk_adjusted_value);
  const departments = departmentValues().slice(0, 7);
  const maxDepartment = Math.max(...departments.map(item => item.potential), 1);
  const initiatives = topInitiatives(5);
  const trend = [18, 24, 29, 34, 37, 45, 51, 58, 66, totals.value_score];
  const angle = Math.max(12, score * 3.6);

  return `${pageHead(
    'Strategy Command',
    'From Strategy to Proof of Value',
    'Design the right transformation strategy. Track execution. Measure impact. Attribute value. Prove ROI.',
    `<button class="button ghost" data-action="navigate" data-view="flows">Voir la chaîne complète →</button><button class="button primary" data-action="new-initiative">＋ Instrumenter une initiative</button>`
  )}
  <section class="hero-grid">
    <article class="panel value-orbit">
      <div class="panel-head"><div><h2>Indice de valeur prouvée</h2><p>Score composite : valeur, adoption, confiance, preuve et passage à l’échelle.</p></div><span class="badge green">Actualisé</span></div>
      <div class="orbit-layout">
        <div class="orbit-ring" style="--score-angle:${angle}deg"></div>
        <div class="score-center"><span>Value confidence index</span><strong>${number(score, 0)}<small>/100</small></strong><span class="score-delta">↗ +6,4 points ce trimestre</span><p>Valeur ajustée par l’adoption, l’attribution et la qualité de preuve.</p></div>
        <div class="orbit-note one"><b>${currency(totals.realized_value, true)}</b><small>déjà constatés</small><em>${percent((totals.realized_value / Math.max(1, totals.risk_adjusted_value)) * 100)} du défendable</em></div>
        <div class="orbit-note two"><b>${percent(totals.confidence)}</b><small>confiance pondérée</small><em>+4,1 pts</em></div>
        <div class="orbit-note three"><b>${percent(totals.adoption)}</b><small>adoption observée</small><em>+8,2 pts</em></div>
        <div class="orbit-note four"><b>${percent(totals.evidence_coverage)}</b><small>preuves niveau 3+</small><em>${totals.evidence_coverage >= 70 ? 'solide' : 'à renforcer'}</em></div>
      </div>
    </article>
    <div class="metric-stack">
      <article class="metric-card"><div class="metric-top"><span>Valeur annuelle défendable</span><i></i></div><strong>${currency(totals.risk_adjusted_value, true)}</strong><p>Après confiance, attribution, adoption, déplacement et preuve.</p><div class="progress"><i style="--progress:${Math.min(100, totals.risk_adjusted_value / Math.max(1, totals.gross_value) * 100)}%"></i></div></article>
      <article class="metric-card"><div class="metric-top"><span>Valeur nette / coût complet</span><i style="background:var(--green);box-shadow:0 0 0 4px var(--green-soft)"></i></div><strong>${currency(totals.net_value, true)} <small>· ROI ${percent(totals.roi)}</small></strong><p>Inclut investissement, fonctionnement et temps interne mobilisé.</p><div class="progress green"><i style="--progress:${Math.min(100, Math.max(0, totals.roi / 2))}%"></i></div></article>
      <article class="metric-card"><div class="metric-top"><span>Valeur encore non prouvée</span><i style="background:var(--amber);box-shadow:0 0 0 4px var(--amber-soft)"></i></div><strong>${currency(gap, true)}</strong><p>Potentiel qui doit encore franchir l’adoption, l’attribution ou le niveau de preuve.</p><div class="progress blue"><i style="--progress:${Math.min(100, gap / Math.max(1, totals.gross_value) * 100)}%"></i></div></article>
    </div>
  </section>

  <section class="grid cols-4" style="margin-top:14px">
    ${[
      ['Portefeuille engagé', currency(totals.total_cost, true), `${totals.active_count} initiatives actives`, 'Dépense complète instrumentée'],
      ['Valeur constatée', currency(totals.realized_value, true), '↗ +18 % ce trimestre', 'Mesures observées et plafonnées'],
      ['Taux de confiance', percent(totals.confidence), '↗ +4,1 points', 'Pondéré par la valeur attendue'],
      ['Couverture de preuve', percent(totals.evidence_coverage), totals.evidence_coverage >= 70 ? 'Seuil de décision atteint' : 'À renforcer', 'Niveaux 3 et 4 uniquement']
    ].map((item, index) => `<article class="panel kpi-card interactive"><div class="kpi-label"><span>${item[0]}</span><i></i></div><strong class="kpi-value">${item[1]}</strong><div class="kpi-foot"><span class="${index === 2 || index === 1 ? 'trend-up' : index === 3 && totals.evidence_coverage < 70 ? 'trend-warn' : ''}">${item[2]}</span><span>${item[3]}</span></div></article>`).join('')}
  </section>

  <section class="dashboard-grid">
    <article class="panel span-7">
      <div class="panel-head"><div><h3>Conversion du potentiel en valeur</h3><p>Écart entre ambition, valeur défendable et valeur déjà constatée par domaine.</p></div><button class="panel-link" data-action="navigate" data-view="flows">Tracer les flux →</button></div>
      <div class="bar-chart">
        ${departments.map(item => `<div class="bar-group"><div class="bar-pair"><i class="bar" style="--height:${Math.max(4, item.potential / maxDepartment * 100)}%" title="Potentiel ${currency(item.potential)}"></i><i class="bar real" style="--height:${Math.max(4, item.defendable / maxDepartment * 100)}%" title="Défendable ${currency(item.defendable)}"></i></div><small>${escapeHtml(item.name.split(' ')[0])}</small></div>`).join('')}
      </div>
      <div class="flow-legend"><span><i style="background:var(--surface-3)"></i>Potentiel brut</span><span><i style="background:var(--orange)"></i>Valeur défendable</span></div>
    </article>
    <article class="panel span-5">
      <div class="panel-head"><div><h3>Trajectoire de confiance</h3><p>Progression de la qualité du portefeuille au fil des revues.</p></div><span class="panel-meta">10 dernières revues</span></div>
      ${sparkline(trend)}
      <div class="grid cols-2" style="margin-top:12px">
        <div class="flow-summary-card"><span>Confiance</span><strong>${percent(totals.confidence)}</strong><small>pondérée par valeur</small></div>
        <div class="flow-summary-card"><span>Adoption</span><strong>${percent(totals.adoption)}</strong><small>utilisation observée</small></div>
      </div>
    </article>
    <article class="panel span-8">
      <div class="panel-head"><div><h3>Initiatives qui portent la valeur</h3><p>Classées par valeur annuelle ajustée au risque de preuve.</p></div><button class="panel-link" data-action="navigate" data-view="portfolio">Tout le portefeuille →</button></div>
      <div class="initiative-list">
        ${initiatives.map((item, index) => `<button class="initiative-row" data-action="open-initiative" data-id="${item.id}">
          <span class="rank mono">${String(index + 1).padStart(2, '0')}</span>
          <span class="initiative-name"><b>${escapeHtml(item.name)}</b><span>${escapeHtml(item.department_name)} · ${escapeHtml(item.owner)}</span></span>
          <span class="initiative-progress"><span class="progress"><i style="--progress:${Math.min(100, item.realization * 100)}%"></i></span><small>${percent(item.realization * 100)} de la cible observée</small></span>
          <span class="initiative-value mono">${currency(item.risk_adjusted_value, true)}</span>${stageBadge(item)}
        </button>`).join('')}
      </div>
    </article>
    <article class="panel span-4">
      <div class="panel-head"><div><h3>Prochaine décision</h3><p>Le signal le plus important pour le comité de transformation.</p></div><span class="badge amber">Action</span></div>
      <div class="strategy-score"><strong>${currency(gap, true)}</strong><div><b>de potentiel encore fragile</b><span>La priorité n’est pas d’ajouter des idées, mais de renforcer l’adoption et l’attribution.</span></div></div>
      <button class="button primary full" data-action="navigate" data-view="strategy">Ouvrir la stratégie recommandée</button>
    </article>
  </section>`;
}

function flowNode(item, column, index, max) {
  const icons = { inputs: 'I', mechanisms: 'M', outputs: 'O', outcomes: 'V' };
  const notes = {
    budget: 'Licences, partenaires, infrastructure', talent: 'Temps interne et expertise', data: 'Instrumentation et qualité',
    realized: 'Constatée dans les opérations', defendable: 'Ajustée et attribuable', potential: 'Avant friction et incertitude'
  };
  const weight = Math.max(8, (Number(item.value) || 0) / Math.max(1, max) * 100);
  return `<article class="flow-node" data-flow="${column}-${index}"><div class="node-top"><span class="node-icon">${icons[column]}</span><span class="badge ${column === 'outcomes' && item.key === 'realized' ? 'green' : 'orange'}">${column === 'mechanisms' ? `${item.count || 0} init.` : column === 'outcomes' ? 'valeur' : 'flux'}</span></div><b>${escapeHtml(flowLabels[item.key] || item.key)}</b><strong>${currency(item.value, true)}</strong><small>${escapeHtml(notes[item.key] || (column === 'outputs' ? 'Impact ajusté et suivi' : 'Contribution au portefeuille'))}</small><div class="flow-weight"><i style="--weight:${weight}%"></i></div></article>`;
}

function renderFlows() {
  const flows = app.state.flows;
  const columns = ['inputs', 'mechanisms', 'outputs', 'outcomes'];
  const columnNames = { inputs: ['01 · Ressources', 'Ce que l’entreprise engage'], mechanisms: ['02 · Transformation', 'Comment l’effort change le travail'], outputs: ['03 · Résultats', 'Ce qui change réellement'], outcomes: ['04 · Valeur', 'Ce qui devient défendable'] };
  const max = Math.max(...columns.flatMap(column => flows[column].map(item => Number(item.value) || 0)), 1);
  const totalInput = flows.inputs.reduce((sum, item) => sum + item.value, 0);
  const realized = flows.outcomes.find(item => item.key === 'realized')?.value || 0;
  const defendable = flows.outcomes.find(item => item.key === 'defendable')?.value || 0;
  const potential = flows.outcomes.find(item => item.key === 'potential')?.value || 0;

  return `${pageHead('Traçabilité causale', 'Chaque euro a une trajectoire', 'Suivez comment budget, temps, données et compétences traversent les mécanismes de transformation pour devenir capacité, revenu, qualité ou risque évité.', `<button class="button ghost" data-action="print">Imprimer la carte</button><button class="button primary" data-action="new-initiative">＋ Ajouter un flux</button>`)}
  <section class="flow-summary">
    <div class="flow-summary-card"><span>Ressources engagées</span><strong>${currency(totalInput, true)}</strong><small>Budget + coût interne + instrumentation</small></div>
    <div class="flow-summary-card"><span>Valeur potentielle</span><strong>${currency(potential, true)}</strong><small>Avant friction, preuve et attribution</small></div>
    <div class="flow-summary-card"><span>Valeur défendable</span><strong>${currency(defendable, true)}</strong><small>${percent(defendable / Math.max(1, potential) * 100)} du potentiel</small></div>
    <div class="flow-summary-card"><span>Valeur constatée</span><strong>${currency(realized, true)}</strong><small>${percent(realized / Math.max(1, defendable) * 100)} du défendable</small></div>
  </section>
  <section class="panel value-map">
    <svg class="flow-lines" viewBox="0 0 1200 560" preserveAspectRatio="none" aria-hidden="true">
      <path d="M235 110 C310 110 310 80 390 80" stroke-width="9"/><path d="M235 210 C315 210 315 175 390 175" stroke-width="14"/><path d="M235 310 C320 310 320 280 390 280" stroke-width="7"/>
      <path d="M510 95 C585 95 585 82 660 82" stroke-width="12"/><path d="M510 190 C585 190 585 175 660 175" stroke-width="8"/><path d="M510 285 C585 285 585 270 660 270" stroke-width="10"/><path d="M510 380 C585 380 585 370 660 370" stroke-width="6"/>
      <path d="M780 80 C860 80 860 120 930 120" stroke-width="8"/><path d="M780 175 C860 175 860 235 930 235" stroke-width="13"/><path d="M780 270 C860 270 860 350 930 350" stroke-width="18"/><path d="M780 370 C860 370 860 350 930 350" stroke-width="8"/>
    </svg>
    <div class="flow-columns">
      ${columns.map(column => `<div class="flow-column"><header class="flow-column-head"><span>${columnNames[column][0]}</span><h3>${columnNames[column][1]}</h3></header>${flows[column].map((item, index) => flowNode(item, column, index, max)).join('')}</div>`).join('')}
    </div>
    <div class="flow-legend"><span><i style="height:3px"></i>Flux faible</span><span><i style="height:8px"></i>Flux fort</span><span>La largeur indique la valeur relative ; les montants affichés restent la source de vérité.</span></div>
  </section>
  <section class="dashboard-grid">
    <article class="panel span-7"><div class="panel-head"><div><h3>Pourquoi la valeur se perd</h3><p>La valeur brute est réduite par cinq frictions mesurées, jamais par un coefficient caché.</p></div></div>
      <div class="grid cols-3">
        ${[
          ['Adoption', app.state.portfolio.totals.adoption, 'Usage réel par les équipes'],
          ['Confiance', app.state.portfolio.totals.confidence, 'Fiabilité des hypothèses'],
          ['Attribution', number(app.state.portfolio.initiatives.reduce((s,i)=>s+i.attribution,0)/app.state.portfolio.initiatives.length*100), 'Part réellement causée'],
          ['Preuve', app.state.portfolio.totals.evidence_coverage, 'Qualité des observations'],
          ['Déplacement', number(app.state.portfolio.initiatives.reduce((s,i)=>s+i.displacement,0)/app.state.portfolio.initiatives.length*100), 'Valeur déplacée ailleurs'],
          ['Coût complet', number(app.state.portfolio.totals.total_cost/Math.max(1,app.state.portfolio.totals.gross_value)*100), 'Investissement et effort interne']
        ].map(item => `<div class="flow-summary-card"><span>${item[0]}</span><strong>${item[1]} %</strong><small>${item[2]}</small></div>`).join('')}
      </div>
    </article>
    <article class="panel span-5"><div class="panel-head"><div><h3>Principe d’attribution</h3><p>La valeur publiée n’est jamais la simple somme des gains annoncés.</p></div></div>
      <div class="causal-chain" style="grid-template-columns:repeat(3,1fr)"><div class="causal-step"><span>Mesurer</span><b>Baseline</b></div><div class="causal-step"><span>Comparer</span><b>Contrefactuel</b></div><div class="causal-step"><span>Ajuster</span><b>Valeur nette</b></div></div>
      <p style="color:var(--muted);font-size:.65rem;line-height:1.55;margin:14px 0 0">Chaque initiative porte sa propre baseline, ses sources, son niveau de confiance et la part attribuable. La direction peut donc défendre les chiffres, les challenger et les réallouer.</p>
    </article>
  </section>`;
}

function filteredInitiatives() {
  let items = app.state.portfolio.initiatives;
  if (app.portfolioFilter !== 'all') items = items.filter(item => item.stage === app.portfolioFilter || item.status === app.portfolioFilter);
  const query = app.search.trim().toLocaleLowerCase('fr');
  if (query) items = items.filter(item => [item.name, item.department_name, item.owner, item.mechanism, item.value_type].some(value => String(value).toLocaleLowerCase('fr').includes(query)));
  return items;
}

function renderPortfolio() {
  const items = filteredInitiatives();
  const filters = [['all','Toutes'],['experiment','Expériences'],['pilot','Pilotes'],['active','Déployées'],['scaled','À l’échelle'],['watch','À surveiller']];
  return `${pageHead('Portefeuille instrumenté', 'Décider initiative par initiative', 'Coût complet, valeur ajustée, preuve, adoption et attribution réunis dans un même registre de décisions.', `<button class="button ghost" data-action="export">Exporter les données</button><button class="button primary" data-action="new-initiative">＋ Nouvelle initiative</button>`)}
  <section class="toolbar">
    <div class="filters">${filters.map(([key,label]) => `<button class="filter-button ${app.portfolioFilter === key ? 'active' : ''}" data-action="filter-portfolio" data-filter="${key}">${label}</button>`).join('')}</div>
    <label class="search-field"><span>⌕</span><input id="portfolioSearch" type="search" value="${escapeHtml(app.search)}" placeholder="Initiative, équipe, propriétaire…" aria-label="Rechercher dans le portefeuille"></label>
  </section>
  <div class="table-wrap">
    <table class="data-table">
      <thead><tr><th>Initiative</th><th>Département</th><th>Étape</th><th>Coût complet</th><th>Valeur défendable</th><th>ROI ajusté</th><th>Adoption</th><th>Preuve</th><th>Décision</th></tr></thead>
      <tbody>${items.length ? items.map(item => `<tr data-action="open-initiative" data-id="${item.id}">
        <td class="table-name"><b>${escapeHtml(item.name)}</b><span>${escapeHtml(item.owner)} · ${escapeHtml(mechanismLabels[item.mechanism] || item.mechanism)}</span></td>
        <td>${escapeHtml(item.department_name)}</td><td>${stageBadge(item)}</td><td class="mono">${currency(item.total_cost, true)}</td><td class="mono">${currency(item.risk_adjusted_value, true)}</td>
        <td class="mono ${item.roi >= 0 ? 'number-positive' : 'number-negative'}">${percent(item.roi, 1)}</td>
        <td><div class="confidence-cell"><span class="mono">${percent(item.adoption * 100)}</span><span class="progress"><i style="--progress:${item.adoption * 100}%"></i></span></div></td>
        <td><span class="badge ${item.evidence_level >= 3 ? 'green' : item.evidence_level === 2 ? 'amber' : 'red'}">N${item.evidence_level} · ${escapeHtml(proofLabel(item.evidence_level))}</span></td><td>${statusBadge(item)}</td>
      </tr>`).join('') : `<tr><td colspan="9"><div class="empty-state"><div><i>⌕</i><h3>Aucune initiative trouvée</h3><p>Modifiez les filtres ou ajoutez une initiative au registre.</p><button class="button primary" data-action="new-initiative">＋ Ajouter une initiative</button></div></div></td></tr>`}</tbody>
    </table>
  </div>
  <div class="flow-legend"><span>${items.length} initiative${items.length > 1 ? 's' : ''} affichée${items.length > 1 ? 's' : ''}</span><span>·</span><span>Les montants sont ajustés par adoption, attribution, confiance, déplacement et niveau de preuve.</span></div>`;
}

function renderEvidence() {
  const totals = app.state.portfolio.totals;
  const levels = [1,2,3,4].map(level => ({ level, count: app.state.initiatives.filter(item => Number(item.evidence_level) === level).length, label: proofLabel(level), description: ['Hypothèse non testée','Signal ou étude pilote','Mesure avant/après rapprochée','Attribution robuste vérifiée'][level-1] }));
  const measurements = app.state.measurements.slice(0, 8);
  const evidence = app.state.evidence.slice(0, 8);
  const initiativeMap = Object.fromEntries(app.state.initiatives.map(item => [item.id, item]));
  return `${pageHead('Système de preuve', 'Mesurer ce qui change vraiment', 'Baseline, sources, attribution, confiance et historique : chaque chiffre peut être expliqué et audité.', `<button class="button ghost" data-action="navigate" data-view="portfolio">Choisir une initiative</button><button class="button primary" data-action="quick-measure">＋ Nouvelle mesure</button>`)}
  <section class="grid cols-4">
    <article class="panel kpi-card"><div class="kpi-label"><span>Couverture niveau 3+</span><i></i></div><strong class="kpi-value">${percent(totals.evidence_coverage)}</strong><div class="progress"><i style="--progress:${totals.evidence_coverage}%"></i></div><div class="kpi-foot"><span>${levels[2].count + levels[3].count} initiatives solides</span><span>cible 80 %</span></div></article>
    <article class="panel kpi-card"><div class="kpi-label"><span>Confiance pondérée</span><i></i></div><strong class="kpi-value">${percent(totals.confidence)}</strong><div class="progress green"><i style="--progress:${totals.confidence}%"></i></div><div class="kpi-foot"><span class="trend-up">↗ +4,1 pts</span><span>sur la valeur</span></div></article>
    <article class="panel kpi-card"><div class="kpi-label"><span>Mesures vérifiées</span><i></i></div><strong class="kpi-value">${app.state.measurements.filter(item => item.verified).length}<small> / ${app.state.measurements.length}</small></strong><div class="kpi-foot"><span>sources rapprochées</span><span>auditables</span></div></article>
    <article class="panel kpi-card"><div class="kpi-label"><span>Valeur constatée</span><i></i></div><strong class="kpi-value">${currency(totals.realized_value, true)}</strong><div class="kpi-foot"><span>${percent(totals.realized_value/Math.max(1,totals.risk_adjusted_value)*100)} du défendable</span><span>plafonnée</span></div></article>
  </section>
  <section class="dashboard-grid">
    <article class="panel span-12"><div class="panel-head"><div><h3>Échelle de preuve STRATEGY OS</h3><p>Le niveau 3 autorise un passage contrôlé à l’échelle ; le niveau 4 autorise une communication externe.</p></div></div>
      <div class="evidence-levels">${levels.map(item => `<div class="evidence-level ${item.level >= 3 ? 'active' : ''}"><span>NIVEAU ${item.level} · ${item.count} INIT.</span><strong>${item.label}</strong><p>${item.description}</p></div>`).join('')}</div>
    </article>
    <article class="panel span-7"><div class="panel-head"><div><h3>Dernières mesures</h3><p>Valeurs rapprochées des baselines et des cibles déclarées.</p></div></div><div class="evidence-list">
      ${measurements.map(item => { const initiative = initiativeMap[item.initiative_id]; return `<button class="evidence-item" data-action="open-initiative" data-id="${item.initiative_id}"><span class="evidence-icon">${item.verified ? '✓' : '…'}</span><span><b>${escapeHtml(initiative?.name || item.metric)}</b><span>${escapeHtml(item.metric)} · ${dateLabel(item.measured_at)} · ${escapeHtml(item.source)}</span></span><span class="evidence-score"><strong>${item.unit === '€' ? currency(item.current_value, true) : `${number(item.current_value)} ${escapeHtml(item.unit)}`}</strong><small>${item.verified ? 'vérifiée' : 'à vérifier'}</small></span></button>`; }).join('')}
    </div></article>
    <article class="panel span-5"><div class="panel-head"><div><h3>Registre de preuves</h3><p>Sources et niveau de qualité des observations.</p></div></div><div class="evidence-list">
      ${evidence.map(item => `<button class="evidence-item" data-action="open-initiative" data-id="${item.initiative_id}"><span class="evidence-icon">${item.verified ? '✓' : '?'}</span><span><b>${escapeHtml(item.title)}</b><span>${escapeHtml(item.source_type)} · ${dateLabel(item.observed_at)}</span></span><span class="evidence-score"><strong>${percent(item.quality_score*100)}</strong><small>qualité</small></span></button>`).join('')}
    </div></article>
    <article class="panel span-12"><div class="panel-head"><div><h3>Journal des décisions</h3><p>Trace locale des modifications importantes du portefeuille.</p></div><span class="badge green">SQLite local</span></div>
      <div class="initiative-list">${app.state.audit.slice(0,8).map((item,index) => `<div class="initiative-row"><span class="rank mono">${String(index+1).padStart(2,'0')}</span><span class="initiative-name"><b>${escapeHtml(item.action)} · ${escapeHtml(item.entity_type)}</b><span>${escapeHtml(item.detail)}</span></span><span class="initiative-progress"><small>${dateLabel(item.created_at)}</small></span><span class="initiative-value mono">#${item.entity_id || '—'}</span><span class="badge blue">tracé</span></div>`).join('')}</div>
    </article>
  </section>`;
}

function profileField(label, name, value, options = {}) {
  if (options.type === 'select') return `<div class="field"><label for="profile-${name}">${label}</label><select id="profile-${name}" name="${name}">${options.values.map(option => `<option ${option === value ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select></div>`;
  if (options.type === 'range') return `<div class="field"><label for="profile-${name}">${label}</label><div class="range-field"><input id="profile-${name}" name="${name}" type="range" min="0" max="100" step="1" value="${Math.round(Number(value)*100)}" data-profile-range><output class="range-value">${Math.round(Number(value)*100)}%</output></div>${options.hint ? `<span class="field-hint">${options.hint}</span>` : ''}</div>`;
  return `<div class="field"><label for="profile-${name}">${label}</label><input id="profile-${name}" name="${name}" type="${options.type || 'text'}" value="${escapeHtml(value)}" ${options.min !== undefined ? `min="${options.min}"` : ''} ${options.step ? `step="${options.step}"` : ''}></div>`;
}

function renderStrategy() {
  const org = app.state.organization;
  const strategy = app.state.strategy;
  const postureLabels = { 'foundation-first': 'Socle avant échelle', balanced: 'Équilibre preuve / vitesse', 'scale-first': 'Accélération maîtrisée' };
  return `${pageHead('Architecture de transformation', 'Construire une stratégie qui sait décider', 'Le profil d’entreprise, la maturité, la capacité de changement et les preuves du portefeuille déterminent une trajectoire adaptée — pas un plan générique.', `<button class="button ghost" data-action="reset-profile-form">Annuler les modifications</button><button class="button primary" data-action="save-profile">Enregistrer & recalculer</button>`)}
  <section class="strategy-layout">
    <aside class="panel"><div class="panel-head"><div><h3>ADN de l’entreprise</h3><p>Les paramètres structurants de la stratégie et du séquencement.</p></div><span class="badge orange">Modifiable</span></div>
      <form class="profile-form" id="profileForm">
        <p class="form-section-title">Identité & échelle</p>
        ${profileField('Nom de l’entreprise','name',org.name)}
        ${profileField('Secteur','sector',org.sector)}
        <div class="field-row">${profileField('Collaborateurs','employees',org.employees,{type:'number',min:1})}${profileField('Départements','departments_count',org.departments_count,{type:'number',min:1})}</div>
        <div class="field-row">${profileField('Chiffre d’affaires (€)','annual_revenue',org.annual_revenue,{type:'number',min:0})}${profileField('Budget transfo (€)','transformation_budget',org.transformation_budget,{type:'number',min:0})}</div>
        ${profileField('Modèle opératoire','operating_model',org.operating_model,{type:'select',values:['Centralisé','Fédéré','Hybride','Hybride distribué']})}
        ${profileField('Culture dominante','culture_profile',org.culture_profile,{type:'select',values:['Pragmatique orientée preuve','Entrepreneuriale','Processuelle','Ingénierie & produit','Commerciale','Régulée']})}
        ${profileField('Appétit au risque','risk_appetite',org.risk_appetite,{type:'select',values:['Prudent','Équilibré','Ambitieux']})}
        <p class="form-section-title">Capacité réelle</p>
        ${profileField('Culture IA','ai_literacy',org.ai_literacy,{type:'range',hint:'Compréhension, autonomie et qualité des usages.'})}
        ${profileField('Préparation des données','data_readiness',org.data_readiness,{type:'range',hint:'Accessibilité, qualité, propriétaires et observabilité.'})}
        ${profileField('Capacité de changement','change_capacity',org.change_capacity,{type:'range',hint:'Temps, relais, confiance et capacité managériale.'})}
        ${profileField('Maturité de gouvernance','governance_maturity',org.governance_maturity,{type:'range',hint:'Règles, arbitrages, risques, preuves et responsabilités.'})}
        ${profileField('Horizon stratégique (mois)','strategy_horizon',org.strategy_horizon,{type:'number',min:3})}
      </form>
    </aside>
    <div class="grid">
      <article class="panel"><div class="panel-head"><div><h3>Posture recommandée</h3><p>Résultat calculé à partir du contexte et de la santé du portefeuille.</p></div><button class="panel-link" data-action="generate-strategy">Générer un instantané →</button></div>
        <div class="strategy-score"><strong>${number(strategy.maturity_score)}</strong><div><b>${escapeHtml(postureLabels[strategy.posture] || strategy.posture)}</b><span>Maturité combinée · horizon ${strategy.horizon_months} mois</span></div></div>
        <div class="flow-summary">${strategy.top_value_pools.map((item,index) => `<div class="flow-summary-card"><span>POOL ${index+1}</span><strong>${escapeHtml(item.name)}</strong><small>${currency(item.addressable_value,true)} adressables · score ${number(item.opportunity_score)}</small></div>`).join('')}<div class="flow-summary-card"><span>RÈGLE</span><strong>${app.state.portfolio.totals.evidence_coverage >= 70 ? 'Accélérer' : 'Prouver'}</strong><small>${percent(app.state.portfolio.totals.evidence_coverage)} de preuves fortes</small></div></div>
      </article>
      <article class="panel"><div class="panel-head"><div><h3>Les cinq mouvements structurants</h3><p>Une séquence de décisions, avec métrique, cible et temporalité.</p></div><span class="badge green">Calculé sur les données</span></div>
        <div class="strategy-moves">${strategy.moves.map(move => `<article class="strategy-move"><span class="move-order mono">${String(move.order).padStart(2,'0')}</span><div><h3>${escapeHtml(move.title)}</h3><p>${escapeHtml(move.rationale)}</p></div><div class="move-target"><span>${escapeHtml(move.metric)}</span><strong>${escapeHtml(move.target)}</strong><small>${escapeHtml(move.phase)}</small></div></article>`).join('')}</div>
      </article>
      <article class="panel"><div class="panel-head"><div><h3>Règles de décision non négociables</h3><p>Ce qui protège la stratégie de l’effet catalogue et des ROI imaginaires.</p></div></div><div class="decision-rules">${strategy.decision_rules.map((rule,index) => `<div class="decision-rule"><i>${index+1}</i><span>${escapeHtml(rule)}</span></div>`).join('')}</div></article>
    </div>
  </section>`;
}

function scenarioMetrics() {
  const totals = app.state.portfolio.totals;
  const baseline = totals.risk_adjusted_value;
  const adoption = Math.min(1.35, app.scenario.adoption);
  const confidence = Math.min(1.25, app.scenario.confidence);
  const attribution = Math.min(1.2, app.scenario.attribution);
  const speed = Math.min(1.35, app.scenario.speed);
  const gross = baseline * adoption * confidence * attribution * speed;
  const reinvested = Math.max(0, gross - baseline) * clamp(app.scenario.reinvestment);
  const value = gross + reinvested;
  const extraCost = totals.total_cost * Math.max(0, speed - 1) * .28;
  const net = value - totals.total_cost - extraCost;
  const roi = (net / Math.max(1, totals.total_cost + extraCost)) * 100;
  const months = value > 0 ? (totals.total_cost + extraCost) / (value / 12) : 0;
  return { baseline, value, delta: value - baseline, net, roi, months, extraCost, reinvested };
}

function scenarioControl(key, title, description, min, max, step, suffix = '×') {
  const value = app.scenario[key];
  const display = suffix === '%' ? `${number(value * 100)} %` : `${number(value,2)}${suffix}`;
  return `<div class="scenario-control"><div class="scenario-control-head"><b>${title}</b><output id="out-${key}">${display}</output></div><p>${description}</p><input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-scenario="${key}" data-suffix="${suffix}"></div>`;
}

function renderScenarios() {
  const metrics = scenarioMetrics();
  const totals = app.state.portfolio.totals;
  return `${pageHead('Laboratoire de décisions', 'Tester la trajectoire, pas inventer un ROI', 'Les scénarios font varier les frictions observables du portefeuille. Ils n’écrasent jamais les mesures réelles et restent séparés de la valeur publiée.', `<button class="button ghost" data-action="reset-scenario">Réinitialiser</button><button class="button primary" data-action="save-scenario">Enregistrer le scénario</button>`)}
  <section class="scenario-layout">
    <aside class="panel"><div class="panel-head"><div><h3>Hypothèses contrôlables</h3><p>Chaque levier correspond à un mécanisme observable.</p></div><span class="badge violet">Simulation</span></div>
      ${scenarioControl('adoption','Adoption réelle','Part des personnes éligibles utilisant le système dans le flux de travail.',.65,1.35,.01)}
      ${scenarioControl('confidence','Qualité de preuve','Effet d’une meilleure instrumentation et de sources vérifiées.',.75,1.25,.01)}
      ${scenarioControl('attribution','Attribution causale','Part de l’amélioration réellement due à l’initiative.',.75,1.2,.01)}
      ${scenarioControl('speed','Vitesse de passage à l’échelle','Accélération ou ralentissement du déploiement et de la capture de valeur.',.7,1.35,.01)}
      ${scenarioControl('reinvestment','Réallocation de capacité','Part de la valeur additionnelle réinvestie en production utile.',0,1,.01,'%')}
    </aside>
    <div class="grid">
      <article class="panel"><div class="panel-head"><div><h3>Résultat du scénario</h3><p>Valeur annualisée, coûts, ROI et vitesse de récupération.</p></div><span class="badge orange">Non publié</span></div>
        <div class="scenario-results">
          <div class="scenario-result"><span>Valeur défendable simulée</span><strong>${currency(metrics.value,true)}</strong><small class="trend-up">+${currency(metrics.delta,true)} vs trajectoire actuelle</small></div>
          <div class="scenario-result"><span>Valeur nette simulée</span><strong>${currency(metrics.net,true)}</strong><small>Après ${currency(totals.total_cost+metrics.extraCost,true)} de coût complet</small></div>
          <div class="scenario-result"><span>ROI ajusté simulé</span><strong>${percent(metrics.roi,1)}</strong><small>Récupération en ${number(metrics.months,1)} mois</small></div>
          <div class="scenario-result"><span>Capacité réallouée</span><strong>${currency(metrics.reinvested,true)}</strong><small>${percent(app.scenario.reinvestment*100)} de l’incrément transformé en production</small></div>
          <div class="scenario-result"><span>Surcoût d’accélération</span><strong>${currency(metrics.extraCost,true)}</strong><small>Coût de conduite du changement et industrialisation</small></div>
          <div class="scenario-result"><span>Écart à la trajectoire</span><strong class="${metrics.delta >= 0 ? 'number-positive' : 'number-negative'}">${metrics.delta >= 0 ? '+' : ''}${percent(metrics.delta/Math.max(1,metrics.baseline)*100,1)}</strong><small>Variation par rapport à la valeur publiée actuelle</small></div>
        </div>
      </article>
      <article class="panel"><div class="panel-head"><div><h3>Avant / après</h3><p>Lecture directe de l’effet combiné des hypothèses.</p></div></div>
        <div class="scenario-compare"><div class="compare-state"><span>SITUATION ACTUELLE</span><strong>${currency(metrics.baseline,true)}</strong><p>Adoption ${percent(totals.adoption)} · confiance ${percent(totals.confidence)}</p></div><div class="compare-arrow">→</div><div class="compare-state highlight"><span>SCÉNARIO ACTIF</span><strong>${currency(metrics.value,true)}</strong><p>${metrics.delta >= 0 ? 'Valeur additionnelle' : 'Valeur à risque'} : ${currency(Math.abs(metrics.delta),true)}</p></div></div>
      </article>
      <article class="panel"><div class="panel-head"><div><h3>Lecture de décision</h3><p>Interprétation automatique sans présenter l’hypothèse comme une preuve.</p></div></div>
        <div class="decision-rules"><div class="decision-rule"><i>1</i><span>${app.scenario.adoption > 1.1 ? 'Le principal levier est l’adoption : financez le changement avant d’ajouter de nouveaux cas d’usage.' : 'L’adoption reste prudente : le scénario ne suppose pas un changement comportemental irréaliste.'}</span></div><div class="decision-rule"><i>2</i><span>${app.scenario.confidence > 1.1 ? 'La hausse de valeur dépend d’une meilleure preuve : budgétez l’instrumentation et la vérification.' : 'La qualité de preuve reste proche de l’observé ; le scénario conserve une marge d’incertitude.'}</span></div><div class="decision-rule"><i>3</i><span>${app.scenario.speed > 1.15 ? `L’accélération ajoute ${currency(metrics.extraCost,true)} de coût : exigez des jalons de sortie explicites.` : 'Le rythme de déploiement reste soutenable au regard de la capacité de changement.'}</span></div><div class="decision-rule"><i>4</i><span>${app.scenario.reinvestment < .6 ? 'Trop peu de capacité est réallouée : une partie des gains restera invisible dans le compte de résultat.' : 'La réallocation est explicite : la capacité libérée a une destination productive mesurable.'}</span></div></div>
      </article>
    </div>
  </section>`;
}

function renderResearch() {
  const org = app.state.organization;
  const departments = [...app.state.departments].map(department => {
    const score = .45*department.process_intensity + .25*department.data_readiness + .2*department.change_capacity + .1*(1-department.adoption);
    return { ...department, score: score*100 };
  }).sort((a,b)=>b.score-a.score);
  return `${pageHead('Contexte d’entreprise', 'La stratégie commence par comprendre le système', 'Taille, modèle opératoire, culture, métiers, données, capacité de changement et sources de contexte sont séparés des hypothèses de valeur.', `<button class="button ghost" data-action="navigate" data-view="strategy">Modifier le profil</button><button class="button primary" data-action="add-research">＋ Ajouter une source</button>`)}
  <section class="grid cols-4">
    <article class="panel kpi-card"><div class="kpi-label"><span>Collaborateurs</span><i></i></div><strong class="kpi-value">${number(org.employees)}</strong><div class="kpi-foot"><span>${org.departments_count} départements</span><span>${percent(org.tech_ratio*100)} tech</span></div></article>
    <article class="panel kpi-card"><div class="kpi-label"><span>Budget transformation</span><i></i></div><strong class="kpi-value">${currency(org.transformation_budget,true)}</strong><div class="kpi-foot"><span>${currency(org.transformation_budget/Math.max(1,org.employees))}/salarié</span><span>${org.strategy_horizon} mois</span></div></article>
    <article class="panel kpi-card"><div class="kpi-label"><span>Préparation données</span><i></i></div><strong class="kpi-value">${percent(org.data_readiness*100)}</strong><div class="progress blue"><i style="--progress:${org.data_readiness*100}%"></i></div><div class="kpi-foot"><span>propriétaires + qualité</span><span>observée</span></div></article>
    <article class="panel kpi-card"><div class="kpi-label"><span>Capacité de changement</span><i></i></div><strong class="kpi-value">${percent(org.change_capacity*100)}</strong><div class="progress"><i style="--progress:${org.change_capacity*100}%"></i></div><div class="kpi-foot"><span>${escapeHtml(org.culture_profile)}</span><span>${escapeHtml(org.risk_appetite)}</span></div></article>
  </section>
  <section class="research-grid" style="margin-top:14px">
    <article class="panel"><div class="panel-head"><div><h3>Sources de contexte</h3><p>Les observations structurantes utilisées par le moteur de stratégie.</p></div><span class="badge blue">${app.state.research.length} sources</span></div>
      <div class="source-list">${app.state.research.map(item => `<article class="source-card"><div class="source-top"><b>${escapeHtml(item.title)}</b><span class="badge ${item.confidence >= .8 ? 'green' : 'orange'}">${percent(item.confidence*100)} confiance</span></div><p>${escapeHtml(item.observation)}</p><small>${escapeHtml(item.category)} · source enregistrée localement</small></article>`).join('')}</div>
    </article>
    <article class="panel"><div class="panel-head"><div><h3>Carte des opportunités</h3><p>Intensité de processus × données × changement × écart d’adoption.</p></div><span class="badge orange">Priorisation</span></div>
      <div class="department-map">${departments.map(department => `<div class="department-row"><b title="${escapeHtml(department.name)}">${escapeHtml(department.name)}</b><span class="progress"><i style="--progress:${department.score}%"></i></span><span class="mono">${number(department.score)}</span><span>${department.headcount} pers.</span></div>`).join('')}</div>
    </article>
    <article class="panel"><div class="panel-head"><div><h3>Profil psychologique et opératoire</h3><p>Ce qui détermine la manière de conduire la transformation.</p></div></div>
      <div class="decision-rules"><div class="decision-rule"><i>C</i><span><b>Culture</b><br>${escapeHtml(org.culture_profile)} : privilégier des pilotes courts, instrumentés et visibles.</span></div><div class="decision-rule"><i>O</i><span><b>Organisation</b><br>${escapeHtml(org.operating_model)} : socle commun, décisions fédérées et propriétaires métiers.</span></div><div class="decision-rule"><i>R</i><span><b>Risque</b><br>${escapeHtml(org.risk_appetite)} : accélération possible avec seuils de preuve explicites.</span></div><div class="decision-rule"><i>G</i><span><b>Géographie</b><br>${escapeHtml(org.geography)} : gouvernance commune, adaptation locale des usages et mesures.</span></div></div>
    </article>
    <article class="panel"><div class="panel-head"><div><h3>Garde-fou de recherche</h3><p>Ce que l’application sait et ce qu’elle ne prétend pas savoir.</p></div></div>
      <div class="strategy-score"><strong>${app.state.research.length}</strong><div><b>observations explicites</b><span>Aucune recherche externe n’est simulée : seules les sources enregistrées influencent la stratégie.</span></div></div>
      <p style="font-size:.65rem;line-height:1.55;color:var(--muted);margin:0">Le connecteur de recherche est prévu dans l’architecture, mais il doit être relié à une source autorisée avant usage. Cette version locale privilégie la traçabilité : chaque observation possède une catégorie, une confiance et une date.</p>
    </article>
  </section>`;
}

function renderCurrentView() {
  if (!app.state) return;
  const renderers = { command: renderCommand, flows: renderFlows, portfolio: renderPortfolio, evidence: renderEvidence, strategy: renderStrategy, scenarios: renderScenarios, research: renderResearch };
  const view = $('#view');
  view.classList.remove('view-enter');
  view.innerHTML = (renderers[app.view] || renderCommand)();
  requestAnimationFrame(() => view.classList.add('view-enter'));
  $('#currentViewLabel').textContent = viewLabels[app.view];
  $$('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === app.view));
  document.title = `${viewLabels[app.view]} · STRATEGY OS`;
  renderSignals();
  bindViewInputs();
}

function navigate(view, push = true) {
  if (!viewLabels[view]) view = 'command';
  app.view = view;
  if (push && location.hash !== `#${view}`) history.pushState({ view }, '', `#${view}`);
  renderCurrentView();
  $('#view').focus({ preventScroll: true });
  $('#sidebar').classList.remove('open');
}

function bindViewInputs() {
  const search = $('#portfolioSearch');
  if (search) search.addEventListener('input', event => { app.search = event.target.value; renderCurrentView(); requestAnimationFrame(() => { const next = $('#portfolioSearch'); if (next) { next.focus(); next.setSelectionRange(app.search.length, app.search.length); } }); });
  $$('[data-profile-range]').forEach(input => input.addEventListener('input', () => { input.parentElement.querySelector('output').textContent = `${input.value}%`; }));
  $$('[data-scenario]').forEach(input => input.addEventListener('input', event => {
    const key = event.target.dataset.scenario;
    app.scenario[key] = Number(event.target.value);
    renderCurrentView();
  }));
}

function openModal(content) {
  $('#modal').innerHTML = content;
  $('#modalBackdrop').hidden = false;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => $('#modal').querySelector('input, select, button')?.focus());
}

function closeModal() {
  $('#modalBackdrop').hidden = true;
  $('#modal').innerHTML = '';
  document.body.style.overflow = '';
}

function modalShell(title, subtitle, body, footer = '') {
  return `<header class="modal-head"><div><h2 id="modalTitle">${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div><button class="modal-close" data-action="close-modal" aria-label="Fermer">×</button></header><div class="modal-body">${body}</div>${footer ? `<footer class="modal-foot">${footer}</footer>` : ''}`;
}

function initiativeForm() {
  const departments = app.state.departments;
  return `<form id="initiativeForm" class="profile-form">
    <div class="field-row"><div class="field"><label for="i-name">Nom de l’initiative</label><input id="i-name" name="name" required placeholder="Ex. Copilote de traitement"></div><div class="field"><label for="i-owner">Propriétaire</label><input id="i-owner" name="owner" required placeholder="Nom et fonction"></div></div>
    <div class="field"><label for="i-description">Changement attendu</label><textarea id="i-description" name="description" placeholder="Décrivez le travail transformé et le résultat observable — pas la technologie."></textarea></div>
    <div class="field-row"><div class="field"><label for="i-department">Département</label><select id="i-department" name="department_id">${departments.map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('')}</select></div><div class="field"><label for="i-stage">Étape</label><select id="i-stage" name="stage"><option value="experiment">Expérience</option><option value="pilot">Pilote</option><option value="active">Déployé</option><option value="scaled">À l’échelle</option></select></div></div>
    <div class="field-row"><div class="field"><label for="i-mechanism">Mécanisme</label><select id="i-mechanism" name="mechanism">${Object.entries(mechanismLabels).map(([key,label]) => `<option value="${key}">${label}</option>`).join('')}</select></div><div class="field"><label for="i-value-type">Type de valeur</label><select id="i-value-type" name="value_type">${Object.entries(valueTypeLabels).map(([key,label]) => `<option value="${key}">${label}</option>`).join('')}</select></div></div>
    <p class="form-section-title">Coût complet</p>
    <div class="field-row"><div class="field"><label for="i-investment">Investissement initial (€)</label><input id="i-investment" name="investment" type="number" min="0" value="0"></div><div class="field"><label for="i-run-cost">Coût annuel (€)</label><input id="i-run-cost" name="run_cost" type="number" min="0" value="0"></div></div>
    <div class="field-row"><div class="field"><label for="i-hours">Temps interne (heures)</label><input id="i-hours" name="internal_hours" type="number" min="0" value="0"></div><div class="field"><label for="i-hourly">Coût horaire (€)</label><input id="i-hourly" name="hourly_cost" type="number" min="0" value="60"></div></div>
    <p class="form-section-title">Valeur et preuve</p>
    <div class="field-row"><div class="field"><label for="i-annual">Valeur annuelle potentielle (€)</label><input id="i-annual" name="annualized_value" type="number" min="0" value="0"></div><div class="field"><label for="i-target">Cible cumulée (€)</label><input id="i-target" name="target_value" type="number" min="0" value="0"></div></div>
    <div class="field-row"><div class="field"><label for="i-confidence">Confiance initiale (%)</label><input id="i-confidence" name="confidence" type="number" min="0" max="100" value="50"></div><div class="field"><label for="i-attribution">Attribution estimée (%)</label><input id="i-attribution" name="attribution" type="number" min="0" max="100" value="70"></div></div>
  </form>`;
}

function openNewInitiative() {
  openModal(modalShell('Instrumenter une initiative', 'Définissez d’abord la chaîne causale, puis la valeur.', initiativeForm(), `<button class="button ghost" data-action="close-modal">Annuler</button><button class="button primary" data-action="submit-initiative">Créer l’initiative</button>`));
}

function initiativeDetails(item) {
  const measurements = app.state.measurements.filter(row => row.initiative_id === item.id);
  const evidence = app.state.evidence.filter(row => row.initiative_id === item.id);
  const measure = measurements[0];
  return modalShell(item.name, `${item.department_name} · ${item.owner}`, `
    <div class="modal-tabs"><button class="modal-tab active">Vue décision</button><button class="modal-tab" data-action="measure-initiative" data-id="${item.id}">Ajouter une mesure</button><button class="modal-tab" data-action="evidence-initiative" data-id="${item.id}">Ajouter une preuve</button></div>
    <p style="font-size:.72rem;line-height:1.55;color:var(--ink-2);margin:0 0 14px">${escapeHtml(item.description)}</p>
    <div class="detail-grid">
      <div class="detail-stat"><span>Coût complet</span><strong>${currency(item.total_cost,true)}</strong></div><div class="detail-stat"><span>Valeur défendable</span><strong>${currency(item.risk_adjusted_value,true)}</strong></div><div class="detail-stat"><span>ROI ajusté</span><strong class="${item.roi >= 0 ? 'number-positive' : 'number-negative'}">${percent(item.roi,1)}</strong></div>
      <div class="detail-stat"><span>Adoption</span><strong>${percent(item.adoption*100)}</strong></div><div class="detail-stat"><span>Confiance</span><strong>${percent(item.confidence*100)}</strong></div><div class="detail-stat"><span>Preuve</span><strong>N${item.evidence_level}</strong></div>
    </div>
    <p class="form-section-title" style="margin-top:17px">Chaîne causale</p>
    <div class="causal-chain"><div class="causal-step"><span>Effort</span><b>${currency(item.total_cost,true)}</b></div><div class="causal-step"><span>Mécanisme</span><b>${escapeHtml(mechanismLabels[item.mechanism]||item.mechanism)}</b></div><div class="causal-step"><span>Résultat</span><b>${escapeHtml(valueTypeLabels[item.value_type]||item.value_type)}</b></div><div class="causal-step"><span>Mesure</span><b>${measure ? currency(measure.current_value,true) : 'À créer'}</b></div><div class="causal-step"><span>Impact</span><b>${currency(item.risk_adjusted_value,true)}</b></div></div>
    <div class="grid cols-2" style="margin-top:15px"><div class="flow-summary-card"><span>DERNIÈRE MESURE</span><strong>${measure ? dateLabel(measure.measured_at) : 'Aucune'}</strong><small>${measure ? escapeHtml(measure.source) : 'Ajoutez une baseline et une source.'}</small></div><div class="flow-summary-card"><span>REGISTRE DE PREUVES</span><strong>${evidence.length} source${evidence.length>1?'s':''}</strong><small>${evidence.filter(row=>row.verified).length} vérifiée${evidence.filter(row=>row.verified).length>1?'s':''}</small></div></div>
  `, `<button class="button ghost" data-action="close-modal">Fermer</button><button class="button primary" data-action="measure-initiative" data-id="${item.id}">＋ Mettre à jour la mesure</button>`);
}

function openInitiative(id) {
  const item = app.state.portfolio.initiatives.find(row => Number(row.id) === Number(id));
  if (item) openModal(initiativeDetails(item));
}

function measurementForm(item) {
  return `<form id="measurementForm" class="profile-form" data-id="${item.id}"><div class="field-row"><div class="field"><label for="m-date">Date de mesure</label><input id="m-date" name="measured_at" type="date" value="${new Date().toISOString().slice(0,10)}"></div><div class="field"><label for="m-value">Valeur cumulée (€)</label><input id="m-value" name="current_value" type="number" min="0" value="${Number(item.actual_value)||0}"></div></div><div class="field-row"><div class="field"><label for="m-target">Cible (€)</label><input id="m-target" name="target" type="number" min="0" value="${Number(item.target_value)||0}"></div><div class="field"><label for="m-source">Source</label><input id="m-source" name="source" placeholder="Ex. contrôle de gestion" value="Revue portefeuille mensuelle"></div></div><div class="field"><label for="m-note">Note d’observation</label><textarea id="m-note" name="note" placeholder="Méthode, périmètre, limites…"></textarea></div><label style="display:flex;gap:8px;align-items:center;font-size:.68rem"><input type="checkbox" name="verified"> Source vérifiée par le propriétaire de la métrique</label></form>`;
}

function openMeasurement(id) {
  const item = app.state.portfolio.initiatives.find(row => Number(row.id) === Number(id));
  if (!item) return;
  openModal(modalShell('Mettre à jour la mesure', item.name, measurementForm(item), `<button class="button ghost" data-action="open-initiative" data-id="${id}">Retour</button><button class="button primary" data-action="submit-measurement" data-id="${id}">Enregistrer la mesure</button>`));
}

function evidenceForm(item) {
  return `<form id="evidenceForm" class="profile-form" data-id="${item.id}"><div class="field"><label for="e-title">Titre de la preuve</label><input id="e-title" name="title" required placeholder="Ex. comparaison avant / après validée"></div><div class="field-row"><div class="field"><label for="e-type">Type de source</label><select id="e-type" name="source_type"><option value="metric">Métrique opérationnelle</option><option value="study">Étude / pilote</option><option value="finance">Contrôle de gestion</option><option value="customer">Signal client</option><option value="audit">Audit</option></select></div><div class="field"><label for="e-score">Qualité (%)</label><input id="e-score" name="quality_score" type="number" min="0" max="100" value="70"></div></div><div class="field"><label for="e-url">Lien vers la source (optionnel)</label><input id="e-url" name="source_url" type="url" placeholder="https://…"></div><div class="field"><label for="e-note">Ce que cette preuve démontre</label><textarea id="e-note" name="note"></textarea></div><label style="display:flex;gap:8px;align-items:center;font-size:.68rem"><input type="checkbox" name="verified"> Source contrôlée et vérifiée</label></form>`;
}

function openEvidence(id) {
  const item = app.state.portfolio.initiatives.find(row => Number(row.id) === Number(id));
  if (!item) return;
  openModal(modalShell('Ajouter une preuve', item.name, evidenceForm(item), `<button class="button ghost" data-action="open-initiative" data-id="${id}">Retour</button><button class="button primary" data-action="submit-evidence" data-id="${id}">Ajouter au registre</button>`));
}

function exportModal() {
  openModal(modalShell('Exporter STRATEGY OS', 'Données locales, portables et auditables.', `<div class="grid cols-2"><a class="panel interactive" href="/api/export?format=json" download><div class="panel-head"><div><h3>Export complet JSON</h3><p>Profil, portefeuille, mesures, preuves, stratégie et journal.</p></div><span class="badge blue">.json</span></div><strong style="font-size:1.4rem">Données source</strong></a><a class="panel interactive" href="/api/export?format=csv" download><div class="panel-head"><div><h3>Portefeuille CSV</h3><p>Une ligne par initiative avec les indicateurs calculés.</p></div><span class="badge green">.csv</span></div><strong style="font-size:1.4rem">Analyse tabulaire</strong></a></div><p style="margin:14px 0 0;color:var(--muted);font-size:.64rem;line-height:1.5">Aucune donnée n’est envoyée à un service externe. Les exports sont générés directement depuis la base SQLite locale.</p>`, `<button class="button ghost" data-action="close-modal">Fermer</button>`));
}

function quickMeasure() {
  const options = topInitiatives(20).map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('');
  openModal(modalShell('Choisir une initiative', 'La mesure sera ajoutée à son registre de preuve.', `<div class="field"><label for="quickInitiative">Initiative</label><select id="quickInitiative">${options}</select></div>`, `<button class="button ghost" data-action="close-modal">Annuler</button><button class="button primary" data-action="open-selected-measure">Continuer</button>`));
}

function toast(message) {
  const id = `toast-${Date.now()}`;
  const element = document.createElement('div');
  element.className = 'toast';
  element.id = id;
  element.innerHTML = `<i>✓</i><span>${escapeHtml(message)}</span><button aria-label="Fermer">×</button>`;
  element.querySelector('button').addEventListener('click', () => element.remove());
  $('#toastStack').append(element);
  setTimeout(() => element.remove(), 4200);
}

function formObject(form) {
  const data = new FormData(form);
  const object = Object.fromEntries(data.entries());
  $$('input[type="checkbox"]', form).forEach(input => { object[input.name] = input.checked; });
  return object;
}

async function submitInitiative() {
  const form = $('#initiativeForm');
  if (!form.reportValidity()) return;
  const body = formObject(form);
  ['department_id','investment','run_cost','internal_hours','hourly_cost','annualized_value','target_value'].forEach(key => body[key] = Number(body[key]));
  body.confidence = Number(body.confidence) / 100;
  body.attribution = Number(body.attribution) / 100;
  body.adoption = .2;
  body.evidence_level = 1;
  const result = await api('/api/initiatives', { method: 'POST', body: JSON.stringify(body) });
  app.state = result.state;
  closeModal();
  app.portfolioFilter = 'all';
  navigate('portfolio');
  toast('Initiative créée et ajoutée au registre de valeur.');
}

async function submitMeasurement(id) {
  const form = $('#measurementForm');
  const body = formObject(form);
  ['current_value','target'].forEach(key => body[key] = Number(body[key]));
  body.metric = 'Valeur cumulée attribuable'; body.unit = '€'; body.baseline = 0;
  const result = await api(`/api/initiatives/${id}/measurements`, { method: 'POST', body: JSON.stringify(body) });
  app.state = result.state;
  openInitiative(id);
  toast('Mesure enregistrée et indicateurs recalculés.');
}

async function submitEvidence(id) {
  const form = $('#evidenceForm');
  if (!form.reportValidity()) return;
  const body = formObject(form);
  body.quality_score = Number(body.quality_score) / 100;
  body.observed_at = new Date().toISOString().slice(0,10);
  const result = await api(`/api/initiatives/${id}/evidence`, { method: 'POST', body: JSON.stringify(body) });
  app.state = result.state;
  openInitiative(id);
  toast('Preuve ajoutée au registre et niveau recalculé.');
}

async function saveProfile() {
  const form = $('#profileForm');
  const body = formObject(form);
  ['employees','departments_count','annual_revenue','transformation_budget','strategy_horizon'].forEach(key => body[key] = Number(body[key]));
  ['ai_literacy','data_readiness','change_capacity','governance_maturity'].forEach(key => body[key] = Number(body[key]) / 100);
  const result = await api('/api/profile', { method: 'POST', body: JSON.stringify(body) });
  app.state = result.state;
  renderCurrentView();
  toast('Profil enregistré. La stratégie a été recalculée.');
}

async function generateStrategy() {
  const result = await api('/api/strategy/generate', { method: 'POST', body: '{}' });
  app.state = result.state;
  renderCurrentView();
  toast(`Instantané stratégique #${result.snapshot_id} enregistré.`);
}

async function handleAction(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  try {
    if (action === 'navigate') navigate(target.dataset.view);
    else if (action === 'new-initiative') openNewInitiative();
    else if (action === 'open-initiative') openInitiative(target.dataset.id);
    else if (action === 'measure-initiative') openMeasurement(target.dataset.id);
    else if (action === 'evidence-initiative') openEvidence(target.dataset.id);
    else if (action === 'submit-initiative') await submitInitiative();
    else if (action === 'submit-measurement') await submitMeasurement(target.dataset.id);
    else if (action === 'submit-evidence') await submitEvidence(target.dataset.id);
    else if (action === 'close-modal') closeModal();
    else if (action === 'filter-portfolio') { app.portfolioFilter = target.dataset.filter; renderCurrentView(); }
    else if (action === 'export') exportModal();
    else if (action === 'print') window.print();
    else if (action === 'save-profile') await saveProfile();
    else if (action === 'reset-profile-form') renderCurrentView();
    else if (action === 'generate-strategy') await generateStrategy();
    else if (action === 'reset-scenario') { app.scenario = { adoption: 1, confidence: 1, attribution: 1, speed: 1, reinvestment: .65 }; renderCurrentView(); }
    else if (action === 'save-scenario') toast('Scénario conservé dans cette session. Il reste séparé des mesures publiées.');
    else if (action === 'quick-measure') quickMeasure();
    else if (action === 'open-selected-measure') openMeasurement($('#quickInitiative').value);
    else if (action === 'add-research') toast('Le connecteur de recherche est prévu ; cette version exige une source autorisée et traçable.');
  } catch (error) {
    console.error(error);
    toast(error.message || 'Une erreur est survenue.');
  }
}

function tickClock() {
  $('#liveClock').textContent = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date());
}

function registerPwa() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js').catch(console.warn);
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    app.installPrompt = event;
    $('#installButton').hidden = false;
  });
  $('#installButton').addEventListener('click', async () => {
    if (!app.installPrompt) return;
    await app.installPrompt.prompt();
    app.installPrompt = null;
    $('#installButton').hidden = true;
  });
}

async function init() {
  $('#view').innerHTML = `<div class="loading-screen"><div><div class="loader-mark"></div><p>Reconstruction de la trajectoire de valeur…</p></div></div>`;
  tickClock(); setInterval(tickClock, 1000);
  document.addEventListener('click', handleAction);
  $('#modalBackdrop').addEventListener('click', event => { if (event.target === $('#modalBackdrop')) closeModal(); });
  $('#openSidebar').addEventListener('click', () => $('#sidebar').classList.add('open'));
  $('#closeSidebar').addEventListener('click', () => $('#sidebar').classList.remove('open'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeModal();
    if (!event.ctrlKey && !event.metaKey && !event.altKey && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
      const index = Number(event.key) - 1;
      const views = Object.keys(viewLabels);
      if (index >= 0 && index < views.length) navigate(views[index]);
    }
  });
  window.addEventListener('popstate', () => navigate(location.hash.slice(1) || 'command', false));
  registerPwa();
  try {
    app.state = await api('/api/state');
    const initial = location.hash.slice(1).split('?')[0] || 'command';
    navigate(initial, false);
    if (location.hash.includes('action=new')) openNewInitiative();
  } catch (error) {
    $('#view').innerHTML = `<div class="empty-state"><div><i>!</i><h3>Impossible de charger STRATEGY OS</h3><p>${escapeHtml(error.message)}</p><button class="button primary" onclick="location.reload()">Réessayer</button></div></div>`;
  }
}

init();
