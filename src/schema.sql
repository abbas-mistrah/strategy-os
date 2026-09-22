PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  employees INTEGER NOT NULL DEFAULT 0,
  departments_count INTEGER NOT NULL DEFAULT 0,
  annual_revenue REAL NOT NULL DEFAULT 0,
  transformation_budget REAL NOT NULL DEFAULT 0,
  geography TEXT NOT NULL DEFAULT 'France',
  operating_model TEXT NOT NULL DEFAULT 'Hybride',
  culture_profile TEXT NOT NULL DEFAULT 'Pragmatique',
  risk_appetite TEXT NOT NULL DEFAULT 'Équilibré',
  tech_ratio REAL NOT NULL DEFAULT 0,
  ai_literacy REAL NOT NULL DEFAULT 0,
  data_readiness REAL NOT NULL DEFAULT 0,
  change_capacity REAL NOT NULL DEFAULT 0,
  governance_maturity REAL NOT NULL DEFAULT 0,
  strategy_horizon INTEGER NOT NULL DEFAULT 12,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  headcount INTEGER NOT NULL DEFAULT 0,
  tech_ratio REAL NOT NULL DEFAULT 0,
  avg_cost REAL NOT NULL DEFAULT 0,
  ai_maturity REAL NOT NULL DEFAULT 0,
  process_intensity REAL NOT NULL DEFAULT 0,
  data_readiness REAL NOT NULL DEFAULT 0,
  adoption REAL NOT NULL DEFAULT 0,
  change_capacity REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS initiatives (
  id INTEGER PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  department_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  owner TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  stage TEXT NOT NULL DEFAULT 'pilot',
  mechanism TEXT NOT NULL DEFAULT 'augmentation',
  value_type TEXT NOT NULL DEFAULT 'capacity',
  start_date TEXT NOT NULL,
  target_date TEXT NOT NULL,
  investment REAL NOT NULL DEFAULT 0,
  run_cost REAL NOT NULL DEFAULT 0,
  internal_hours REAL NOT NULL DEFAULT 0,
  hourly_cost REAL NOT NULL DEFAULT 0,
  baseline_value REAL NOT NULL DEFAULT 0,
  target_value REAL NOT NULL DEFAULT 0,
  actual_value REAL NOT NULL DEFAULT 0,
  annualized_value REAL NOT NULL DEFAULT 0,
  confidence REAL NOT NULL DEFAULT 0.5,
  attribution REAL NOT NULL DEFAULT 0.7,
  adoption REAL NOT NULL DEFAULT 0,
  displacement REAL NOT NULL DEFAULT 0,
  evidence_level INTEGER NOT NULL DEFAULT 1,
  risk_reduction REAL NOT NULL DEFAULT 0,
  quality_gain REAL NOT NULL DEFAULT 0,
  cycle_time_gain REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS measurements (
  id INTEGER PRIMARY KEY,
  initiative_id INTEGER NOT NULL,
  measured_at TEXT NOT NULL,
  metric TEXT NOT NULL,
  baseline REAL NOT NULL DEFAULT 0,
  current_value REAL NOT NULL DEFAULT 0,
  target REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '€',
  source TEXT NOT NULL DEFAULT '',
  verified INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (initiative_id) REFERENCES initiatives(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evidence (
  id INTEGER PRIMARY KEY,
  initiative_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'metric',
  source_url TEXT NOT NULL DEFAULT '',
  quality_score REAL NOT NULL DEFAULT 0.5,
  verified INTEGER NOT NULL DEFAULT 0,
  observed_at TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (initiative_id) REFERENCES initiatives(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS research_sources (
  id INTEGER PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  source_url TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'company',
  observation TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.5,
  captured_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS strategy_snapshots (
  id INTEGER PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  horizon_months INTEGER NOT NULL,
  strategy_json TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_initiatives_department ON initiatives(department_id);
CREATE INDEX IF NOT EXISTS idx_measurements_initiative ON measurements(initiative_id);
CREATE INDEX IF NOT EXISTS idx_evidence_initiative ON evidence(initiative_id);
