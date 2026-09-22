'use strict';

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number(value) || 0));
const round = (value, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
};

function calculateInitiative(initiative) {
  const investment = Number(initiative.investment) || 0;
  const runCost = Number(initiative.run_cost) || 0;
  const internalCost = (Number(initiative.internal_hours) || 0) * (Number(initiative.hourly_cost) || 0);
  const totalCost = investment + runCost + internalCost;
  const annualizedValue = Number(initiative.annualized_value) || 0;
  const confidence = clamp(initiative.confidence);
  const attribution = clamp(initiative.attribution);
  const adoption = clamp(initiative.adoption);
  const displacement = clamp(initiative.displacement);
  const proofFactor = 0.35 + 0.65 * clamp((Number(initiative.evidence_level) || 0) / 4);
  const riskAdjustedValue = annualizedValue * confidence * attribution * adoption * (1 - displacement) * proofFactor;
  const netValue = riskAdjustedValue - totalCost;
  const roi = totalCost > 0 ? (netValue / totalCost) * 100 : 0;
  const monthlyValue = riskAdjustedValue / 12;
  const paybackMonths = monthlyValue > 0 ? totalCost / monthlyValue : null;
  const realization = Number(initiative.target_value) > 0
    ? clamp(Number(initiative.actual_value) / Number(initiative.target_value), 0, 2)
    : adoption;

  return {
    ...initiative,
    total_cost: round(totalCost),
    risk_adjusted_value: round(riskAdjustedValue),
    net_value: round(netValue),
    roi: round(roi, 1),
    payback_months: paybackMonths === null ? null : round(paybackMonths, 1),
    realization: round(realization, 3),
    proof_factor: round(proofFactor, 3)
  };
}

function calculatePortfolio(initiatives) {
  const enriched = initiatives.map(calculateInitiative);
  const active = enriched.filter(item => item.status !== 'stopped');
  const sum = (key) => active.reduce((total, item) => total + (Number(item[key]) || 0), 0);
  const totalCost = sum('total_cost');
  const riskAdjustedValue = sum('risk_adjusted_value');
  const netValue = riskAdjustedValue - totalCost;
  const realizedValue = active.reduce((total, item) => total + Math.min(item.risk_adjusted_value, Number(item.actual_value) || 0), 0);
  const weightedConfidenceBase = active.reduce((total, item) => total + (Number(item.annualized_value) || 0), 0);
  const weightedConfidence = weightedConfidenceBase > 0
    ? active.reduce((total, item) => total + (Number(item.annualized_value) || 0) * clamp(item.confidence), 0) / weightedConfidenceBase
    : 0;
  const evidenceCoverage = active.length
    ? active.filter(item => Number(item.evidence_level) >= 3).length / active.length
    : 0;
  const averageAdoption = active.length
    ? active.reduce((total, item) => total + clamp(item.adoption), 0) / active.length
    : 0;
  const portfolioRoi = totalCost > 0 ? (netValue / totalCost) * 100 : 0;
  const valueScore = clamp(
    0.28 * Math.min(1, Math.max(0, portfolioRoi) / 200) +
    0.22 * averageAdoption +
    0.2 * weightedConfidence +
    0.18 * evidenceCoverage +
    0.12 * (active.length ? active.filter(item => item.status === 'active' || item.status === 'scaled').length / active.length : 0)
  ) * 100;

  return {
    initiatives: enriched,
    totals: {
      total_cost: round(totalCost),
      gross_value: round(sum('annualized_value')),
      risk_adjusted_value: round(riskAdjustedValue),
      realized_value: round(realizedValue),
      net_value: round(netValue),
      roi: round(portfolioRoi, 1),
      confidence: round(weightedConfidence * 100, 1),
      evidence_coverage: round(evidenceCoverage * 100, 1),
      adoption: round(averageAdoption * 100, 1),
      value_score: round(valueScore, 1),
      active_count: active.length
    }
  };
}

