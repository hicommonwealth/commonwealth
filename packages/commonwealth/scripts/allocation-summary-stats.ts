/* eslint-disable no-warning-comments, no-case-declarations, n/no-process-exit, max-len */

import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { QueryTypes } from 'sequelize';

interface SummaryStats {
  total_users: number;
  total_tokens: number;
  avg_tokens: number;
  median_tokens: number;
  std_dev_tokens: number;
  min_tokens: number;
  max_tokens: number;
  top_1_percent_share: number;
  top_5_percent_share: number;
  top_10_percent_share: number;
  gini_coefficient: number;
  users_with_zero_allocation: number;
  users_above_1000_tokens: number;
  users_above_10000_tokens: number;
  users_above_100000_tokens: number;
  // Non-zero stats
  users_with_nonzero_allocation: number;
  avg_tokens_nonzero: number;
  median_tokens_nonzero: number;
  std_dev_tokens_nonzero: number;
  min_tokens_nonzero: number;
}

interface AllocationPercentiles {
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

async function getHistoricalSummaryStats(): Promise<SummaryStats> {
  const results = await models.sequelize.query<SummaryStats>(
    `
    WITH allocation_data AS (
      SELECT 
        ha.token_allocation,
        ROW_NUMBER() OVER (ORDER BY ha.token_allocation DESC) as rank,
        COUNT(*) OVER () as total_count
      FROM "HistoricalAllocations" ha
      WHERE ha.token_allocation > 0
    ),
    basic_stats AS (
      SELECT 
        COUNT(*) as total_users,
        SUM(ha.token_allocation) as total_tokens,
        AVG(ha.token_allocation) as avg_tokens,
        STDDEV(ha.token_allocation) as std_dev_tokens,
        MIN(ha.token_allocation) as min_tokens,
        MAX(ha.token_allocation) as max_tokens,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ha.token_allocation) as median_tokens
      FROM "HistoricalAllocations" ha
    ),
    nonzero_stats AS (
      SELECT 
        COUNT(*) as users_with_nonzero_allocation,
        AVG(ha.token_allocation) as avg_tokens_nonzero,
        STDDEV(ha.token_allocation) as std_dev_tokens_nonzero,
        MIN(ha.token_allocation) as min_tokens_nonzero,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ha.token_allocation) as median_tokens_nonzero
      FROM "HistoricalAllocations" ha
      WHERE ha.token_allocation > 0
    ),
    concentration_stats AS (
      SELECT 
        (SELECT SUM(token_allocation) FROM allocation_data WHERE rank <= CEIL(total_count * 0.01)) as top_1_percent_tokens,
        (SELECT SUM(token_allocation) FROM allocation_data WHERE rank <= CEIL(total_count * 0.05)) as top_5_percent_tokens,
        (SELECT SUM(token_allocation) FROM allocation_data WHERE rank <= CEIL(total_count * 0.10)) as top_10_percent_tokens,
        (SELECT total_tokens FROM basic_stats) as total_tokens
      FROM allocation_data
      LIMIT 1
    ),
    threshold_counts AS (
      SELECT 
        COUNT(CASE WHEN ha.token_allocation = 0 THEN 1 END) as users_with_zero_allocation,
        COUNT(CASE WHEN ha.token_allocation > 1000 THEN 1 END) as users_above_1000_tokens,
        COUNT(CASE WHEN ha.token_allocation > 10000 THEN 1 END) as users_above_10000_tokens,
        COUNT(CASE WHEN ha.token_allocation > 100000 THEN 1 END) as users_above_100000_tokens
      FROM "HistoricalAllocations" ha
    )
    SELECT 
      bs.total_users,
      bs.total_tokens,
      bs.avg_tokens,
      bs.median_tokens,
      bs.std_dev_tokens,
      bs.min_tokens,
      bs.max_tokens,
      (cs.top_1_percent_tokens / cs.total_tokens * 100) as top_1_percent_share,
      (cs.top_5_percent_tokens / cs.total_tokens * 100) as top_5_percent_share,
      (cs.top_10_percent_tokens / cs.total_tokens * 100) as top_10_percent_share,
      0 as gini_coefficient, -- TODO: Calculate Gini coefficient
      tc.users_with_zero_allocation,
      tc.users_above_1000_tokens,
      tc.users_above_10000_tokens,
      tc.users_above_100000_tokens,
      nz.users_with_nonzero_allocation,
      nz.avg_tokens_nonzero,
      nz.median_tokens_nonzero,
      nz.std_dev_tokens_nonzero,
      nz.min_tokens_nonzero
    FROM basic_stats bs
    CROSS JOIN concentration_stats cs
    CROSS JOIN threshold_counts tc
    CROSS JOIN nonzero_stats nz;
    `,
    { type: QueryTypes.SELECT },
  );
  return results[0];
}

async function getAuraSummaryStats(): Promise<SummaryStats> {
  const results = await models.sequelize.query<SummaryStats>(
    `
    WITH allocation_data AS (
      SELECT 
        aa.token_allocation,
        ROW_NUMBER() OVER (ORDER BY aa.token_allocation DESC) as rank,
        COUNT(*) OVER () as total_count
      FROM "AuraAllocations" aa
      WHERE aa.token_allocation > 0
    ),
    basic_stats AS (
      SELECT 
        COUNT(*) as total_users,
        SUM(aa.token_allocation) as total_tokens,
        AVG(aa.token_allocation) as avg_tokens,
        STDDEV(aa.token_allocation) as std_dev_tokens,
        MIN(aa.token_allocation) as min_tokens,
        MAX(aa.token_allocation) as max_tokens,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY aa.token_allocation) as median_tokens
      FROM "AuraAllocations" aa
    ),
    nonzero_stats AS (
      SELECT 
        COUNT(*) as users_with_nonzero_allocation,
        AVG(aa.token_allocation) as avg_tokens_nonzero,
        STDDEV(aa.token_allocation) as std_dev_tokens_nonzero,
        MIN(aa.token_allocation) as min_tokens_nonzero,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY aa.token_allocation) as median_tokens_nonzero
      FROM "AuraAllocations" aa
      WHERE aa.token_allocation > 0
    ),
    concentration_stats AS (
      SELECT 
        (SELECT SUM(token_allocation) FROM allocation_data WHERE rank <= CEIL(total_count * 0.01)) as top_1_percent_tokens,
        (SELECT SUM(token_allocation) FROM allocation_data WHERE rank <= CEIL(total_count * 0.05)) as top_5_percent_tokens,
        (SELECT SUM(token_allocation) FROM allocation_data WHERE rank <= CEIL(total_count * 0.10)) as top_10_percent_tokens,
        (SELECT total_tokens FROM basic_stats) as total_tokens
      FROM allocation_data
      LIMIT 1
    ),
    threshold_counts AS (
      SELECT 
        COUNT(CASE WHEN aa.token_allocation = 0 THEN 1 END) as users_with_zero_allocation,
        COUNT(CASE WHEN aa.token_allocation > 1000 THEN 1 END) as users_above_1000_tokens,
        COUNT(CASE WHEN aa.token_allocation > 10000 THEN 1 END) as users_above_10000_tokens,
        COUNT(CASE WHEN aa.token_allocation > 100000 THEN 1 END) as users_above_100000_tokens
      FROM "AuraAllocations" aa
    )
    SELECT 
      bs.total_users,
      bs.total_tokens,
      bs.avg_tokens,
      bs.median_tokens,
      bs.std_dev_tokens,
      bs.min_tokens,
      bs.max_tokens,
      (cs.top_1_percent_tokens / cs.total_tokens * 100) as top_1_percent_share,
      (cs.top_5_percent_tokens / cs.total_tokens * 100) as top_5_percent_share,
      (cs.top_10_percent_tokens / cs.total_tokens * 100) as top_10_percent_share,
      0 as gini_coefficient, -- TODO: Calculate Gini coefficient
      tc.users_with_zero_allocation,
      tc.users_above_1000_tokens,
      tc.users_above_10000_tokens,
      tc.users_above_100000_tokens,
      nz.users_with_nonzero_allocation,
      nz.avg_tokens_nonzero,
      nz.median_tokens_nonzero,
      nz.std_dev_tokens_nonzero,
      nz.min_tokens_nonzero
    FROM basic_stats bs
    CROSS JOIN concentration_stats cs
    CROSS JOIN threshold_counts tc
    CROSS JOIN nonzero_stats nz;
    `,
    { type: QueryTypes.SELECT },
  );
  return results[0];
}

async function getPercentiles(
  table: 'HistoricalAllocations' | 'AuraAllocations',
): Promise<AllocationPercentiles> {
  const results = await models.sequelize.query<AllocationPercentiles>(
    `
    SELECT 
      PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY token_allocation) as p50,
      PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY token_allocation) as p75,
      PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY token_allocation) as p90,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY token_allocation) as p95,
      PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY token_allocation) as p99
    FROM "${table}"
    WHERE token_allocation > 0;
    `,
    { type: QueryTypes.SELECT },
  );
  return results[0];
}

interface PercentileBreakdown {
  users_top_1_percent: number;
  users_top_5_percent: number;
  users_top_10_percent: number;
  users_bottom_50_percent: number;
  users_middle_40_percent: number;
}

interface ParetoAnalysis {
  users_for_80_percent: number;
  percent_users_for_80_percent: number;
  users_for_90_percent: number;
  percent_users_for_90_percent: number;
}

async function getPercentileBreakdown(
  table: 'HistoricalAllocations' | 'AuraAllocations',
): Promise<PercentileBreakdown> {
  const results = await models.sequelize.query<PercentileBreakdown>(
    `
    WITH ranked_users AS (
      SELECT 
        token_allocation,
        ROW_NUMBER() OVER (ORDER BY token_allocation DESC) as rank,
        COUNT(*) OVER () as total_count
      FROM "${table}"
    )
    SELECT 
      COUNT(CASE WHEN rank <= CEIL(total_count * 0.01) THEN 1 END) as users_top_1_percent,
      COUNT(CASE WHEN rank <= CEIL(total_count * 0.05) THEN 1 END) as users_top_5_percent,
      COUNT(CASE WHEN rank <= CEIL(total_count * 0.10) THEN 1 END) as users_top_10_percent,
      COUNT(CASE WHEN rank > CEIL(total_count * 0.50) THEN 1 END) as users_bottom_50_percent,
      COUNT(CASE WHEN rank > CEIL(total_count * 0.10) AND rank <= CEIL(total_count * 0.50) THEN 1 END) as users_middle_40_percent
    FROM ranked_users;
    `,
    { type: QueryTypes.SELECT },
  );
  return results[0];
}

async function getParetoAnalysis(
  table: 'HistoricalAllocations' | 'AuraAllocations',
): Promise<ParetoAnalysis> {
  const results = await models.sequelize.query<ParetoAnalysis>(
    `
    WITH ranked_users AS (
      SELECT 
        token_allocation,
        ROW_NUMBER() OVER (ORDER BY token_allocation DESC) as rank,
        COUNT(*) OVER () as total_count,
        SUM(token_allocation) OVER () as total_tokens,
        SUM(token_allocation) OVER (ORDER BY token_allocation DESC ROWS UNBOUNDED PRECEDING) as cumulative_tokens
      FROM "${table}"
    ),
    pareto_thresholds AS (
      SELECT 
        total_tokens * 0.80 as tokens_80_percent,
        total_tokens * 0.90 as tokens_90_percent,
        total_count
      FROM ranked_users
      LIMIT 1
    )
    SELECT 
      (SELECT MIN(rank) FROM ranked_users r, pareto_thresholds p WHERE r.cumulative_tokens >= p.tokens_80_percent) as users_for_80_percent,
      (SELECT MIN(rank) FROM ranked_users r, pareto_thresholds p WHERE r.cumulative_tokens >= p.tokens_80_percent) * 100.0 / 
        (SELECT total_count FROM pareto_thresholds) as percent_users_for_80_percent,
      (SELECT MIN(rank) FROM ranked_users r, pareto_thresholds p WHERE r.cumulative_tokens >= p.tokens_90_percent) as users_for_90_percent,
      (SELECT MIN(rank) FROM ranked_users r, pareto_thresholds p WHERE r.cumulative_tokens >= p.tokens_90_percent) * 100.0 / 
        (SELECT total_count FROM pareto_thresholds) as percent_users_for_90_percent
    FROM pareto_thresholds;
    `,
    { type: QueryTypes.SELECT },
  );
  return results[0];
}

function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';

  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(2) + 'M';
  } else if (n >= 1_000) {
    return (n / 1_000).toFixed(2) + 'K';
  } else {
    return n.toFixed(2);
  }
}

