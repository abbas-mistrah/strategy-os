'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const projectRoot = path.resolve(__dirname, '..');
const dataDirectory = path.join(projectRoot, 'data');
const databasePath = process.env.TRAJECTOIRE_DB || path.join(dataDirectory, 'trajectoire.db');
fs.mkdirSync(dataDirectory, { recursive: true });

const db = new DatabaseSync(databasePath);
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

const departmentsSeed = [
  ['Tech & Data', 310, 0.92, 79000, 0.72, 0.78, 0.82, 0.61, 0.74],
  ['Produit', 155, 0.54, 72000, 0.66, 0.71, 0.76, 0.58, 0.72],
  ['Relations clients', 420, 0.12, 46000, 0.44, 0.93, 0.68, 0.49, 0.63],
  ['Marketing & Communication', 112, 0.26, 61000, 0.55, 0.76, 0.63, 0.57, 0.68],
  ['Ventes', 285, 0.16, 67000, 0.38, 0.81, 0.57, 0.42, 0.59],
  ['Finance', 94, 0.18, 69000, 0.41, 0.84, 0.73, 0.39, 0.51],
  ['Ressources humaines', 76, 0.14, 59000, 0.46, 0.69, 0.62, 0.51, 0.66],
  ['Juridique & Conformité', 48, 0.09, 82000, 0.35, 0.73, 0.49, 0.33, 0.47],
  ['Opérations', 365, 0.21, 51000, 0.49, 0.88, 0.65, 0.46, 0.61],
  ['Direction & Stratégie', 35, 0.2, 105000, 0.58, 0.64, 0.71, 0.62, 0.7]
];