function departmentOpportunity(department) {
  const payroll = (Number(department.headcount) || 0) * (Number(department.avg_cost) || 0);
  const process = clamp(department.process_intensity);
  const data = clamp(department.data_readiness);
  const change = clamp(department.change_capacity);
  const maturity = clamp(department.ai_maturity);
  const adoptionGap = 1 - clamp(department.adoption);
  const addressable = payroll * (0.06 + 0.2 * process);
  const feasibility = 0.25 + 0.3 * data + 0.25 * change + 0.2 * maturity;
  const score = clamp((0.45 * process) + (0.25 * data) + (0.2 * change) + (0.1 * adoptionGap)) * 100;
  return {
    ...department,
    addressable_value: round(addressable * feasibility),
    opportunity_score: round(score, 1),
    readiness_score: round((0.4 * data + 0.35 * change + 0.25 * maturity) * 100, 1)
  };
}

function buildStrategy(organization, departments, portfolio) {
  const ranked = departments.map(departmentOpportunity).sort((a, b) => b.opportunity_score - a.opportunity_score);
  const top = ranked.slice(0, 3);
  const maturity = (
    clamp(organization.ai_literacy) +
    clamp(organization.data_readiness) +
    clamp(organization.change_capacity) +
    clamp(organization.governance_maturity)
  ) / 4;
  const horizon = Number(organization.strategy_horizon) || 12;
  const budget = Number(organization.transformation_budget) || 0;
  const budgetPerEmployee = Number(organization.employees) > 0 ? budget / Number(organization.employees) : 0;
  const guardrail = maturity < 0.45 ? 'foundation-first' : maturity < 0.7 ? 'balanced' : 'scale-first';
  const valueGap = Math.max(0, portfolio.totals.gross_value - portfolio.totals.risk_adjusted_value);
  const frInteger = (value) => Math.round(value).toLocaleString('fr-FR');

  const moves = [
    {
      id: 'focus',
      order: 1,
      title: `Concentrer l’effort sur ${top.map(item => item.name).join(', ')}`,
      rationale: `${frInteger(top.reduce((sum, item) => sum + item.addressable_value, 0))} € de valeur adressable, avec une priorité donnée aux domaines où données, capacité de changement et intensité opérationnelle se recoupent.`,
      metric: 'Valeur ajustée livrée',
      target: `${Math.max(3, Math.min(8, top.length * 2))} initiatives instrumentées`,
      phase: '0–90 jours'
    },
    {
      id: 'evidence',
      order: 2,
      title: 'Installer un contrat de preuve avant chaque mise à l’échelle',
      rationale: `${frInteger(valueGap)} € séparent encore la valeur théorique de la valeur défendable. Chaque initiative doit fixer baseline, groupe de comparaison, attribution et source de mesure avant financement additionnel.`,
      metric: 'Couverture de preuve',
      target: '≥ 80 % niveau 3 ou 4',
      phase: '0–90 jours'
    },
    {
      id: 'adoption',
      order: 3,
      title: 'Convertir la capacité libérée en résultat d’entreprise',
      rationale: `L’adoption moyenne est de ${portfolio.totals.adoption} %. Les heures gagnées ne deviennent de la valeur que si elles sont explicitement réallouées à la production, au revenu, à la qualité ou au risque.`,
      metric: 'Taux de réallocation constaté',
      target: '≥ 70 % des heures libérées',
      phase: '3–6 mois'
    },
    {
      id: 'platform',
      order: 4,
      title: guardrail === 'foundation-first' ? 'Sécuriser le socle données, compétences et gouvernance' : 'Industrialiser les composants communs et la télémétrie',
      rationale: guardrail === 'foundation-first'
        ? 'La capacité d’exécution actuelle impose un séquencement : données observables, propriétaires de métriques, compétences et règles de décision avant la multiplication des cas d’usage.'
        : 'Le niveau de maturité permet de mutualiser orchestration, observabilité, évaluation et contrôles sans ralentir les équipes métiers.',
      metric: 'Délai idée → preuve',
      target: 'Réduction de 35 %',
      phase: '3–9 mois'
    },
    {
      id: 'cadence',
      order: 5,
      title: 'Piloter le portefeuille par décisions, pas par activité',
      rationale: `Avec ${frInteger(budgetPerEmployee)} € de budget de transformation par salarié, le comité mensuel doit réallouer les moyens selon valeur observée, confiance et coût d’opportunité.`,
      metric: 'Capital réalloué vers les preuves fortes',
      target: '≥ 20 % par trimestre',
      phase: `Continu · horizon ${horizon} mois`
    }
  ];

  return {
    generated_at: new Date().toISOString(),
    horizon_months: horizon,
    posture: guardrail,
    maturity_score: round(maturity * 100, 1),
    top_value_pools: top,
    moves,
    decision_rules: [
      'Aucune initiative ne passe à l’échelle sans baseline et propriétaire de métrique.',
      'La capacité libérée doit être réallouée et observée ; sinon elle reste un bénéfice potentiel.',
      'La valeur publiée est ajustée par confiance, attribution, adoption, déplacement et qualité de preuve.',
      'Une initiative faible deux revues consécutives est arrêtée, redessinée ou fusionnée.'
    ]
  };
}