function formatPercentage(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0%';
  return n.toFixed(2) + '%';
}

function printSummaryStats(
  title: string,
  stats: SummaryStats,
  percentiles: AllocationPercentiles,
  breakdown: PercentileBreakdown,
  pareto: ParetoAnalysis,
) {
  console.log(`\n📊 ${title}`);
  console.log('='.repeat(50));

  console.log('\n📈 Basic Statistics (All Users):');
  console.log(`  Total Users:           ${stats.total_users.toLocaleString()}`);
  console.log(`  Total Tokens:          ${formatNumber(stats.total_tokens)}`);
  console.log(`  Average Tokens:        ${formatNumber(stats.avg_tokens)}`);
  console.log(`  Median Tokens:         ${formatNumber(stats.median_tokens)}`);
  console.log(`  Standard Deviation:    ${formatNumber(stats.std_dev_tokens)}`);
  console.log(`  Min Tokens:            ${formatNumber(stats.min_tokens)}`);
  console.log(`  Max Tokens:            ${formatNumber(stats.max_tokens)}`);

  console.log('\n📈 Statistics (Non-Zero Users Only):');
  console.log(
    `  Users with Tokens:     ${stats.users_with_nonzero_allocation.toLocaleString()}`,
  );
  console.log(
    `  Average Tokens:        ${formatNumber(stats.avg_tokens_nonzero)}`,
  );
  console.log(
    `  Median Tokens:         ${formatNumber(stats.median_tokens_nonzero)}`,
  );
  console.log(
    `  Standard Deviation:    ${formatNumber(stats.std_dev_tokens_nonzero)}`,
  );
  console.log(
    `  Min Tokens:            ${formatNumber(stats.min_tokens_nonzero)}`,
  );

  console.log('\n📊 Percentiles:');
  console.log(`  50th percentile (P50): ${formatNumber(percentiles.p50)}`);
  console.log(`  75th percentile (P75): ${formatNumber(percentiles.p75)}`);
  console.log(`  90th percentile (P90): ${formatNumber(percentiles.p90)}`);
  console.log(`  95th percentile (P95): ${formatNumber(percentiles.p95)}`);
  console.log(`  99th percentile (P99): ${formatNumber(percentiles.p99)}`);

  console.log('\n🏆 Concentration Analysis:');
  console.log(
    `  Top 1% (${breakdown.users_top_1_percent.toLocaleString()} users):   ${formatPercentage(stats.top_1_percent_share)} of tokens`,
  );
  console.log(
    `  Top 5% (${breakdown.users_top_5_percent.toLocaleString()} users):   ${formatPercentage(stats.top_5_percent_share)} of tokens`,
  );
  console.log(
    `  Top 10% (${breakdown.users_top_10_percent.toLocaleString()} users):  ${formatPercentage(stats.top_10_percent_share)} of tokens`,
  );

  console.log('\n📊 User Distribution:');
  console.log(
    `  Top 1%:                ${breakdown.users_top_1_percent.toLocaleString()} users`,
  );
  console.log(
    `  Top 5%:                ${breakdown.users_top_5_percent.toLocaleString()} users`,
  );
  console.log(
    `  Top 10%:               ${breakdown.users_top_10_percent.toLocaleString()} users`,
  );
  console.log(
    `  Middle 40% (11-50%):   ${breakdown.users_middle_40_percent.toLocaleString()} users`,
  );
  console.log(
    `  Bottom 50%:            ${breakdown.users_bottom_50_percent.toLocaleString()} users`,
  );

  console.log('\n🎯 Threshold Analysis:');
  console.log(
    `  Users with 0 tokens:   ${stats.users_with_zero_allocation.toLocaleString()}`,
  );
  console.log(
    `  Users with >1K tokens: ${stats.users_above_1000_tokens.toLocaleString()}`,
  );
  console.log(
    `  Users with >10K tokens:${stats.users_above_10000_tokens.toLocaleString()}`,
  );
  console.log(
    `  Users with >100K tokens:${stats.users_above_100000_tokens.toLocaleString()}`,
  );

  console.log('\n⚖️ Pareto Analysis:');
  console.log(
    `  80% of tokens held by:  ${pareto.users_for_80_percent.toLocaleString()} users (${formatPercentage(pareto.percent_users_for_80_percent)})`,
  );
  console.log(
    `  90% of tokens held by:  ${pareto.users_for_90_percent.toLocaleString()} users (${formatPercentage(pareto.percent_users_for_90_percent)})`,
  );

  const paretoRatio = pareto.percent_users_for_80_percent;
  const paretoDescription =
    paretoRatio <= 20
      ? 'Strong Pareto effect'
      : paretoRatio <= 30
        ? 'Moderate Pareto effect'
        : paretoRatio <= 50
          ? 'Weak Pareto effect'
          : 'No Pareto effect';
  console.log(
    `  Pareto classification:  ${paretoDescription} (${formatPercentage(paretoRatio)}/80 rule)`,
  );
}

