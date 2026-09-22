'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateInitiative, calculatePortfolio, departmentOpportunity, buildStrategy } = require('../src/engine');

test('adjusts value by confidence, attribution, adoption, displacement and evidence', () => {
  const result = calculateInitiative({
    investment: 100, run_cost: 20, internal_hours: 2, hourly_cost: 40,
    annualized_value: 1000, confidence: 0.8, attribution: 0.75, adoption: 0.5,
    displacement: 0.1, evidence_level: 4, target_value: 600, actual_value: 300
  });
  assert.equal(result.total_cost, 200);
  assert.equal(result.risk_adjusted_value, 270);
  assert.equal(result.net_value, 70);
  assert.equal(result.roi, 35);
  assert.equal(result.realization, 0.5);
});

test('portfolio aggregates active initiatives and excludes stopped ones', () => {
  const result = calculatePortfolio([
    { status: 'active', investment: 100, annualized_value: 1000, confidence: 1, attribution: 1, adoption: 1, displacement: 0, evidence_level: 4, actual_value: 500, target_value: 1000 },
    { status: 'stopped', investment: 999, annualized_value: 9999, confidence: 1, attribution: 1, adoption: 1, displacement: 0, evidence_level: 4 }
  ]);
  assert.equal(result.totals.active_count, 1);
  assert.equal(result.totals.total_cost, 100);
  assert.equal(result.totals.risk_adjusted_value, 1000);
});

test('department opportunity rewards process intensity and readiness', () => {
  const high = departmentOpportunity({ headcount: 100, avg_cost: 50000, process_intensity: 0.9, data_readiness: 0.8, change_capacity: 0.8, ai_maturity: 0.7, adoption: 0.3 });
  const low = departmentOpportunity({ headcount: 100, avg_cost: 50000, process_intensity: 0.2, data_readiness: 0.2, change_capacity: 0.2, ai_maturity: 0.2, adoption: 0.3 });
  assert.ok(high.addressable_value > low.addressable_value);
  assert.ok(high.opportunity_score > low.opportunity_score);
});

test('strategy produces five decision-oriented moves', () => {
  const organization = { ai_literacy: 0.6, data_readiness: 0.6, change_capacity: 0.6, governance_maturity: 0.6, strategy_horizon: 12, transformation_budget: 1000000, employees: 1000 };
  const departments = [
    { name: 'A', headcount: 100, avg_cost: 50000, process_intensity: 0.9, data_readiness: 0.8, change_capacity: 0.8, ai_maturity: 0.7, adoption: 0.3 },
    { name: 'B', headcount: 90, avg_cost: 50000, process_intensity: 0.8, data_readiness: 0.7, change_capacity: 0.7, ai_maturity: 0.6, adoption: 0.4 },
    { name: 'C', headcount: 80, avg_cost: 50000, process_intensity: 0.7, data_readiness: 0.6, change_capacity: 0.6, ai_maturity: 0.5, adoption: 0.5 }
  ];
  const strategy = buildStrategy(organization, departments, { totals: { gross_value: 2000000, risk_adjusted_value: 1000000, adoption: 55 } });
  assert.equal(strategy.moves.length, 5);
  assert.equal(strategy.top_value_pools.length, 3);
  assert.ok(strategy.decision_rules.length >= 4);
});