function buildValueFlows(initiatives) {
  const enriched = initiatives.map(calculateInitiative).filter(item => item.status !== 'stopped');
  const by = (key) => Object.values(enriched.reduce((acc, item) => {
    const label = item[key] || 'other';
    if (!acc[label]) acc[label] = { key: label, value: 0, count: 0 };
    acc[label].value += Math.max(0, key === 'mechanism' ? item.total_cost : item.risk_adjusted_value);
    acc[label].count += 1;
    return acc;
  }, {}));

  const inputs = [
    { key: 'budget', value: enriched.reduce((sum, item) => sum + Number(item.investment || 0) + Number(item.run_cost || 0), 0) },
    { key: 'talent', value: enriched.reduce((sum, item) => sum + Number(item.internal_hours || 0) * Number(item.hourly_cost || 0), 0) },
    { key: 'data', value: enriched.reduce((sum, item) => sum + item.total_cost * clamp(item.proof_factor) * 0.12, 0) }
  ].map(item => ({ ...item, value: round(item.value) }));

  return {
    inputs,
    mechanisms: by('mechanism').map(item => ({ ...item, value: round(item.value) })),
    outputs: [
      { key: 'capacity', value: round(enriched.filter(i => i.value_type === 'capacity').reduce((s, i) => s + i.risk_adjusted_value, 0)) },
      { key: 'revenue', value: round(enriched.filter(i => i.value_type === 'revenue').reduce((s, i) => s + i.risk_adjusted_value, 0)) },
      { key: 'cost', value: round(enriched.filter(i => i.value_type === 'cost').reduce((s, i) => s + i.risk_adjusted_value, 0)) },
      { key: 'risk', value: round(enriched.filter(i => i.value_type === 'risk').reduce((s, i) => s + i.risk_adjusted_value, 0)) },
      { key: 'experience', value: round(enriched.filter(i => i.value_type === 'experience').reduce((s, i) => s + i.risk_adjusted_value, 0)) }
    ],
    outcomes: [
      { key: 'realized', value: round(enriched.reduce((s, i) => s + Math.min(i.risk_adjusted_value, Number(i.actual_value) || 0), 0)) },
      { key: 'defendable', value: round(enriched.reduce((s, i) => s + i.risk_adjusted_value, 0)) },
      { key: 'potential', value: round(enriched.reduce((s, i) => s + Number(i.annualized_value || 0), 0)) }
    ]
  };
}

module.exports = {
  clamp,
  round,
  calculateInitiative,
  calculatePortfolio,
  departmentOpportunity,
  buildStrategy,
  buildValueFlows
};
