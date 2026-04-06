/**
 * Retro Drop Allocation Visualization Script
 *
 * This script generates comprehensive graphs showing token distribution from
 * the ValidXpPerUser table for the retro drop allocation.
 *
 * Generated graphs:
 * 1. Total allocation by tier (bar & pie charts)
 * 2. Top 2000 allocations table
 * 3. Average allocation by percentile (bar chart)
 * 4. Overall statistics (mean, median, mode, etc.)
 * 5. Statistics by tier (mean, median, mode, etc.)
 *
 * Usage:
 *   npm run script generate-retro-drop-charts.ts
 *
 * Output:
 *   Creates HTML files with interactive charts in retro-allocation-distribution/
 */

import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { UserTierMap } from '@hicommonwealth/shared';
import * as fs from 'fs';
import * as path from 'path';
import { QueryTypes } from 'sequelize';

// Tier names mapping for better visualization
const TIER_NAMES: Record<number, string> = {
  [UserTierMap.IncompleteUser]: 'Incomplete User',
  [UserTierMap.BannedUser]: 'Banned User',
  [UserTierMap.NewlyVerifiedWallet]: 'Newly Verified Wallet',
  [UserTierMap.VerifiedWallet]: 'Verified Wallet',
  [UserTierMap.SocialVerified]: 'Social Verified',
  [UserTierMap.ChainVerified]: 'Chain Verified',
  [UserTierMap.FullyVerified]: 'Fully Verified',
  [UserTierMap.ManuallyVerified]: 'Manually Verified',
  [UserTierMap.SystemUser]: 'System User',
};

// Color palette for consistent visualization
const COLORS = [
  '#FF6384',
  '#36A2EB',
  '#FFCE56',
  '#4BC0C0',
  '#9966FF',
  '#FF9F40',
  '#FF6384',
  '#C9CBCF',
  '#4BC0C0',
];

interface TierAllocationData {
  tier: number;
  tierName: string;
  totalAllocation: number;
  averageAllocation: number;
  userCount: number;
}

interface TopAllocationData {
  user_id: number;
  tier: number;
  total_xp: number;
  percent_allocation: number;
  token_allocation: number;
}

interface PercentileData {
  percentile_bucket: string;
  avg_allocation: number;
  user_count: number;
  total_allocation: number;
}