async function main() {
  try {
    console.log('🔍 Generating Token Allocation Summary Statistics...\n');

    // Get Historical Allocation Stats
    const historicalStats = await getHistoricalSummaryStats();
    const historicalPercentiles = await getPercentiles('HistoricalAllocations');
    const historicalBreakdown = await getPercentileBreakdown(
      'HistoricalAllocations',
    );
    const historicalPareto = await getParetoAnalysis('HistoricalAllocations');
    printSummaryStats(
      'Historical Allocation Summary',
      historicalStats,
      historicalPercentiles,
      historicalBreakdown,
      historicalPareto,
    );

    // Get Aura Allocation Stats
    const auraStats = await getAuraSummaryStats();
    const auraPercentiles = await getPercentiles('AuraAllocations');
    const auraBreakdown = await getPercentileBreakdown('AuraAllocations');
    const auraPareto = await getParetoAnalysis('AuraAllocations');
    printSummaryStats(
      'Aura Allocation Summary',
      auraStats,
      auraPercentiles,
      auraBreakdown,
      auraPareto,
    );

    // Combined Analysis
    console.log('\n🔄 Combined Analysis:');
    console.log('='.repeat(50));
    console.log(
      `  Total Combined Tokens: ${formatNumber(historicalStats.total_tokens + auraStats.total_tokens)}`,
    );
    console.log(
      `  Historical vs Aura:    ${formatNumber(historicalStats.total_tokens)} vs ${formatNumber(auraStats.total_tokens)}`,
    );
    console.log(
      `  Avg Historical:        ${formatNumber(historicalStats.avg_tokens)}`,
    );
    console.log(
      `  Avg Aura:              ${formatNumber(auraStats.avg_tokens)}`,
    );

    process.exit(0);
  } catch (error) {
    console.error('Error generating summary statistics:', error);
    process.exit(1);
  }
}

main()
  .then(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispose()('EXIT', true);
  })
  .catch((err) => {
    console.error(err);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispose()('ERROR', true);
  });