const initiativesSeed = [
  {
    department: 'Relations clients', name: 'Copilote de résolution omnicanale', owner: 'Nora Diallo', stage: 'scaled', mechanism: 'augmentation', value_type: 'capacity',
    description: 'Prépare les réponses, retrouve la politique applicable et résume le dossier avant validation humaine.', investment: 185000, run_cost: 92000, hours: 3400, hourly: 48,
    target: 980000, actual: 612000, annual: 1260000, confidence: 0.88, attribution: 0.72, adoption: 0.81, displacement: 0.08, evidence: 4, risk: 0.18, quality: 0.14, cycle: 0.31
  },
  {
    department: 'Tech & Data', name: 'Assistant de livraison logicielle', owner: 'Marc André', stage: 'scaled', mechanism: 'augmentation', value_type: 'capacity',
    description: 'Accélère compréhension du code, tests, documentation et résolution d’incidents avec contrôles de qualité.', investment: 240000, run_cost: 138000, hours: 5200, hourly: 67,
    target: 1750000, actual: 1040000, annual: 2180000, confidence: 0.82, attribution: 0.64, adoption: 0.73, displacement: 0.12, evidence: 3, risk: 0.16, quality: 0.11, cycle: 0.27
  },
  {
    department: 'Marketing & Communication', name: 'Studio de campagnes adaptatives', owner: 'Sofia Martin', stage: 'active', mechanism: 'augmentation', value_type: 'revenue',
    description: 'Produit et teste des variantes créatives dans un cadre de marque et de conformité mesuré.', investment: 118000, run_cost: 64000, hours: 1800, hourly: 56,
    target: 760000, actual: 304000, annual: 940000, confidence: 0.74, attribution: 0.58, adoption: 0.66, displacement: 0.09, evidence: 3, risk: 0.08, quality: 0.19, cycle: 0.44
  },
  {
    department: 'Finance', name: 'Clôture augmentée et contrôle d’anomalies', owner: 'Inès Robert', stage: 'active', mechanism: 'automation', value_type: 'cost',
    description: 'Automatise les rapprochements répétitifs et priorise les écarts à investiguer.', investment: 132000, run_cost: 48000, hours: 2200, hourly: 62,
    target: 590000, actual: 287000, annual: 710000, confidence: 0.86, attribution: 0.78, adoption: 0.69, displacement: 0.06, evidence: 4, risk: 0.32, quality: 0.22, cycle: 0.36
  },
  {
    department: 'Ventes', name: 'Préparation intelligente des rendez-vous', owner: 'Thomas Leroy', stage: 'pilot', mechanism: 'decision', value_type: 'revenue',
    description: 'Synthétise signaux clients, contexte du compte et prochaines meilleures actions.', investment: 94000, run_cost: 52000, hours: 1550, hourly: 58,
    target: 850000, actual: 170000, annual: 1320000, confidence: 0.63, attribution: 0.46, adoption: 0.52, displacement: 0.1, evidence: 2, risk: 0.04, quality: 0.13, cycle: 0.18
  },
  {
    department: 'Produit', name: 'Analyse continue de la voix client', owner: 'Léa Perrin', stage: 'active', mechanism: 'intelligence', value_type: 'experience',
    description: 'Relie retours qualitatifs, événements produit et motifs de contact pour guider les décisions.', investment: 148000, run_cost: 74000, hours: 2100, hourly: 64,
    target: 680000, actual: 246000, annual: 840000, confidence: 0.69, attribution: 0.54, adoption: 0.62, displacement: 0.05, evidence: 3, risk: 0.09, quality: 0.27, cycle: 0.24
  },
  {
    department: 'Juridique & Conformité', name: 'Revue contractuelle avec critères scellés', owner: 'Alice Cohen', stage: 'pilot', mechanism: 'augmentation', value_type: 'risk',
    description: 'Pré-analyse les clauses, documente les critères et conserve la trace de chaque décision.', investment: 126000, run_cost: 39000, hours: 1350, hourly: 78,
    target: 520000, actual: 124000, annual: 660000, confidence: 0.72, attribution: 0.67, adoption: 0.47, displacement: 0.03, evidence: 3, risk: 0.41, quality: 0.16, cycle: 0.29
  },
  {
    department: 'Ressources humaines', name: 'Mobilité et compétences assistées', owner: 'Camille Bernard', stage: 'pilot', mechanism: 'decision', value_type: 'experience',
    description: 'Cartographie compétences, opportunités internes et besoins de développement sans décision automatisée.', investment: 87000, run_cost: 43000, hours: 1100, hourly: 55,
    target: 430000, actual: 86000, annual: 540000, confidence: 0.6, attribution: 0.48, adoption: 0.41, displacement: 0.07, evidence: 2, risk: 0.12, quality: 0.18, cycle: 0.12
  },
  {
    department: 'Opérations', name: 'Orchestration prédictive des opérations', owner: 'Julien Moreau', stage: 'active', mechanism: 'automation', value_type: 'cost',
    description: 'Anticipe les pics, recommande l’allocation de capacité et automatise les tâches à faible variabilité.', investment: 276000, run_cost: 121000, hours: 4600, hourly: 51,
    target: 1480000, actual: 592000, annual: 1860000, confidence: 0.77, attribution: 0.69, adoption: 0.64, displacement: 0.11, evidence: 3, risk: 0.21, quality: 0.09, cycle: 0.22
  },
  {
    department: 'Direction & Stratégie', name: 'Cockpit de décisions de transformation', owner: 'Abbas Mistrah', stage: 'active', mechanism: 'intelligence', value_type: 'risk',
    description: 'Centralise preuves, arbitrages, dépendances et trajectoires de valeur du portefeuille.', investment: 165000, run_cost: 58000, hours: 1750, hourly: 82,
    target: 820000, actual: 338000, annual: 1040000, confidence: 0.79, attribution: 0.61, adoption: 0.71, displacement: 0.02, evidence: 4, risk: 0.36, quality: 0.21, cycle: 0.19
  },
  {
    department: 'Tech & Data', name: 'Observabilité et évaluation des modèles', owner: 'Yanis Fontaine', stage: 'active', mechanism: 'platform', value_type: 'risk',
    description: 'Mesure qualité, coût, dérive et conformité des systèmes IA en production.', investment: 218000, run_cost: 112000, hours: 2900, hourly: 69,
    target: 960000, actual: 398000, annual: 1220000, confidence: 0.84, attribution: 0.74, adoption: 0.68, displacement: 0.02, evidence: 4, risk: 0.48, quality: 0.24, cycle: 0.15
  },
  {
    department: 'Relations clients', name: 'Résumé qualité post-interaction', owner: 'Sarah Nguyen', stage: 'experiment', mechanism: 'automation', value_type: 'experience',
    description: 'Structure le résumé de contact, suggère la catégorisation et alimente la boucle qualité.', investment: 46000, run_cost: 26000, hours: 650, hourly: 47,
    target: 280000, actual: 42000, annual: 390000, confidence: 0.55, attribution: 0.52, adoption: 0.34, displacement: 0.04, evidence: 2, risk: 0.07, quality: 0.22, cycle: 0.16
  }
];