interface OverallStats {
  count: number;
  total: number;
  mean: number;
  median: number;
  mode: number | null;
  min: number;
  max: number;
  variance: number;
  stdDev: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

interface TierStats {
  tier: number;
  tierName: string;
  userCount: number;
  mean: number;
  median: number;
  mode: number | null;
  min: number;
  max: number;
  stdDev: number;
  total: number;
}

/**
 * Fetch tier allocation data
 */
async function getTierAllocationData(): Promise<TierAllocationData[]> {
  console.log('Fetching tier allocation data...');

  const results = await models.sequelize.query<{
    tier: number;
    total_allocation: string;
    avg_allocation: string;
    user_count: number;
  }>(
    `
      SELECT 
        tier,
        SUM(token_allocation) as total_allocation,
        AVG(token_allocation) as avg_allocation,
        COUNT(*) as user_count
      FROM "ValidXpPerUser"
      WHERE token_allocation > 0
      GROUP BY tier
      ORDER BY tier DESC;
    `,
    { type: QueryTypes.SELECT },
  );

  return results.map((row) => ({
    tier: row.tier,
    tierName: TIER_NAMES[row.tier] || `Tier ${row.tier}`,
    totalAllocation: parseFloat(row.total_allocation),
    averageAllocation: parseFloat(row.avg_allocation),
    userCount: row.user_count,
  }));
}

/**
 * Fetch top allocations
 */
async function getTopAllocations(
  limit: number = 2000,
): Promise<TopAllocationData[]> {
  console.log(`Fetching top ${limit} allocations...`);

  const results = await models.sequelize.query<{
    user_id: number;
    tier: number;
    total_xp: string;
    percent_allocation: number;
    token_allocation: number;
  }>(
    `
      SELECT 
        user_id,
        tier,
        total_xp,
        percent_allocation,
        token_allocation
      FROM "ValidXpPerUser"
      WHERE token_allocation > 0
      ORDER BY token_allocation DESC
      LIMIT $1;
    `,
    {
      type: QueryTypes.SELECT,
      bind: [limit],
    },
  );

  return results.map((row) => ({
    user_id: row.user_id,
    tier: row.tier,
    total_xp: parseFloat(row.total_xp),
    percent_allocation: row.percent_allocation,
    token_allocation: row.token_allocation,
  }));
}

/**
 * Fetch percentile allocation data
 */
async function getPercentileData(): Promise<PercentileData[]> {
  console.log('Fetching percentile allocation data...');

  const results = await models.sequelize.query<{
    percentile_bucket: string;
    avg_allocation: string;
    user_count: number;
    total_allocation: string;
  }>(
    `
      WITH ranked_allocations AS (
        SELECT 
          token_allocation,
          ROW_NUMBER() OVER (ORDER BY token_allocation DESC) as rank,
          COUNT(*) OVER () as total_count
        FROM "ValidXpPerUser"
        WHERE token_allocation > 0
      ), percentile_allocations AS (
        SELECT 
          token_allocation,
          (rank::NUMERIC / total_count * 100) as percentile,
          CASE
            WHEN (rank::NUMERIC / total_count * 100) <= 0.01 THEN 'Top 0.01%'
            WHEN (rank::NUMERIC / total_count * 100) <= 0.1 THEN 'Top 0.1%'
            WHEN (rank::NUMERIC / total_count * 100) <= 1 THEN 'Top 1%'
            WHEN (rank::NUMERIC / total_count * 100) <= 10 THEN 'Top 10%'
            ELSE 'Top 100%'
          END as percentile_bucket
        FROM ranked_allocations
      )
      SELECT 
        percentile_bucket,
        AVG(token_allocation) as avg_allocation,
        COUNT(*) as user_count,
        SUM(token_allocation) as total_allocation
      FROM percentile_allocations
      GROUP BY percentile_bucket
      ORDER BY 
        CASE percentile_bucket
          WHEN 'Top 0.01%' THEN 1
          WHEN 'Top 0.1%' THEN 2
          WHEN 'Top 1%' THEN 3
          WHEN 'Top 10%' THEN 4
          WHEN 'Top 100%' THEN 5
        END;
    `,
    { type: QueryTypes.SELECT },
  );

  return results.map((row) => ({
    percentile_bucket: row.percentile_bucket,
    avg_allocation: parseFloat(row.avg_allocation),
    user_count: row.user_count,
    total_allocation: parseFloat(row.total_allocation),
  }));
}

/**
 * Calculate overall statistics
 */
function calculateOverallStats(values: number[]): OverallStats {
  if (values.length === 0) {
    return {
      count: 0,
      total: 0,
      mean: 0,
      median: 0,
      mode: null,
      min: 0,
      max: 0,
      variance: 0,
      stdDev: 0,
      p10: 0,
      p25: 0,
      p50: 0,
      p75: 0,
      p90: 0,
      p95: 0,
      p99: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.length;
  const total = sorted.reduce((s, v) => s + v, 0);
  const mean = total / count;
  const median =
    count % 2 === 0
      ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
      : sorted[Math.floor(count / 2)];
  const min = sorted[0];
  const max = sorted[count - 1];
  const variance =
    sorted.reduce((s, v) => s + (v - mean) * (v - mean), 0) / count;
  const stdDev = Math.sqrt(variance);

  const percentile = (p: number): number => {
    if (count === 1) return sorted[0];
    const idx = (p / 100) * (count - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    const weight = idx - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };

  // Mode on rounded (2 dp)
  const freq = new Map<number, number>();
  for (const v of values) {
    const r = Math.round(v * 100) / 100;
    freq.set(r, (freq.get(r) || 0) + 1);
  }
  let mode: number | null = null;
  let best = 0;
  for (const [val, c] of freq.entries()) {
    if (c > best || (c === best && mode !== null && val < mode)) {
      best = c;
      mode = val;
    }
  }

  return {
    count,
    total,
    mean,
    median,
    mode,
    min,
    max,
    variance,
    stdDev,
    p10: percentile(10),
    p25: percentile(25),
    p50: percentile(50),
    p75: percentile(75),
    p90: percentile(90),
    p95: percentile(95),
    p99: percentile(99),
  };
}

/**
 * Fetch statistics by tier
 */
async function getStatsByTier(): Promise<TierStats[]> {
  console.log('Fetching statistics by tier...');

  const results = await models.sequelize.query<{
    tier: number;
    user_count: number;
    mean: string;
    median: string;
    mode: string | null;
    min: string;
    max: string;
    std_dev: string;
    total: string;
  }>(
    `
      SELECT 
        tier,
        COUNT(*) as user_count,
        AVG(token_allocation) as mean,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY token_allocation) as median,
        MODE() WITHIN GROUP (ORDER BY token_allocation) as mode,
        MIN(token_allocation) as min,
        MAX(token_allocation) as max,
        STDDEV(token_allocation) as std_dev,
        SUM(token_allocation) as total
      FROM "ValidXpPerUser"
      WHERE token_allocation > 0
      GROUP BY tier
      ORDER BY tier DESC;
    `,
    { type: QueryTypes.SELECT },
  );

  return results.map((row) => ({
    tier: row.tier,
    tierName: TIER_NAMES[row.tier] || `Tier ${row.tier}`,
    userCount: row.user_count,
    mean: parseFloat(row.mean),
    median: parseFloat(row.median),
    mode: row.mode ? parseFloat(row.mode) : null,
    min: parseFloat(row.min),
    max: parseFloat(row.max),
    stdDev: parseFloat(row.std_dev),
    total: parseFloat(row.total),
  }));
}

/**
 * Generate HTML for tier allocation (bar and pie charts)
 */
function generateTierAllocationHTML(data: TierAllocationData[]): string {
  const labels = data.map((d) => d.tierName);
  const values = data.map((d) => d.totalAllocation);
  const colors = COLORS.slice(0, data.length);

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Retro Drop - Total Allocation by Tier</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .chart-container { width: 45%; display: inline-block; margin: 2.5%; }
        .stats { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
        h1 { text-align: center; color: #333; }
        h2 { color: #666; margin-top: 30px; }
    </style>
</head>
<body>
    <h1>Retro Drop - Total Token Allocation by Tier</h1>
    
    <div class="stats">
        <h2>Summary Statistics</h2>
        <p><strong>Total Users:</strong> ${data.reduce((sum, d) => Number(sum) + Number(d.userCount), 0).toLocaleString()}</p>
        <p><strong>Total Allocation:</strong> ${data.reduce((sum, d) => sum + d.totalAllocation, 0).toLocaleString()} tokens</p>
        <p><strong>Average per User:</strong> ${(
          data.reduce((sum, d) => Number(sum) + Number(d.totalAllocation), 0) /
          data.reduce((sum, d) => Number(sum) + Number(d.userCount), 0)
        ).toFixed(2)} tokens</p>
    </div>

    <div class="chart-container">
        <h2>Bar Chart</h2>
        <canvas id="barChart"></canvas>
    </div>
    
    <div class="chart-container">
        <h2>Pie Chart</h2>
        <canvas id="pieChart"></canvas>
    </div>

    <script>
        // Bar Chart
        const barCtx = document.getElementById('barChart').getContext('2d');
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(labels)},
                datasets: [{
                    label: 'Total Allocation',
                    data: ${JSON.stringify(values)},
                    backgroundColor: ${JSON.stringify(colors)},
                    borderColor: ${JSON.stringify(colors.map((c) => c + '80'))},
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y.toLocaleString() + ' tokens';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45
                        }
                    }
                }
            }
        });

        // Pie Chart
        const pieCtx = document.getElementById('pieChart').getContext('2d');
        new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: ${JSON.stringify(labels)},
                datasets: [{
                    data: ${JSON.stringify(values)},
                    backgroundColor: ${JSON.stringify(colors)},
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return context.label + ': ' + context.parsed.toLocaleString() + ' tokens (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;
}

/**
 * Generate HTML for top allocations table
 */
function generateTopAllocationsHTML(data: TopAllocationData[]): string {
  const tableRows = data
    .map((row, index) => {
      const rank = index + 1;
      const tierName = TIER_NAMES[row.tier] || `Tier ${row.tier}`;
      const rankClass =
        rank <= 10
          ? 'rank-top10'
          : rank <= 50
            ? 'rank-top50'
            : rank <= 100
              ? 'rank-top100'
              : '';

      return `
        <tr class="${rankClass}">
          <td class="rank-cell">${rank}</td>
          <td class="center-cell">${row.user_id}</td>
          <td class="center-cell">${row.tier}</td>
          <td>${tierName}</td>
          <td class="number-cell">${Math.round(row.total_xp).toLocaleString()}</td>
          <td class="number-cell">${row.percent_allocation.toFixed(4)}%</td>
          <td class="number-cell allocation-cell">${Math.round(row.token_allocation).toLocaleString()}</td>
        </tr>
      `;
    })
    .join('');

  const totalAllocation = data.reduce(
    (sum, row) => sum + row.token_allocation,
    0,
  );
  const totalXP = data.reduce((sum, row) => sum + row.total_xp, 0);

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Retro Drop - Top ${data.length.toLocaleString()} Allocations</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
        .container { max-width: 1800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { text-align: center; color: #333; margin-bottom: 30px; }
        .explanation { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .explanation h3 { margin-top: 0; color: #2c5aa0; }
        .stats-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
        .stats { padding: 15px; background: #f5f5f5; border-radius: 5px; text-align: center; }
        .stats-value { font-size: 1.5em; font-weight: bold; color: #007bff; }
        .table-container { overflow-x: auto; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
        th { background-color: #007bff; color: white; font-weight: bold; position: sticky; top: 0; z-index: 10; }
        tbody tr:nth-child(even) { background-color: #f8f9fa; }
        tbody tr:hover { background-color: #e9ecef; }
        .number-cell { text-align: right; font-weight: 600; }
        .center-cell { text-align: center; }
        .rank-cell { text-align: center; font-weight: 500; }
        .allocation-cell { font-weight: bold; }
        .rank-top10 { background-color: #d4edda !important; }
        .rank-top50 { background-color: #fff3cd !important; }
        .rank-top100 { background-color: #ffe5cc !important; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Retro Drop - Top ${data.length.toLocaleString()} Allocations</h1>
        
        <div class="explanation">
            <h3>Understanding the Data</h3>
            <p>This table shows the top ${data.length.toLocaleString()} recipients by <strong>token allocation</strong> from the retro drop.</p>
            <ul>
                <li><strong>Rank:</strong> Position ordered by token allocation (1 = highest)</li>
                <li><strong>User ID:</strong> The user's ID in the system</li>
                <li><strong>Tier:</strong> The user's verification tier number and name</li>
                <li><strong>Total XP:</strong> The user's total experience points</li>
                <li><strong>Percent Allocation:</strong> The percentage of total tokens allocated to this user</li>
                <li><strong>Token Allocation:</strong> Total tokens allocated to this user</li>
            </ul>
            <p><em>Highlighting: Top 10 (light green), Top 50 (light yellow), Top 100 (light orange)</em></p>
        </div>

        <div class="stats-container">
            <div class="stats">
                <div class="stats-value">${data.length.toLocaleString()}</div>
                <div>Total Recipients</div>
            </div>
            <div class="stats">
                <div class="stats-value">${Math.round(totalAllocation).toLocaleString()}</div>
                <div>Total Tokens Allocated</div>
            </div>
            <div class="stats">
                <div class="stats-value">${Math.round(totalXP).toLocaleString()}</div>
                <div>Total XP</div>
            </div>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>User ID</th>
                        <th>Tier</th>
                        <th>Tier Name</th>
                        <th>Total XP</th>
                        <th>Percent Allocation</th>
                        <th>Token Allocation</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate HTML for percentile allocation chart
 */
function generatePercentileHTML(data: PercentileData[]): string {
  const labels = data.map((d) => d.percentile_bucket);
  const avgValues = data.map((d) => d.avg_allocation);

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Retro Drop - Average Allocation by Percentile</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
        .container { max-width: 1400px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { text-align: center; color: #333; margin-bottom: 30px; }
        .explanation { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .explanation h3 { margin-top: 0; color: #2c5aa0; }
        .chart-container { width: 100%; margin: 30px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
        th { background-color: #007bff; color: white; font-weight: bold; }
        tbody tr:nth-child(even) { background-color: #f8f9fa; }
        tbody tr:hover { background-color: #e9ecef; }
        .number-cell { text-align: right; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Retro Drop - Average Allocation by Percentile</h1>
        
        <div class="explanation">
            <h3>Understanding Percentiles</h3>
            <p>This chart shows the average token allocation for users in different percentile groups, ordered from highest to lowest allocations.</p>
            <ul>
                <li><strong>Top 0.01%:</strong> The top 0.01% of users by allocation</li>
                <li><strong>Top 0.1%:</strong> Users in the top 0.1% (excluding top 0.01%)</li>
                <li><strong>Top 1%:</strong> Users in the top 1% (excluding top 0.1%)</li>
                <li><strong>Top 10%:</strong> Users in the top 10% (excluding top 1%)</li>
                <li><strong>Top 100%:</strong> All remaining users</li>
            </ul>
        </div>

        <div class="chart-container">
            <h2>Average Allocation by Percentile</h2>
            <canvas id="percentileChart"></canvas>
        </div>

        <h2>Detailed Breakdown</h2>
        <table>
            <thead>
                <tr>
                    <th>Percentile</th>
                    <th class="number-cell">Average Allocation</th>
                    <th class="number-cell">User Count</th>
                    <th class="number-cell">Total Allocation</th>
                </tr>
            </thead>
            <tbody>
                ${data
                  .map(
                    (row) => `
                    <tr>
                        <td>${row.percentile_bucket}</td>
                        <td class="number-cell">${Math.round(row.avg_allocation).toLocaleString()}</td>
                        <td class="number-cell">${row.user_count.toLocaleString()}</td>
                        <td class="number-cell">${Math.round(row.total_allocation).toLocaleString()}</td>
                    </tr>
                `,
                  )
                  .join('')}
            </tbody>
        </table>
    </div>

    <script>
        const ctx = document.getElementById('percentileChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(labels)},
                datasets: [{
                    label: 'Average Allocation',
                    data: ${JSON.stringify(avgValues)},
                    backgroundColor: '#007bff',
                    borderColor: '#0056b3',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y.toLocaleString() + ' tokens';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        },
                        title: {
                            display: true,
                            text: 'Average Tokens'
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;
}

/**
 * Generate HTML for overall statistics
 */
function generateOverallStatsHTML(stats: OverallStats): string {
  const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString() : '0');
  const fmt2 = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : '0.00');

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Retro Drop - Overall Statistics</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { text-align: center; color: #333; margin-bottom: 30px; }
        .explanation { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .explanation h3 { margin-top: 0; color: #2c5aa0; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0; }
        .stats-item { text-align: center; padding: 20px; background: #f5f5f5; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .stats-label { font-size: 0.9em; color: #666; margin-bottom: 8px; }
        .stats-value { font-size: 1.8em; font-weight: bold; color: #007bff; }
        .stats-unit { font-size: 0.8em; color: #666; margin-top: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Retro Drop - Overall Statistics</h1>
        
        <div class="explanation">
            <h3>Statistical Summary</h3>
            <p>These statistics provide a comprehensive view of the token allocation distribution across all users.</p>
            <ul>
                <li><strong>Count:</strong> Total number of users receiving tokens</li>
                <li><strong>Total:</strong> Sum of all token allocations</li>
                <li><strong>Mean:</strong> Average allocation per user</li>
                <li><strong>Median:</strong> Middle value (50th percentile)</li>
                <li><strong>Mode:</strong> Most frequently occurring allocation amount</li>
                <li><strong>Min/Max:</strong> Smallest and largest allocations</li>
                <li><strong>Std Dev:</strong> Standard deviation showing spread of allocations</li>
                <li><strong>Percentiles (P10-P99):</strong> Values at various distribution points</li>
            </ul>
        </div>

        <h2>Summary Statistics</h2>
        <div class="stats-grid">
            <div class="stats-item">
                <div class="stats-label">Total Users</div>
                <div class="stats-value">${fmt(stats.count)}</div>
            </div>
            <div class="stats-item">
                <div class="stats-label">Total Tokens</div>
                <div class="stats-value">${fmt(stats.total)}</div>
                <div class="stats-unit">tokens</div>
            </div>
            <div class="stats-item">
                <div class="stats-label">Mean</div>
                <div class="stats-value">${fmt2(stats.mean)}</div>
                <div class="stats-unit">tokens</div>
            </div>
            <div class="stats-item">
                <div class="stats-label">Median</div>
                <div class="stats-value">${fmt2(stats.median)}</div>
                <div class="stats-unit">tokens</div>
            </div>
            <div class="stats-item">
                <div class="stats-label">Mode</div>
                <div class="stats-value">${stats.mode !== null ? fmt2(stats.mode) : '—'}</div>
                <div class="stats-unit">tokens</div>
            </div>
            <div class="stats-item">
                <div class="stats-label">Min</div>
                <div class="stats-value">${fmt2(stats.min)}</div>
                <div class="stats-unit">tokens</div>
            </div>
            <div class="stats-item">
                <div class="stats-label">Max</div>
                <div class="stats-value">${fmt2(stats.max)}</div>
                <div class="stats-unit">tokens</div>
            </div>
            <div class="stats-item">
                <div class="stats-label">Std Dev</div>
                <div class="stats-value">${fmt2(stats.stdDev)}</div>
                <div class="stats-unit">tokens</div>
            </div>
        </div>

        <h2>Percentile Distribution</h2>
        <div class="stats-grid">
            <div class="stats-item">
                <div class="stats-label">P10</div>
                <div class="stats-value">${fmt2(stats.p10)}</div>
                <div class="stats-unit">tokens</div>
            </div>
            <div class="stats-item">
                <div class="stats-label">P25</div>
                <div class="stats-value">${fmt2(stats.p25)}</div>
                <div class="stats-unit">tokens</div>
            </div>
            <div class="stats-item">
                <div class="stats-label">P50 (Median)</div>
                <div class="stats-value">${fmt2(stats.p50)}</div>
                <div class="stats-unit">tokens</div>
            </div>
            <div class="stats-item">
                <div class="stats-label">P75</div>
                <div class="stats-value">${fmt2(stats.p75)}</div>
                <div class="stats-unit">tokens</div>
            </div>
            <div class="stats-item">
                <div class="stats-label">P90</div>
                <div class="stats-value">${fmt2(stats.p90)}</div>
                <div class="stats-unit">tokens</div>
            </div>
            <div class="stats-item">
                <div class="stats-label">P95</div>
                <div class="stats-value">${fmt2(stats.p95)}</div>
                <div class="stats-unit">tokens</div>
            </div>
            <div class="stats-item">
                <div class="stats-label">P99</div>
                <div class="stats-value">${fmt2(stats.p99)}</div>
                <div class="stats-unit">tokens</div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate HTML for statistics by tier
 */
function generateStatsByTierHTML(data: TierStats[]): string {
  const totalAllocation = data.reduce((sum, row) => sum + row.total, 0);
  const totalUsers = data.reduce(
    (sum, row) => Number(sum) + Number(row.userCount),
    0,
  );

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Retro Drop - Statistics by Tier</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
        .container { max-width: 1600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { text-align: center; color: #333; margin-bottom: 30px; }
        .explanation { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .explanation h3 { margin-top: 0; color: #2c5aa0; }
        .stats-container { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
        .stats { padding: 15px; background: #f5f5f5; border-radius: 5px; text-align: center; }
        .stats-value { font-size: 1.5em; font-weight: bold; color: #007bff; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
        th { background-color: #007bff; color: white; font-weight: bold; position: sticky; top: 0; }
        tbody tr:nth-child(even) { background-color: #f8f9fa; }
        tbody tr:hover { background-color: #e9ecef; }
        .number-cell { text-align: right; }
        .tier-cell { font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Retro Drop - Statistics by Tier</h1>
        
        <div class="explanation">
            <h3>Understanding the Statistics</h3>
            <p>This table shows statistical measures for token allocations grouped by user tier.</p>
            <ul>
                <li><strong>User Count:</strong> Number of recipients in this tier</li>
                <li><strong>Mean:</strong> Average allocation per recipient in this tier</li>
                <li><strong>Median:</strong> Middle value when allocations are sorted (50th percentile)</li>
                <li><strong>Mode:</strong> Most frequently occurring allocation value</li>
                <li><strong>Min/Max:</strong> Smallest and largest allocations in this tier</li>
                <li><strong>Std Dev:</strong> Standard deviation showing spread of allocations</li>
                <li><strong>Total:</strong> Sum of all allocations in this tier</li>
            </ul>
        </div>

        <div class="stats-container">
            <div class="stats">
                <div class="stats-value">${totalUsers.toLocaleString()}</div>
                <div>Total Recipients</div>
            </div>
            <div class="stats">
                <div class="stats-value">${Math.round(totalAllocation).toLocaleString()}</div>
                <div>Total Tokens</div>
            </div>
        </div>

        <h2>Statistics by User Tier</h2>
        <table>
            <thead>
                <tr>
                    <th>Tier</th>
                    <th>Tier Name</th>
                    <th class="number-cell">User Count</th>
                    <th class="number-cell">Mean</th>
                    <th class="number-cell">Median</th>
                    <th class="number-cell">Mode</th>
                    <th class="number-cell">Min</th>
                    <th class="number-cell">Max</th>
                    <th class="number-cell">Std Dev</th>
                    <th class="number-cell">Total</th>
                </tr>
            </thead>
            <tbody>
                ${data
                  .map(
                    (row) => `
                    <tr>
                        <td class="tier-cell">${row.tier}</td>
                        <td>${row.tierName}</td>
                        <td class="number-cell">${row.userCount.toLocaleString()}</td>
                        <td class="number-cell">${Math.round(row.mean).toLocaleString()}</td>
                        <td class="number-cell">${Math.round(row.median).toLocaleString()}</td>
                        <td class="number-cell">${row.mode !== null ? Math.round(row.mode).toLocaleString() : 'N/A'}</td>
                        <td class="number-cell">${Math.round(row.min).toLocaleString()}</td>
                        <td class="number-cell">${Math.round(row.max).toLocaleString()}</td>
                        <td class="number-cell">${Math.round(row.stdDev).toLocaleString()}</td>
                        <td class="number-cell">${Math.round(row.total).toLocaleString()}</td>
                    </tr>
                `,
                  )
                  .join('')}
            </tbody>
        </table>

        <div class="explanation">
            <h3>Interpretation Guide</h3>
            <p><strong>Mean vs Median:</strong> If mean is significantly higher than median, the distribution is skewed by high outliers (users with large allocations).</p>
            <p><strong>Standard Deviation:</strong> Higher values indicate greater variation in allocations within the tier.</p>
            <p><strong>Mode:</strong> May show "N/A" if no single value repeats (common with continuous allocation values).</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate index HTML
 */
function generateIndexHTML(): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Retro Drop - Allocation Distribution Charts</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f8f9fa; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; margin-bottom: 30px; }
        .chart-links { display: grid; grid-template-columns: 1fr; gap: 15px; margin-top: 30px; }
        .chart-link { display: block; padding: 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; text-align: center; transition: background 0.3s; }
        .chart-link:hover { background: #0056b3; }
        .description { color: #666; line-height: 1.6; margin-bottom: 20px; }
        .timestamp { text-align: center; color: #999; margin-top: 30px; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Retro Drop - Allocation Distribution Charts</h1>
        
        <div class="description">
            <p>This dashboard provides comprehensive visualizations of token allocation distributions from the retro drop based on the ValidXpPerUser table.</p>
        </div>

        <div class="chart-links">
            <a href="allocation-by-tier.html" class="chart-link">
                Total Allocation by Tier<br>
                <small>Bar & pie charts showing total tokens by user tier</small>
            </a>
            
            <a href="top-allocations.html" class="chart-link">
                Top 2000 Allocations<br>
                <small>Table of highest token recipients with details</small>
            </a>
            
            <a href="allocation-by-percentile.html" class="chart-link">
                Average Allocation by Percentile<br>
                <small>Bar chart showing average allocation across percentiles</small>
            </a>
            
            <a href="overall-statistics.html" class="chart-link">
                Overall Statistics<br>
                <small>Comprehensive statistics across all allocations</small>
            </a>
            
            <a href="statistics-by-tier.html" class="chart-link">
                Statistics by Tier<br>
                <small>Detailed statistics broken down by user tier</small>
            </a>
        </div>

        <div class="timestamp">
            Generated on: ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>`;
}

/**
 * Main execution function
 */
async function main() {
  console.log('Starting retro drop allocation visualization...\n');

  try {
    // Fetch all data
    console.log('Fetching data...');
    const [tierData, topAllocations, percentileData, statsByTier] =
      await Promise.all([
        getTierAllocationData(),
        getTopAllocations(2000),
        getPercentileData(),
        getStatsByTier(),
      ]);

    // Calculate overall stats
    console.log('Calculating overall statistics...');
    const allAllocations = await models.sequelize.query<{
      token_allocation: number;
    }>(
      `SELECT token_allocation FROM "ValidXpPerUser" WHERE token_allocation > 0`,
      { type: QueryTypes.SELECT },
    );
    const overallStats = calculateOverallStats(
      allAllocations.map((r) => r.token_allocation),
    );

    console.log('\nData Summary:');
    console.log(`- Tiers: ${tierData.length}`);
    console.log(`- Top allocations: ${topAllocations.length}`);
    console.log(`- Percentile buckets: ${percentileData.length}`);
    console.log(`- Tier stats: ${statsByTier.length}`);
    console.log(`- Total users: ${overallStats.count}`);

    // Create output directory
    const outputDir = path.join(process.cwd(), 'retro-allocation-distribution');

    // Remove existing directory if it exists
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
      console.log('\nCleared existing retro-allocation-distribution directory');
    }

    // Create fresh directory
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('Created retro-allocation-distribution directory');

    console.log('\nGenerating charts...');

    // Generate all HTML files
    const tierAllocationHTML = generateTierAllocationHTML(tierData);
    fs.writeFileSync(
      path.join(outputDir, 'allocation-by-tier.html'),
      tierAllocationHTML,
    );
    console.log('Generated: allocation-by-tier.html');

    const topAllocationsHTML = generateTopAllocationsHTML(topAllocations);
    fs.writeFileSync(
      path.join(outputDir, 'top-allocations.html'),
      topAllocationsHTML,
    );
    console.log('Generated: top-allocations.html');

    const percentileHTML = generatePercentileHTML(percentileData);
    fs.writeFileSync(
      path.join(outputDir, 'allocation-by-percentile.html'),
      percentileHTML,
    );
    console.log('Generated: allocation-by-percentile.html');

    const overallStatsHTML = generateOverallStatsHTML(overallStats);
    fs.writeFileSync(
      path.join(outputDir, 'overall-statistics.html'),
      overallStatsHTML,
    );
    console.log('Generated: overall-statistics.html');

    const statsByTierHTML = generateStatsByTierHTML(statsByTier);
    fs.writeFileSync(
      path.join(outputDir, 'statistics-by-tier.html'),
      statsByTierHTML,
    );
    console.log('Generated: statistics-by-tier.html');

    const indexHTML = generateIndexHTML();
    fs.writeFileSync(path.join(outputDir, 'index.html'), indexHTML);
    console.log('Generated: index.html');

    console.log(`\nAll charts generated successfully!`);
    console.log(`Output directory: ${outputDir}`);
    console.log(
      `Open ${path.join(outputDir, 'index.html')} in your browser to view the charts`,
    );
    console.log(`\nGenerated files:`);
    console.log(`   - index.html (main dashboard)`);
    console.log(`   - allocation-by-tier.html`);
    console.log(`   - top-allocations.html`);
    console.log(`   - allocation-by-percentile.html`);
    console.log(`   - overall-statistics.html`);
    console.log(`   - statistics-by-tier.html`);
  } catch (error) {
    console.error('Error generating charts:', error);
    throw error;
  }
}

// Execute the script
main()
  .then(() => {
    console.log('\nScript completed successfully');
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispose()('EXIT', true);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispose()('ERROR', true);
  });