function seedDatabase() {
  const count = Number(db.prepare('SELECT COUNT(*) AS count FROM organizations').get().count);
  if (count > 0) return;

  db.exec('BEGIN');
  try {
    db.prepare(`INSERT INTO organizations (
      id, name, sector, employees, departments_count, annual_revenue, transformation_budget,
      geography, operating_model, culture_profile, risk_appetite, tech_ratio, ai_literacy,
      data_readiness, change_capacity, governance_maturity, strategy_horizon
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(1, 'Horizon Group · Démonstration', 'Services numériques & plateformes', 1900, 10, 485000000, 6200000,
        'France & Europe', 'Hybride distribué', 'Pragmatique orientée preuve', 'Équilibré', 0.31, 0.58, 0.69, 0.62, 0.66, 18);

    const insertDepartment = db.prepare(`INSERT INTO departments (
      organization_id, name, headcount, tech_ratio, avg_cost, ai_maturity, process_intensity,
      data_readiness, adoption, change_capacity
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    for (const row of departmentsSeed) insertDepartment.run(1, ...row);

    const departmentMap = Object.fromEntries(db.prepare('SELECT id, name FROM departments').all().map(row => [row.name, Number(row.id)]));
    const insertInitiative = db.prepare(`INSERT INTO initiatives (
      organization_id, department_id, name, owner, description, status, stage, mechanism, value_type,
      start_date, target_date, investment, run_cost, internal_hours, hourly_cost, baseline_value,
      target_value, actual_value, annualized_value, confidence, attribution, adoption, displacement,
      evidence_level, risk_reduction, quality_gain, cycle_time_gain
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    initiativesSeed.forEach((item, index) => {
      const startMonth = String((index % 8) + 1).padStart(2, '0');
      const result = insertInitiative.run(
        1, departmentMap[item.department], item.name, item.owner, item.description,
        item.stage === 'experiment' ? 'watch' : item.stage === 'scaled' ? 'scaled' : 'active', item.stage,
        item.mechanism, item.value_type, `2026-${startMonth}-01`, `2027-${startMonth}-28`, item.investment,
        item.run_cost, item.hours, item.hourly, 0, item.target, item.actual, Math.round(item.annual * 1.65), item.confidence,
        item.attribution, item.adoption, item.displacement, item.evidence, item.risk, item.quality, item.cycle
      );
      const initiativeId = Number(result.lastInsertRowid);
      db.prepare(`INSERT INTO measurements (
        initiative_id, measured_at, metric, baseline, current_value, target, unit, source, verified, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(initiativeId, '2026-09-01', 'Valeur cumulée attribuable', 0, item.actual, item.target, '€', 'Revue portefeuille mensuelle', item.evidence >= 3 ? 1 : 0, 'Données de démonstration anonymisées.');
      db.prepare(`INSERT INTO evidence (
        initiative_id, title, source_type, source_url, quality_score, verified, observed_at, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(initiativeId, item.evidence >= 3 ? 'Mesure opérationnelle rapprochée' : 'Observation de pilote', item.evidence >= 3 ? 'metric' : 'study', '', Math.min(0.96, 0.38 + item.evidence * 0.14), item.evidence >= 3 ? 1 : 0, '2026-09-01', 'Jeu de démonstration — aucune donnée d’entreprise réelle.');
    });

    const insertResearch = db.prepare(`INSERT INTO research_sources (
      organization_id, title, category, observation, confidence
    ) VALUES (?, ?, ?, ?, ?)`);
    insertResearch.run(1, 'Rapport annuel — synthèse interne', 'strategy', 'Croissance sous pression sur les coûts ; priorité donnée à la vitesse d’exécution, à la qualité de service et à la maîtrise du risque.', 0.86);
    insertResearch.run(1, 'Baromètre collaborateurs — démonstration', 'people', 'Forte appétence pour les assistants individuels, mais demande explicite de règles simples, de temps de formation et de preuves sur la qualité.', 0.74);
    insertResearch.run(1, 'Inventaire data & plateformes', 'technology', 'Les principaux domaines disposent de données exploitables, avec une dette de qualité concentrée dans les opérations et les fonctions commerciales.', 0.81);
    insertResearch.run(1, 'Cartographie des processus', 'operations', 'Les plus grands volumes répétitifs se situent dans la relation client, les opérations, la finance et le cycle de livraison logicielle.', 0.79);

    db.prepare('INSERT INTO audit_log (entity_type, entity_id, action, detail) VALUES (?, ?, ?, ?)')
      .run('system', 1, 'seed', 'Jeu de démonstration initialisé');
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function rowNumber(value) {
  return typeof value === 'bigint' ? Number(value) : value;
}

function normalizeRows(rows) {
  return rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, rowNumber(value)])));
}

function getState() {
  const organization = db.prepare('SELECT * FROM organizations ORDER BY id LIMIT 1').get();
  const departments = normalizeRows(db.prepare('SELECT * FROM departments ORDER BY id').all());
  const initiatives = normalizeRows(db.prepare(`SELECT i.*, d.name AS department_name
    FROM initiatives i JOIN departments d ON d.id = i.department_id ORDER BY i.id`).all());
  const measurements = normalizeRows(db.prepare('SELECT * FROM measurements ORDER BY measured_at DESC, id DESC').all());
  const evidence = normalizeRows(db.prepare('SELECT * FROM evidence ORDER BY observed_at DESC, id DESC').all());
  const research = normalizeRows(db.prepare('SELECT * FROM research_sources ORDER BY confidence DESC, id DESC').all());
  const audit = normalizeRows(db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT 40').all());
  return { organization: organization ? Object.fromEntries(Object.entries(organization).map(([k, v]) => [k, rowNumber(v)])) : null, departments, initiatives, measurements, evidence, research, audit };
}

const organizationFields = [
  'name', 'sector', 'employees', 'departments_count', 'annual_revenue', 'transformation_budget',
  'geography', 'operating_model', 'culture_profile', 'risk_appetite', 'tech_ratio', 'ai_literacy',
  'data_readiness', 'change_capacity', 'governance_maturity', 'strategy_horizon'
];

function updateOrganization(input) {
  const payload = Object.fromEntries(organizationFields.filter(field => input[field] !== undefined).map(field => [field, input[field]]));
  const fields = Object.keys(payload);
  if (!fields.length) return getState().organization;
  const sql = `UPDATE organizations SET ${fields.map(field => `${field} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = 1`;
  db.prepare(sql).run(...fields.map(field => payload[field]));
  logAudit('organization', 1, 'update', `Profil mis à jour : ${fields.join(', ')}`);
  return getState().organization;
}

const initiativeFields = [
  'department_id', 'name', 'owner', 'description', 'status', 'stage', 'mechanism', 'value_type',
  'start_date', 'target_date', 'investment', 'run_cost', 'internal_hours', 'hourly_cost', 'baseline_value',
  'target_value', 'actual_value', 'annualized_value', 'confidence', 'attribution', 'adoption', 'displacement',
  'evidence_level', 'risk_reduction', 'quality_gain', 'cycle_time_gain'
];

function createInitiative(input) {
  const defaults = {
    department_id: 1, name: 'Nouvelle initiative', owner: 'À attribuer', description: '', status: 'active',
    stage: 'experiment', mechanism: 'augmentation', value_type: 'capacity', start_date: new Date().toISOString().slice(0, 10),
    target_date: `${new Date().getFullYear() + 1}-12-31`, investment: 0, run_cost: 0, internal_hours: 0,
    hourly_cost: 60, baseline_value: 0, target_value: 0, actual_value: 0, annualized_value: 0,
    confidence: 0.5, attribution: 0.7, adoption: 0.2, displacement: 0, evidence_level: 1,
    risk_reduction: 0, quality_gain: 0, cycle_time_gain: 0
  };
  const item = { ...defaults, ...Object.fromEntries(initiativeFields.filter(field => input[field] !== undefined).map(field => [field, input[field]])) };
  const result = db.prepare(`INSERT INTO initiatives (
    organization_id, ${initiativeFields.join(', ')}
  ) VALUES (1, ${initiativeFields.map(() => '?').join(', ')})`).run(...initiativeFields.map(field => item[field]));
  const id = Number(result.lastInsertRowid);
  logAudit('initiative', id, 'create', item.name);
  return db.prepare(`SELECT i.*, d.name AS department_name FROM initiatives i JOIN departments d ON d.id = i.department_id WHERE i.id = ?`).get(id);
}

function updateInitiative(id, input) {
  const payload = Object.fromEntries(initiativeFields.filter(field => input[field] !== undefined).map(field => [field, input[field]]));
  const fields = Object.keys(payload);
  if (!fields.length) return db.prepare('SELECT * FROM initiatives WHERE id = ?').get(id);
  const result = db.prepare(`UPDATE initiatives SET ${fields.map(field => `${field} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(...fields.map(field => payload[field]), id);
  if (Number(result.changes) === 0) return null;
  logAudit('initiative', id, 'update', fields.join(', '));
  return db.prepare(`SELECT i.*, d.name AS department_name FROM initiatives i JOIN departments d ON d.id = i.department_id WHERE i.id = ?`).get(id);
}

function addMeasurement(initiativeId, input) {
  const initiative = db.prepare('SELECT * FROM initiatives WHERE id = ?').get(initiativeId);
  if (!initiative) return null;
  const measuredAt = input.measured_at || new Date().toISOString().slice(0, 10);
  const metric = input.metric || 'Valeur cumulée attribuable';
  const baseline = Number(input.baseline) || 0;
  const currentValue = Number(input.current_value) || 0;
  const target = Number(input.target) || Number(initiative.target_value) || 0;
  const unit = input.unit || '€';
  const source = input.source || 'Mise à jour manuelle';
  const verified = input.verified ? 1 : 0;
  const note = input.note || '';
  const result = db.prepare(`INSERT INTO measurements (
    initiative_id, measured_at, metric, baseline, current_value, target, unit, source, verified, note
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(initiativeId, measuredAt, metric, baseline, currentValue, target, unit, source, verified, note);
  db.prepare('UPDATE initiatives SET actual_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(currentValue, initiativeId);
  logAudit('measurement', Number(result.lastInsertRowid), 'create', `${metric} = ${currentValue} ${unit}`);
  return db.prepare('SELECT * FROM measurements WHERE id = ?').get(Number(result.lastInsertRowid));
}

function addEvidence(initiativeId, input) {
  if (!db.prepare('SELECT id FROM initiatives WHERE id = ?').get(initiativeId)) return null;
  const result = db.prepare(`INSERT INTO evidence (
    initiative_id, title, source_type, source_url, quality_score, verified, observed_at, note
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    initiativeId, input.title || 'Nouvelle preuve', input.source_type || 'metric', input.source_url || '',
    Number(input.quality_score) || 0.5, input.verified ? 1 : 0,
    input.observed_at || new Date().toISOString().slice(0, 10), input.note || ''
  );
  const evidenceCount = Number(db.prepare('SELECT COUNT(*) AS count FROM evidence WHERE initiative_id = ?').get(initiativeId).count);
  const verifiedCount = Number(db.prepare('SELECT COUNT(*) AS count FROM evidence WHERE initiative_id = ? AND verified = 1').get(initiativeId).count);
  const level = Math.min(4, Math.max(1, verifiedCount >= 2 ? 4 : verifiedCount === 1 ? 3 : evidenceCount >= 2 ? 2 : 1));
  db.prepare('UPDATE initiatives SET evidence_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(level, initiativeId);
  logAudit('evidence', Number(result.lastInsertRowid), 'create', input.title || 'Nouvelle preuve');
  return db.prepare('SELECT * FROM evidence WHERE id = ?').get(Number(result.lastInsertRowid));
}

function saveStrategy(strategy) {
  const result = db.prepare('INSERT INTO strategy_snapshots (organization_id, horizon_months, strategy_json) VALUES (1, ?, ?)')
    .run(strategy.horizon_months, JSON.stringify(strategy));
  logAudit('strategy', Number(result.lastInsertRowid), 'generate', `Horizon ${strategy.horizon_months} mois`);
  return Number(result.lastInsertRowid);
}

function logAudit(entityType, entityId, action, detail = '') {
  db.prepare('INSERT INTO audit_log (entity_type, entity_id, action, detail) VALUES (?, ?, ?, ?)')
    .run(entityType, entityId, action, detail);
}

seedDatabase();

module.exports = {
  db,
  databasePath,
  getState,
  updateOrganization,
  createInitiative,
  updateInitiative,
  addMeasurement,
  addEvidence,
  saveStrategy
};
