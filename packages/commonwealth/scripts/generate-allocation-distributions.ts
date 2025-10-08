/**
 * Token Allocation Distribution Visualization Script
 *
 * This script generates comprehensive graphs showing token distribution across
 * NftSnapshot, HistoricalAllocations, and AuraAllocations tables.
 *
 * Generated graphs:
 * 1. Total allocation by tier (column & pie charts) - NftSnapshot
 * 2. Average allocation by tier (column & pie charts) - NftSnapshot
 * 3. Average allocation by tier for equal & rarity distributions - NftSnapshot
 * 4. User allocation distribution (line/scatter plots) - All three tables
 *
 * Usage:
 *   npm run script generate-allocation-distributions.ts
 *
 * Output:
 *   Creates HTML files with interactive charts in the current directory
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
  '#FF6384',
];

interface TierDistributionData {
  tier: number;
  tierName: string;
  totalAllocation: number;
  averageAllocation: number;
  nftCount: number;
  userCount: number;
}

interface UserAllocationData {
  userId: number;
  allocation: number;
  rank: number;
}

interface LorenzData {
  populationPercent: number;
  wealthPercent: number;
}

interface GiniData {
  nft: {
    gini: number;
    lorenz: LorenzData[];
  };
  historical: {
    gini: number;
    lorenz: LorenzData[];
  };
  aura: {
    gini: number;
    lorenz: LorenzData[];
  };
  combined: {
    gini: number;
    lorenz: LorenzData[];
  };
}

interface NftCorrelationData {
  userId: number;
  userTier: number | null;
  rarity: number | null;
  nftAllocation: number;
  totalAllocation: number;
}

interface AuraCorrelationData {
  userId: number;
  userTier: number | null;
  auraXP: number;
  auraAllocation: number;
  totalAllocation: number;
}

interface HistoricalCorrelationData {
  userId: number;
  userTier: number | null;
  threadCount: number;
  commentCount: number;
  historicalAllocation: number;
  totalAllocation: number;
}

interface EqualRarityDistributionData {
  tier: number;
  tierName: string;
  avgEqualDistribution: number;
  avgRarityDistribution: number;
  nftCount: number;
}

/**
 * Fetch NFT snapshot tier distribution data
 */
async function getNftTierDistribution(): Promise<TierDistributionData[]> {
  console.log('Fetching NFT tier distribution data...');

  const results = await models.sequelize.query<{
    user_tier: number;
    total_allocation: string;
    avg_allocation: string;
    nft_count: number;
    user_count: number;
  }>(
    `
      SELECT 
        COALESCE(user_tier, 0) as user_tier,
        COALESCE(SUM(total_token_allocation), 0) as total_allocation,
        COALESCE(AVG(total_token_allocation), 0) as avg_allocation,
        COUNT(*) as nft_count,
        COUNT(DISTINCT user_id) as user_count
      FROM "NftSnapshot"
      WHERE total_token_allocation IS NOT NULL
      GROUP BY user_tier
      ORDER BY user_tier;
    `,
    { type: QueryTypes.SELECT },
  );

  return results.map((row) => ({
    tier: row.user_tier,
    tierName: TIER_NAMES[row.user_tier] || `Tier ${row.user_tier}`,
    totalAllocation: parseFloat(row.total_allocation),
    averageAllocation: parseFloat(row.avg_allocation),
    nftCount: row.nft_count,
    userCount: row.user_count,
  }));
}

/**
 * Fetch equal and rarity distribution data by tier
 */
async function getEqualRarityDistribution(): Promise<
  EqualRarityDistributionData[]
> {
  console.log('Fetching equal and rarity distribution data...');

  const results = await models.sequelize.query<{
    user_tier: number;
    avg_equal_distribution: string;
    avg_rarity_distribution: string;
    nft_count: number;
  }>(
    `
      SELECT 
        COALESCE(user_tier, 0) as user_tier,
        COALESCE(AVG(equal_distribution_allocation), 0) as avg_equal_distribution,
        COALESCE(AVG(rarity_distribution_allocation), 0) as avg_rarity_distribution,
        COUNT(*) as nft_count
      FROM "NftSnapshot"
      WHERE equal_distribution_allocation IS NOT NULL 
        AND rarity_distribution_allocation IS NOT NULL
      GROUP BY user_tier
      ORDER BY user_tier;
    `,
    { type: QueryTypes.SELECT },
  );

  return results.map((row) => ({
    tier: row.user_tier,
    tierName: TIER_NAMES[row.user_tier] || `Tier ${row.user_tier}`,
    avgEqualDistribution: parseFloat(row.avg_equal_distribution),
    avgRarityDistribution: parseFloat(row.avg_rarity_distribution),
    nftCount: row.nft_count,
  }));
}

/**
 * Fetch user allocation data for NFT snapshots (summed per holder address)
 */
async function getNftUserAllocations(): Promise<UserAllocationData[]> {
  console.log('Fetching NFT holder allocation data (per holder address)...');

  const results = await models.sequelize.query<{
    holder_address: string;
    user_id: number | null;
    total_allocation: string;
  }>(
    `
      SELECT 
        holder_address,
        user_id,
        SUM(total_token_allocation) as total_allocation
      FROM "NftSnapshot"
      WHERE total_token_allocation IS NOT NULL
      GROUP BY holder_address, user_id
      ORDER BY total_allocation ASC;
    `,
    { type: QueryTypes.SELECT },
  );

  return results.map((row, index) => ({
    userId: row.user_id || 0, // Use 0 for holders without user_id
    allocation: parseFloat(row.total_allocation),
    rank: index + 1,
  }));
}

/**
 * Fetch NFT allocation data per individual NFT (ordered by rarity tier)
 */
async function getNftIndividualAllocations(): Promise<
  Array<{
    tokenId: number;
    allocation: number;
    rarityTier: number;
    rank: number;
  }>
> {
  console.log('Fetching NFT allocation data (per NFT)...');

  const results = await models.sequelize.query<{
    token_id: number;
    total_token_allocation: string;
    rarity_tier: number;
  }>(
    `
      SELECT 
        token_id,
        total_token_allocation,
        COALESCE(rarity_tier, 0) as rarity_tier
      FROM "NftSnapshot"
      WHERE total_token_allocation IS NOT NULL
      ORDER BY 
        COALESCE(rarity_tier, 0) DESC,
        total_token_allocation DESC,
        token_id ASC;
    `,
    { type: QueryTypes.SELECT },
  );

  return results.map((row, index) => ({
    tokenId: row.token_id,
    allocation: parseFloat(row.total_token_allocation),
    rarityTier: row.rarity_tier,
    rank: index + 1,
  }));
}

/**
 * Fetch user allocation data for Historical Allocations
 */
async function getHistoricalUserAllocations(): Promise<UserAllocationData[]> {
  console.log('Fetching Historical allocation data...');

  const results = await models.sequelize.query<{
    user_id: number;
    token_allocation: string;
  }>(
    `
      SELECT 
        user_id,
        token_allocation
      FROM "HistoricalAllocations"
      WHERE token_allocation IS NOT NULL
        AND token_allocation > 0
      ORDER BY token_allocation DESC;
    `,
    { type: QueryTypes.SELECT },
  );

  return results.map((row, index) => ({
    userId: row.user_id,
    allocation: parseFloat(row.token_allocation),
    rank: index + 1,
  }));
}

/**
 * Calculate Lorenz curve data points from allocation data using percentile buckets
 * This creates exactly 100 data points regardless of dataset size for efficient rendering
 */
function calculateLorenzCurve(allocations: number[]): LorenzData[] {
  if (allocations.length === 0)
    return [{ populationPercent: 0, wealthPercent: 0 }];

  // Sort allocations in ascending order
  const sortedAllocations = [...allocations].sort((a, b) => a - b);
  const totalWealth = sortedAllocations.reduce(
    (sum, allocation) => sum + allocation,
    0,
  );
  const n = sortedAllocations.length;

  if (totalWealth === 0)
    return [
      { populationPercent: 0, wealthPercent: 0 },
      { populationPercent: 100, wealthPercent: 100 },
    ];

  const lorenzPoints: LorenzData[] = [
    { populationPercent: 0, wealthPercent: 0 },
  ];

  // Use percentile buckets (100 points max)
  const numBuckets = Math.min(100, n);

  for (let i = 1; i <= numBuckets; i++) {
    const percentile = i / numBuckets;
    const index = Math.floor(percentile * n) - 1;
    const actualIndex = Math.max(0, Math.min(index, n - 1));

    // Calculate cumulative wealth up to this percentile
    let cumulativeWealth = 0;
    for (let j = 0; j <= actualIndex; j++) {
      cumulativeWealth += sortedAllocations[j];
    }

    const populationPercent = percentile * 100;
    const wealthPercent = (cumulativeWealth / totalWealth) * 100;

    lorenzPoints.push({
      populationPercent: Math.round(populationPercent * 100) / 100,
      wealthPercent: Math.round(wealthPercent * 100) / 100,
    });
  }

  return lorenzPoints;
}

/**
 * Calculate Gini coefficient from allocation data
 */
function calculateGiniCoefficient(allocations: number[]): number {
  if (allocations.length === 0) return 0;

  // Sort allocations in ascending order
  const sortedAllocations = [...allocations].sort((a, b) => a - b);
  const n = sortedAllocations.length;
  const mean =
    sortedAllocations.reduce((sum, allocation) => sum + allocation, 0) / n;

  if (mean === 0) return 0;

  // Calculate Gini coefficient using the formula:
  // G = (2 * Σ(i * y_i)) / (n * Σ(y_i)) - (n + 1) / n
  let numerator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i + 1) * sortedAllocations[i];
  }

  const gini = (2 * numerator) / (n * n * mean) - (n + 1) / n;
  return Math.max(0, Math.min(1, gini)); // Clamp between 0 and 1
}

/**
 * Calculate comprehensive Gini and Lorenz data for all allocation types
 */
function calculateGiniAndLorenzData(
  nftData: UserAllocationData[],
  historicalData: UserAllocationData[],
  auraData: UserAllocationData[],
): GiniData {
  const nftAllocations = nftData.map((d) => d.allocation);
  const historicalAllocations = historicalData.map((d) => d.allocation);
  const auraAllocations = auraData.map((d) => d.allocation);

  // Create combined dataset by user_id (sum allocations for users present in multiple datasets)
  const combinedMap = new Map<number, number>();

  // Add NFT allocations
  nftData.forEach((d) => {
    combinedMap.set(d.userId, (combinedMap.get(d.userId) || 0) + d.allocation);
  });

  // Add Historical allocations
  historicalData.forEach((d) => {
    combinedMap.set(d.userId, (combinedMap.get(d.userId) || 0) + d.allocation);
  });

  // Add Aura allocations
  auraData.forEach((d) => {
    combinedMap.set(d.userId, (combinedMap.get(d.userId) || 0) + d.allocation);
  });

  const combinedAllocations = Array.from(combinedMap.values());

  return {
    nft: {
      gini: calculateGiniCoefficient(nftAllocations),
      lorenz: calculateLorenzCurve(nftAllocations),
    },
    historical: {
      gini: calculateGiniCoefficient(historicalAllocations),
      lorenz: calculateLorenzCurve(historicalAllocations),
    },
    aura: {
      gini: calculateGiniCoefficient(auraAllocations),
      lorenz: calculateLorenzCurve(auraAllocations),
    },
    combined: {
      gini: calculateGiniCoefficient(combinedAllocations),
      lorenz: calculateLorenzCurve(combinedAllocations),
    },
  };
}

/**
 * Fetch NFT correlation data
 */
async function getNftCorrelationData(): Promise<NftCorrelationData[]> {
  console.log('Fetching NFT correlation data...');

  const results = await models.sequelize.query<{
    user_id: number;
    user_tier: number | null;
    avg_rarity: string | null;
    nft_allocation: string;
    total_allocation: string;
  }>(
    `
      WITH NFTUserData AS (
        SELECT 
          user_id,
          user_tier::integer as user_tier,
          AVG(COALESCE(rarity_tier, 0)) as avg_rarity,
          SUM(total_token_allocation) as nft_allocation
        FROM "NftSnapshot"
        WHERE user_id IS NOT NULL
        GROUP BY user_id, user_tier
      ),
      HistoricalTotals AS (
        SELECT 
          user_id,
          token_allocation as historical_allocation
        FROM "HistoricalAllocations"
        WHERE token_allocation > 0
      ),
      AuraTotals AS (
        SELECT 
          user_id,
          token_allocation as aura_allocation
        FROM "AuraAllocations"
        WHERE token_allocation > 0
      ),
      AllAllocations AS (
        SELECT 
          n.user_id,
          COALESCE(n.nft_allocation, 0) + 
          COALESCE(h.historical_allocation, 0) + 
          COALESCE(a.aura_allocation, 0) as total_allocation
        FROM NFTUserData n
        LEFT JOIN HistoricalTotals h ON n.user_id = h.user_id
        LEFT JOIN AuraTotals a ON n.user_id = a.user_id
      )
      SELECT 
        n.user_id,
        n.user_tier,
        n.avg_rarity,
        n.nft_allocation,
        al.total_allocation
      FROM NFTUserData n
      LEFT JOIN AllAllocations al ON n.user_id = al.user_id
      WHERE n.nft_allocation > 0
      ORDER BY n.nft_allocation DESC;
    `,
    { type: QueryTypes.SELECT },
  );

  return results.map((row) => ({
    userId: row.user_id,
    userTier: row.user_tier,
    rarity: row.avg_rarity ? parseFloat(row.avg_rarity) : null,
    nftAllocation: parseFloat(row.nft_allocation),
    totalAllocation: parseFloat(row.total_allocation),
  }));
}

/**
 * Fetch Aura correlation data
 */
async function getAuraCorrelationData(): Promise<AuraCorrelationData[]> {
  console.log('Fetching Aura correlation data...');

  const results = await models.sequelize.query<{
    user_id: number;
    user_tier: number | null;
    aura_xp: number;
    aura_allocation: string;
    total_allocation: string;
  }>(
    `
      WITH AuraUserData AS (
        SELECT 
          user_id,
          COALESCE(total_xp, 0) as aura_xp,
          COALESCE(token_allocation, 0) as aura_allocation
        FROM "AuraAllocations"
        WHERE token_allocation > 0
      ),
      UserTiers AS (
        SELECT DISTINCT user_id, user_tier::integer as user_tier
        FROM "NftSnapshot"
        WHERE user_id IS NOT NULL
      ),
      NFTTotals AS (
        SELECT 
          user_id,
          SUM(total_token_allocation) as nft_allocation
        FROM "NftSnapshot"
        WHERE user_id IS NOT NULL
        GROUP BY user_id
      ),
      HistoricalTotals AS (
        SELECT 
          user_id,
          token_allocation as historical_allocation
        FROM "HistoricalAllocations"
        WHERE token_allocation > 0
      ),
      AllAllocations AS (
        SELECT 
          a.user_id,
          COALESCE(n.nft_allocation, 0) + 
          COALESCE(h.historical_allocation, 0) + 
          COALESCE(a.aura_allocation, 0) as total_allocation
        FROM AuraUserData a
        LEFT JOIN NFTTotals n ON a.user_id = n.user_id
        LEFT JOIN HistoricalTotals h ON a.user_id = h.user_id
      )
      SELECT 
        a.user_id,
        ut.user_tier,
        a.aura_xp,
        a.aura_allocation,
        al.total_allocation
      FROM AuraUserData a
      LEFT JOIN UserTiers ut ON a.user_id = ut.user_id
      LEFT JOIN AllAllocations al ON a.user_id = al.user_id
      ORDER BY a.aura_allocation DESC;
    `,
    { type: QueryTypes.SELECT },
  );

  return results.map((row) => ({
    userId: row.user_id,
    userTier: row.user_tier,
    auraXP: Number(row.aura_xp),
    auraAllocation: parseFloat(row.aura_allocation),
    totalAllocation: parseFloat(row.total_allocation),
  }));
}

/**
 * Fetch Historical correlation data
 */
async function getHistoricalCorrelationData(): Promise<
  HistoricalCorrelationData[]
> {
  console.log('Fetching Historical correlation data...');

  const results = await models.sequelize.query<{
    user_id: number;
    user_tier: number | null;
    thread_count: number;
    comment_count: number;
    historical_allocation: string;
    total_allocation: string;
  }>(
    `
      WITH HistoricalUserData AS (
        SELECT 
          user_id,
          COALESCE(num_threads, 0) as thread_count,
          COALESCE(num_comments, 0) as comment_count,
          COALESCE(token_allocation, 0) as historical_allocation
        FROM "HistoricalAllocations"
        WHERE token_allocation > 0
      ),
      UserTiers AS (
        SELECT DISTINCT user_id, user_tier::integer as user_tier
        FROM "NftSnapshot"
        WHERE user_id IS NOT NULL
      ),
      NFTTotals AS (
        SELECT 
          user_id,
          SUM(total_token_allocation) as nft_allocation
        FROM "NftSnapshot"
        WHERE user_id IS NOT NULL
        GROUP BY user_id
      ),
      AuraTotals AS (
        SELECT 
          user_id,
          token_allocation as aura_allocation
        FROM "AuraAllocations"
        WHERE token_allocation > 0
      ),
      AllAllocations AS (
        SELECT 
          h.user_id,
          COALESCE(n.nft_allocation, 0) + 
          COALESCE(h.historical_allocation, 0) + 
          COALESCE(a.aura_allocation, 0) as total_allocation
        FROM HistoricalUserData h
        LEFT JOIN NFTTotals n ON h.user_id = n.user_id
        LEFT JOIN AuraTotals a ON h.user_id = a.user_id
      )
      SELECT 
        h.user_id,
        ut.user_tier,
        h.thread_count,
        h.comment_count,
        h.historical_allocation,
        al.total_allocation
      FROM HistoricalUserData h
      LEFT JOIN UserTiers ut ON h.user_id = ut.user_id
      LEFT JOIN AllAllocations al ON h.user_id = al.user_id
      ORDER BY h.historical_allocation DESC;
    `,
    { type: QueryTypes.SELECT },
  );

  return results.map((row) => ({
    userId: row.user_id,
    userTier: row.user_tier,
    threadCount: Number(row.thread_count),
    commentCount: Number(row.comment_count),
    historicalAllocation: parseFloat(row.historical_allocation),
    totalAllocation: parseFloat(row.total_allocation),
  }));
}

/**
 * Fetch user allocation data for Aura Allocations
 */
async function getAuraUserAllocations(): Promise<UserAllocationData[]> {
  console.log('Fetching Aura allocation data...');

  const results = await models.sequelize.query<{
    user_id: number;
    token_allocation: string;
  }>(
    `
      SELECT 
        user_id,
        token_allocation
      FROM "AuraAllocations"
      WHERE token_allocation IS NOT NULL
        AND token_allocation > 0
      ORDER BY token_allocation DESC;
    `,
    { type: QueryTypes.SELECT },
  );

  return results.map((row, index) => ({
    userId: row.user_id,
    allocation: parseFloat(row.token_allocation),
    rank: index + 1,
  }));
}

/**
 * Generate HTML with Chart.js for tier distribution (column and pie charts)
 */
function generateTierDistributionHTML(
  data: TierDistributionData[],
  title: string,
  filename: string,
  useTotal: boolean = true,
): string {
  const labels = data.map((d) => d.tierName);
  const values = data.map((d) =>
    useTotal ? d.totalAllocation : d.averageAllocation,
  );
  const colors = COLORS.slice(0, data.length);

  return `
<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
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
    <h1>${title}</h1>
    
    <div class="stats">
        <h2>Summary Statistics</h2>
        <p><strong>Total NFTs:</strong> ${(() => {
          const total = data.reduce((sum, d) => sum + Number(d.nftCount), 0);
          return total.toLocaleString();
        })()}</p>
        <p><strong>Total Users:</strong> ${(() => {
          const total = data.reduce((sum, d) => sum + Number(d.userCount), 0);
          return total.toLocaleString();
        })()}</p>
        <p><strong>Total Allocation:</strong> ${(() => {
          const total = data.reduce(
            (sum, d) => sum + Number(d.totalAllocation),
            0,
          );
          return total.toLocaleString();
        })()} tokens</p>
        <p><strong>Average per NFT:</strong> ${(() => {
          const totalAllocation = data.reduce(
            (sum, d) => sum + Number(d.totalAllocation),
            0,
          );
          const totalNfts = data.reduce(
            (sum, d) => sum + Number(d.nftCount),
            0,
          );
          return (totalAllocation / totalNfts).toFixed(2);
        })()} tokens</p>
    </div>

    <div class="chart-container">
        <h2>Column Chart</h2>
        <canvas id="columnChart"></canvas>
    </div>
    
    <div class="chart-container">
        <h2>Pie Chart</h2>
        <canvas id="pieChart"></canvas>
    </div>

    <script>
        // Column Chart
        const columnCtx = document.getElementById('columnChart').getContext('2d');
        new Chart(columnCtx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(labels)},
                datasets: [{
                    label: '${useTotal ? 'Total' : 'Average'} Allocation',
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
 * Generate HTML for equal vs rarity distribution comparison
 */
function generateEqualRarityComparisonHTML(
  data: EqualRarityDistributionData[],
): string {
  const labels = data.map((d) => d.tierName);
  const equalData = data.map((d) => d.avgEqualDistribution);
  const rarityData = data.map((d) => d.avgRarityDistribution);

  return `
<!DOCTYPE html>
<html>
<head>
    <title>NFT Allocations - Equal vs Rarity Distribution by Tier</title>
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
    <h1>NFT Allocations - Equal vs Rarity Distribution by Tier</h1>
    
    <div class="stats">
        <h2>Summary Statistics</h2>
        <p><strong>Total NFTs:</strong> ${(() => {
          const total = data.reduce((sum, d) => sum + Number(d.nftCount), 0);
          return total.toLocaleString();
        })()}</p>
        <p><strong>Total Equal Distribution:</strong> ${(() => {
          const total = data.reduce(
            (sum, d) =>
              sum + Number(d.avgEqualDistribution) * Number(d.nftCount),
            0,
          );
          return total.toLocaleString();
        })()} tokens</p>
        <p><strong>Total Rarity Distribution:</strong> ${(() => {
          const total = data.reduce(
            (sum, d) =>
              sum + Number(d.avgRarityDistribution) * Number(d.nftCount),
            0,
          );
          return total.toLocaleString();
        })()} tokens</p>
    </div>

    <div class="chart-container">
        <h2>Column Chart Comparison</h2>
        <canvas id="comparisonChart"></canvas>
    </div>
    
    <div class="chart-container">
        <h2>Stacked Column Chart</h2>
        <canvas id="stackedChart"></canvas>
    </div>

    <script>
        // Comparison Chart
        const comparisonCtx = document.getElementById('comparisonChart').getContext('2d');
        new Chart(comparisonCtx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(labels)},
                datasets: [
                    {
                        label: 'Equal Distribution',
                        data: ${JSON.stringify(equalData)},
                        backgroundColor: '#36A2EB',
                        borderColor: '#36A2EB80',
                        borderWidth: 1
                    },
                    {
                        label: 'Rarity Distribution',
                        data: ${JSON.stringify(rarityData)},
                        backgroundColor: '#FF6384',
                        borderColor: '#FF638480',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toLocaleString() + ' tokens';
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

        // Stacked Chart
        const stackedCtx = document.getElementById('stackedChart').getContext('2d');
        new Chart(stackedCtx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(labels)},
                datasets: [
                    {
                        label: 'Equal Distribution',
                        data: ${JSON.stringify(equalData)},
                        backgroundColor: '#36A2EB',
                        borderColor: '#36A2EB80',
                        borderWidth: 1
                    },
                    {
                        label: 'Rarity Distribution',
                        data: ${JSON.stringify(rarityData)},
                        backgroundColor: '#FF6384',
                        borderColor: '#FF638480',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: { stacked: true },
                    y: { 
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    }
                },
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toLocaleString() + ' tokens';
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
 * Generate HTML for Lorenz curves and Gini coefficients
 */
function generateLorenzCurveHTML(giniData: GiniData): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Lorenz Curves and Gini Coefficients - Token Allocation Inequality Analysis</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .chart-container { width: 48%; display: inline-block; margin: 1%; }
        .full-width-chart { width: 98%; margin: 1%; }
        .stats { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
        .gini-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 20px; margin: 20px 0; }
        .gini-item { text-align: center; padding: 15px; background: white; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .gini-value { font-size: 2em; font-weight: bold; color: #333; }
        .gini-label { color: #666; margin-top: 5px; }
        .gini-interpretation { font-size: 0.9em; color: #888; margin-top: 5px; }
        h1 { text-align: center; color: #333; }
        h2 { color: #666; margin-top: 30px; }
        .explanation { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .explanation h3 { margin-top: 0; color: #2c5aa0; }
    </style>
</head>
<body>
    <h1>Lorenz Curves and Gini Coefficients - Token Allocation Inequality Analysis</h1>
    
    <div class="explanation">
        <h3>Understanding Lorenz Curves and Gini Coefficients</h3>
        <p><strong>Lorenz Curve:</strong> Shows the cumulative distribution of wealth. The diagonal line represents perfect equality. The further the curve is from the diagonal, the greater the inequality.</p>
        <p><strong>Gini Coefficient:</strong> Quantifies inequality on a scale from 0 to 1:</p>
        <ul>
            <li><strong>0.0 - 0.2:</strong> Very low inequality (highly equal distribution)</li>
            <li><strong>0.2 - 0.3:</strong> Low inequality</li>
            <li><strong>0.3 - 0.4:</strong> Moderate inequality</li>
            <li><strong>0.4 - 0.5:</strong> High inequality</li>
            <li><strong>0.5+:</strong> Very high inequality</li>
        </ul>
        <p style="margin-top: 10px; font-size: 0.9em; color: #666;">
            <em><strong>Note:</strong> Lorenz curves are calculated using percentile buckets (100 data points) for efficient rendering while maintaining accuracy.</em>
        </p>
    </div>

    <div class="gini-grid">
        <div class="gini-item">
            <div class="gini-value">${giniData.nft.gini.toFixed(3)}</div>
            <div class="gini-label">NFT Allocations</div>
            <div class="gini-interpretation">${getGiniInterpretation(giniData.nft.gini)}</div>
        </div>
        <div class="gini-item">
            <div class="gini-value">${giniData.historical.gini.toFixed(3)}</div>
            <div class="gini-label">Historical Allocations</div>
            <div class="gini-interpretation">${getGiniInterpretation(giniData.historical.gini)}</div>
        </div>
        <div class="gini-item">
            <div class="gini-value">${giniData.aura.gini.toFixed(3)}</div>
            <div class="gini-label">Aura Allocations</div>
            <div class="gini-interpretation">${getGiniInterpretation(giniData.aura.gini)}</div>
        </div>
        <div class="gini-item">
            <div class="gini-value">${giniData.combined.gini.toFixed(3)}</div>
            <div class="gini-label">Combined Allocations</div>
            <div class="gini-interpretation">${getGiniInterpretation(giniData.combined.gini)}</div>
        </div>
    </div>

    <div class="chart-container">
        <h2>Individual Lorenz Curves</h2>
        <div style="position: relative; height: 400px;">
            <canvas id="individualLorenzChart"></canvas>
        </div>
    </div>
    
    <div class="chart-container">
        <h2>Combined Lorenz Curve</h2>
        <div style="position: relative; height: 400px;">
            <canvas id="combinedLorenzChart"></canvas>
        </div>
    </div>

    <div class="full-width-chart">
        <h2>All Lorenz Curves Comparison</h2>
        <div style="position: relative; height: 500px;">
            <canvas id="allLorenzChart"></canvas>
        </div>
    </div>

    <script>
        function getGiniInterpretation(gini) {
            if (gini < 0.2) return 'Very Low Inequality';
            if (gini < 0.3) return 'Low Inequality';
            if (gini < 0.4) return 'Moderate Inequality';
            if (gini < 0.5) return 'High Inequality';
            return 'Very High Inequality';
        }

        // Prepare data
        const nftLorenz = ${JSON.stringify(giniData.nft.lorenz)};
        const historicalLorenz = ${JSON.stringify(giniData.historical.lorenz)};
        const auraLorenz = ${JSON.stringify(giniData.aura.lorenz)};
        const combinedLorenz = ${JSON.stringify(giniData.combined.lorenz)};
        
        // Debug logging
        console.log('NFT Lorenz data points:', nftLorenz.length);
        console.log('Historical Lorenz data points:', historicalLorenz.length);
        console.log('Aura Lorenz data points:', auraLorenz.length);
        console.log('Combined Lorenz data points:', combinedLorenz.length);
        console.log('Sample NFT data:', nftLorenz.slice(0, 5));
        
        // Perfect equality line (diagonal)
        const equalityLine = [{x: 0, y: 0}, {x: 100, y: 100}];

        // Individual Lorenz Curves Chart
        const individualCtx = document.getElementById('individualLorenzChart').getContext('2d');
        new Chart(individualCtx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Perfect Equality',
                        data: equalityLine,
                        borderColor: '#999',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        pointRadius: 0,
                        borderWidth: 2,
                        showLine: true,
                        fill: false
                    },
                    {
                        label: 'NFT Allocations (Gini: ${giniData.nft.gini.toFixed(3)})',
                        data: nftLorenz.map(d => ({x: d.populationPercent, y: d.wealthPercent})),
                        borderColor: '#FF6384',
                        backgroundColor: '#FF6384',
                        pointRadius: 2,
                        borderWidth: 2,
                        showLine: true,
                        fill: false
                    },
                    {
                        label: 'Historical Allocations (Gini: ${giniData.historical.gini.toFixed(3)})',
                        data: historicalLorenz.map(d => ({x: d.populationPercent, y: d.wealthPercent})),
                        borderColor: '#36A2EB',
                        backgroundColor: '#36A2EB',
                        pointRadius: 2,
                        borderWidth: 2,
                        showLine: true,
                        fill: false
                    },
                    {
                        label: 'Aura Allocations (Gini: ${giniData.aura.gini.toFixed(3)})',
                        data: auraLorenz.map(d => ({x: d.populationPercent, y: d.wealthPercent})),
                        borderColor: '#FFCE56',
                        backgroundColor: '#FFCE56',
                        pointRadius: 2,
                        borderWidth: 2,
                        showLine: true,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: {
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': (' + 
                                       context.parsed.x.toFixed(1) + '%, ' + 
                                       context.parsed.y.toFixed(1) + '%)';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: 0,
                        max: 100,
                        title: { 
                            display: true, 
                            text: 'Cumulative Population (%)',
                            font: { size: 12 }
                        },
                        grid: {
                            display: true,
                            color: '#e0e0e0'
                        }
                    },
                    y: {
                        type: 'linear',
                        min: 0,
                        max: 100,
                        title: { 
                            display: true, 
                            text: 'Cumulative Wealth (%)',
                            font: { size: 12 }
                        },
                        grid: {
                            display: true,
                            color: '#e0e0e0'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'point'
                }
            }
        });

        // Combined Lorenz Curve Chart
        const combinedCtx = document.getElementById('combinedLorenzChart').getContext('2d');
        new Chart(combinedCtx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Perfect Equality',
                        data: equalityLine,
                        borderColor: '#999',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        pointRadius: 0,
                        borderWidth: 2,
                        showLine: true,
                        fill: false
                    },
                    {
                        label: 'Combined Allocations (Gini: ${giniData.combined.gini.toFixed(3)})',
                        data: combinedLorenz.map(d => ({x: d.populationPercent, y: d.wealthPercent})),
                        borderColor: '#9966FF',
                        backgroundColor: '#9966FF',
                        pointRadius: 2,
                        borderWidth: 3,
                        showLine: true,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: {
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': (' + 
                                       context.parsed.x.toFixed(1) + '%, ' + 
                                       context.parsed.y.toFixed(1) + '%)';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: 0,
                        max: 100,
                        title: { 
                            display: true, 
                            text: 'Cumulative Population (%)',
                            font: { size: 12 }
                        },
                        grid: {
                            display: true,
                            color: '#e0e0e0'
                        }
                    },
                    y: {
                        type: 'linear',
                        min: 0,
                        max: 100,
                        title: { 
                            display: true, 
                            text: 'Cumulative Wealth (%)',
                            font: { size: 12 }
                        },
                        grid: {
                            display: true,
                            color: '#e0e0e0'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'point'
                }
            }
        });

        // All Lorenz Curves Comparison Chart
        const allCtx = document.getElementById('allLorenzChart').getContext('2d');
        new Chart(allCtx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Perfect Equality',
                        data: equalityLine,
                        borderColor: '#999',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        pointRadius: 0,
                        borderWidth: 2,
                        showLine: true,
                        fill: false
                    },
                    {
                        label: 'NFT Allocations (Gini: ${giniData.nft.gini.toFixed(3)})',
                        data: nftLorenz.map(d => ({x: d.populationPercent, y: d.wealthPercent})),
                        borderColor: '#FF6384',
                        backgroundColor: '#FF6384',
                        pointRadius: 1,
                        borderWidth: 2,
                        showLine: true,
                        fill: false
                    },
                    {
                        label: 'Historical Allocations (Gini: ${giniData.historical.gini.toFixed(3)})',
                        data: historicalLorenz.map(d => ({x: d.populationPercent, y: d.wealthPercent})),
                        borderColor: '#36A2EB',
                        backgroundColor: '#36A2EB',
                        pointRadius: 1,
                        borderWidth: 2,
                        showLine: true,
                        fill: false
                    },
                    {
                        label: 'Aura Allocations (Gini: ${giniData.aura.gini.toFixed(3)})',
                        data: auraLorenz.map(d => ({x: d.populationPercent, y: d.wealthPercent})),
                        borderColor: '#FFCE56',
                        backgroundColor: '#FFCE56',
                        pointRadius: 1,
                        borderWidth: 2,
                        showLine: true,
                        fill: false
                    },
                    {
                        label: 'Combined Allocations (Gini: ${giniData.combined.gini.toFixed(3)})',
                        data: combinedLorenz.map(d => ({x: d.populationPercent, y: d.wealthPercent})),
                        borderColor: '#9966FF',
                        backgroundColor: '#9966FF',
                        pointRadius: 1,
                        borderWidth: 3,
                        showLine: true,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: {
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': (' + 
                                       context.parsed.x.toFixed(1) + '%, ' + 
                                       context.parsed.y.toFixed(1) + '%)';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: 0,
                        max: 100,
                        title: { 
                            display: true, 
                            text: 'Cumulative Population (%)',
                            font: { size: 12 }
                        },
                        grid: {
                            display: true,
                            color: '#e0e0e0'
                        }
                    },
                    y: {
                        type: 'linear',
                        min: 0,
                        max: 100,
                        title: { 
                            display: true, 
                            text: 'Cumulative Wealth (%)',
                            font: { size: 12 }
                        },
                        grid: {
                            display: true,
                            color: '#e0e0e0'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'point'
                }
            }
        });
    </script>
</body>
</html>`;
}

function getGiniInterpretation(gini: number): string {
  if (gini < 0.2) return 'Very Low Inequality';
  if (gini < 0.3) return 'Low Inequality';
  if (gini < 0.4) return 'Moderate Inequality';
  if (gini < 0.5) return 'High Inequality';
  return 'Very High Inequality';
}

/**
 * Calculate Pearson correlation coefficient between two arrays
 */
function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0 || n !== y.length) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
  );

  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Calculate NFT correlation matrix
 */
function calculateNftCorrelationMatrix(data: NftCorrelationData[]): {
  variables: string[];
  matrix: number[][];
} {
  const userTiers = data.map((d) => d.userTier ?? 0);
  const rarities = data.map((d) => d.rarity ?? 0);
  const nftAllocations = data.map((d) => d.nftAllocation);
  const totalAllocations = data.map((d) => d.totalAllocation);

  const variables = [
    'User Tier',
    'Avg Rarity',
    'NFT Allocation',
    'Total Allocation',
  ];

  const datasets = [userTiers, rarities, nftAllocations, totalAllocations];

  const matrix: number[][] = [];
  for (let i = 0; i < datasets.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < datasets.length; j++) {
      matrix[i][j] = calculateCorrelation(datasets[i], datasets[j]);
    }
  }

  return { variables, matrix };
}

/**
 * Calculate Aura correlation matrix
 */
function calculateAuraCorrelationMatrix(data: AuraCorrelationData[]): {
  variables: string[];
  matrix: number[][];
} {
  const userTiers = data.map((d) => d.userTier ?? 0);
  const auraXPs = data.map((d) => d.auraXP);
  const auraAllocations = data.map((d) => d.auraAllocation);
  const totalAllocations = data.map((d) => d.totalAllocation);

  const variables = [
    'User Tier',
    'Aura XP',
    'Aura Allocation',
    'Total Allocation',
  ];

  const datasets = [userTiers, auraXPs, auraAllocations, totalAllocations];

  const matrix: number[][] = [];
  for (let i = 0; i < datasets.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < datasets.length; j++) {
      matrix[i][j] = calculateCorrelation(datasets[i], datasets[j]);
    }
  }

  return { variables, matrix };
}

/**
 * Calculate Historical correlation matrix
 */
function calculateHistoricalCorrelationMatrix(
  data: HistoricalCorrelationData[],
): {
  variables: string[];
  matrix: number[][];
} {
  const userTiers = data.map((d) => d.userTier ?? 0);
  const threadCounts = data.map((d) => d.threadCount);
  const commentCounts = data.map((d) => d.commentCount);
  const historicalAllocations = data.map((d) => d.historicalAllocation);
  const totalAllocations = data.map((d) => d.totalAllocation);

  const variables = [
    'User Tier',
    'Thread Count',
    'Comment Count',
    'Historical Allocation',
    'Total Allocation',
  ];

  const datasets = [
    userTiers,
    threadCounts,
    commentCounts,
    historicalAllocations,
    totalAllocations,
  ];

  const matrix: number[][] = [];
  for (let i = 0; i < datasets.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < datasets.length; j++) {
      matrix[i][j] = calculateCorrelation(datasets[i], datasets[j]);
    }
  }

  return { variables, matrix };
}

/**
 * Sample data points from user allocation data with complete coverage of top allocations
 * Takes ALL of the top 500 allocations, then uniformly samples the rest
 * This ensures smooth visualization of the high-value tail of the distribution
 */
function sampleUserAllocationData(
  data: UserAllocationData[],
  numSamples: number = 100,
  topN: number = 500,
): UserAllocationData[] {
  if (data.length === 0) return [];
  if (data.length <= topN) return data;

  const sampledData: UserAllocationData[] = [];

  // Data is sorted in descending order, so top allocations are at the beginning
  // Add ALL of the top N allocations (highest values)
  for (let i = 0; i < topN; i++) {
    sampledData.push(data[i]);
  }

  // Calculate how many samples we need from the remaining portion (lower allocations)
  const numRemaining = data.length - topN;
  const remainingSamples = Math.max(
    numSamples - topN,
    Math.floor(numRemaining / 100),
  );

  // Uniformly sample from the remaining portion (lower allocations)
  if (numRemaining > 0 && remainingSamples > 0) {
    const step = numRemaining / remainingSamples;
    for (let i = 0; i < remainingSamples; i++) {
      const index = topN + Math.min(Math.floor(i * step), numRemaining - 1);
      sampledData.push(data[index]);
    }
  }

  return sampledData;
}

/**
 * Generate HTML for correlation matrices visualization (NFT, Aura, Historical)
 */
function generateCorrelationMatrixHTML(
  nftResult: { variables: string[]; matrix: number[][] },
  auraResult: { variables: string[]; matrix: number[][] },
  historicalResult: { variables: string[]; matrix: number[][] },
  nftCount: number,
  auraCount: number,
  historicalCount: number,
): string {
  const generateMatrixTable = (
    variables: string[],
    matrix: number[][],
    title: string,
  ) => {
    return `
        <div class="matrix-section">
            <h2>${title}</h2>
            <table>
                <thead>
                    <tr>
                        <th></th>
                        ${variables.map((v) => `<th>${v}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${matrix
                      .map((row, i) => {
                        const getColorForValue = (value: number): string => {
                          if (value >= 0.7) return '#1a9850';
                          if (value >= 0.3) return '#91cf60';
                          if (value >= -0.3) return '#fee08b';
                          if (value >= -0.7) return '#fc8d59';
                          return '#d73027';
                        };

                        return `
                        <tr>
                            <td class="row-header">${variables[i]}</td>
                            ${row
                              .map((value) => {
                                const color = getColorForValue(value);
                                const displayValue = value.toFixed(3);
                                return `<td style="background-color: ${color}; ${Math.abs(value) > 0.5 ? 'font-weight: bold;' : ''}">${displayValue}</td>`;
                              })
                              .join('')}
                        </tr>
                        `;
                      })
                      .join('')}
                </tbody>
            </table>
        </div>
    `;
  };

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Correlation Matrices - Token Allocation Analysis</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
        .container { max-width: 1400px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { text-align: center; color: #333; }
        h2 { color: #007bff; margin-top: 40px; }
        .explanation { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .explanation h3 { margin-top: 0; color: #2c5aa0; }
        .stats-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
        .stats { padding: 15px; background: #f5f5f5; border-radius: 5px; text-align: center; }
        .matrix-section { margin: 30px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: center; border: 1px solid #ddd; }
        th { background-color: #007bff; color: white; font-weight: bold; }
        td.row-header { background-color: #f0f0f0; font-weight: bold; text-align: left; }
        .legend { display: flex; justify-content: center; align-items: center; margin: 20px 0; gap: 10px; flex-wrap: wrap; }
        .legend-item { display: flex; align-items: center; gap: 5px; }
        .legend-box { width: 30px; height: 20px; border: 1px solid #333; }
        .interpretation { margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Correlation Matrices - Token Allocation Analysis</h1>
        
        <div class="explanation">
            <h3>Understanding Correlation Matrices</h3>
            <p><strong>Correlation Coefficient:</strong> Measures the strength and direction of linear relationship between two variables, ranging from -1 to +1:</p>
            <ul>
                <li><strong>+1:</strong> Perfect positive correlation (as one increases, the other increases proportionally)</li>
                <li><strong>0:</strong> No linear correlation</li>
                <li><strong>-1:</strong> Perfect negative correlation (as one increases, the other decreases proportionally)</li>
            </ul>
            <p><strong>Interpretation Guidelines:</strong></p>
            <ul>
                <li><strong>0.7 to 1.0:</strong> Strong positive correlation</li>
                <li><strong>0.3 to 0.7:</strong> Moderate positive correlation</li>
                <li><strong>0.0 to 0.3:</strong> Weak positive correlation</li>
                <li><strong>-0.3 to 0.0:</strong> Weak negative correlation</li>
                <li><strong>-0.7 to -0.3:</strong> Moderate negative correlation</li>
                <li><strong>-1.0 to -0.7:</strong> Strong negative correlation</li>
            </ul>
        </div>

        <div class="stats-container">
            <div class="stats">
                <h3>NFT Allocations</h3>
                <p><strong>Users analyzed:</strong> ${nftCount.toLocaleString()}</p>
                <p><em>Users with NFT allocations</em></p>
            </div>
            <div class="stats">
                <h3>Aura Allocations</h3>
                <p><strong>Users analyzed:</strong> ${auraCount.toLocaleString()}</p>
                <p><em>Users with Aura allocations</em></p>
            </div>
            <div class="stats">
                <h3>Historical Allocations</h3>
                <p><strong>Users analyzed:</strong> ${historicalCount.toLocaleString()}</p>
                <p><em>Users with Historical allocations</em></p>
            </div>
        </div>

        <div class="legend">
            <span><strong>Correlation Strength:</strong></span>
            <div class="legend-item">
                <div class="legend-box" style="background: #d73027;"></div>
                <span>Strong Negative (-1.0 to -0.7)</span>
            </div>
            <div class="legend-item">
                <div class="legend-box" style="background: #fc8d59;"></div>
                <span>Moderate Negative (-0.7 to -0.3)</span>
            </div>
            <div class="legend-item">
                <div class="legend-box" style="background: #fee08b;"></div>
                <span>Weak (-0.3 to 0.3)</span>
            </div>
            <div class="legend-item">
                <div class="legend-box" style="background: #91cf60;"></div>
                <span>Moderate Positive (0.3 to 0.7)</span>
            </div>
            <div class="legend-item">
                <div class="legend-box" style="background: #1a9850;"></div>
                <span>Strong Positive (0.7 to 1.0)</span>
            </div>
        </div>

        ${generateMatrixTable(nftResult.variables, nftResult.matrix, 'NFT Correlation Matrix')}
        
        <div class="interpretation">
            <h3>NFT Key Insights</h3>
            <div id="nft-insights"></div>
        </div>

        ${generateMatrixTable(auraResult.variables, auraResult.matrix, 'Aura Correlation Matrix')}
        
        <div class="interpretation">
            <h3>Aura Key Insights</h3>
            <div id="aura-insights"></div>
        </div>

        ${generateMatrixTable(historicalResult.variables, historicalResult.matrix, 'Historical Correlation Matrix')}
        
        <div class="interpretation">
            <h3>Historical Key Insights</h3>
            <div id="historical-insights"></div>
        </div>
    </div>

    <script>
        function getCorrelationStrength(value) {
            const abs = Math.abs(value);
            if (abs >= 0.7) return 'strong';
            if (abs >= 0.3) return 'moderate';
            return 'weak';
        }

        function generateInsights(matrix, variables, elementId) {
            const correlations = [];
            for (let i = 0; i < matrix.length; i++) {
                for (let j = i + 1; j < matrix[i].length; j++) {
                    correlations.push({
                        var1: variables[i],
                        var2: variables[j],
                        value: matrix[i][j]
                    });
                }
            }

            correlations.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

            const insightsDiv = document.getElementById(elementId);
            const topCorrelations = correlations.slice(0, 3);

            insightsDiv.innerHTML = '<ul>' + topCorrelations.map(c => {
                const direction = c.value > 0 ? 'positive' : 'negative';
                const strength = getCorrelationStrength(c.value);
                return '<li><strong>' + c.var1 + '</strong> and <strong>' + c.var2 + 
                       '</strong> have a ' + strength + ' ' + direction + 
                       ' correlation (' + c.value.toFixed(3) + ')</li>';
            }).join('') + '</ul>';
        }

        // Generate insights for all matrices
        generateInsights(${JSON.stringify(nftResult.matrix)}, ${JSON.stringify(nftResult.variables)}, 'nft-insights');
        generateInsights(${JSON.stringify(auraResult.matrix)}, ${JSON.stringify(auraResult.variables)}, 'aura-insights');
        generateInsights(${JSON.stringify(historicalResult.matrix)}, ${JSON.stringify(historicalResult.variables)}, 'historical-insights');
    </script>
</body>
</html>`;
}

/**
 * Generate HTML for NFT allocation distribution charts (per user and per NFT)
 */
function generateNftAllocationHTML(
  perUserData: UserAllocationData[],
  perNftData: Array<{
    tokenId: number;
    allocation: number;
    rarityTier: number;
    rank: number;
  }>,
): string {
  // Sample data to 100 points each for efficient rendering
  const sampledPerUserData = sampleUserAllocationData(perUserData, 100);

  // Sample per-NFT data
  const sampledPerNftData: Array<{ x: number; y: number; tier: number }> = [];
  if (perNftData.length > 0) {
    const step = perNftData.length <= 100 ? 1 : (perNftData.length - 1) / 99;
    for (let i = 0; i < Math.min(100, perNftData.length); i++) {
      const index = Math.round(i * step);
      const nft = perNftData[index];
      sampledPerNftData.push({
        x: nft.rank,
        y: nft.allocation,
        tier: nft.rarityTier,
      });
    }
  }

  return `
<!DOCTYPE html>
<html>
<head>
    <title>NFT Allocation Distribution - Per User & Per NFT</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .chart-container { width: 100%; margin: 20px 0; }
        .stats { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .stats-item { text-align: center; }
        h1 { text-align: center; color: #333; }
        h2 { color: #666; margin-top: 30px; }
    </style>
</head>
<body>
    <h1>NFT Allocation Distribution - Per User & Per NFT</h1>
    
    <div class="stats">
        <h2>Summary Statistics</h2>
        <p style="text-align: center; color: #666; font-size: 0.9em; margin-bottom: 15px;">
            <em>Note: Charts display all top 500 allocations plus sampled lower allocations for optimal visualization. Statistics show full dataset.</em>
        </p>
        <div class="stats-grid">
            <div class="stats-item">
                <h3>NFT Allocations Per Holder</h3>
                <p><strong>Holders:</strong> ${perUserData.length.toLocaleString()}</p>
                <p><strong>Total:</strong> ${(() => {
                  const total = perUserData.reduce(
                    (sum, d) => sum + Number(d.allocation),
                    0,
                  );
                  return total.toLocaleString();
                })()} tokens</p>
                <p><strong>Average:</strong> ${(() => {
                  const total = perUserData.reduce(
                    (sum, d) => sum + Number(d.allocation),
                    0,
                  );
                  return (total / perUserData.length).toFixed(2);
                })()} tokens</p>
                <p><strong>Max:</strong> ${perUserData.length > 0 ? perUserData[perUserData.length - 1].allocation.toLocaleString() : 0} tokens</p>
            </div>
            <div class="stats-item">
                <h3>NFT Allocations Per NFT</h3>
                <p><strong>NFTs:</strong> ${perNftData.length.toLocaleString()}</p>
                <p><strong>Total:</strong> ${(() => {
                  const total = perNftData.reduce(
                    (sum, d) => sum + Number(d.allocation),
                    0,
                  );
                  return total.toLocaleString();
                })()} tokens</p>
                <p><strong>Average:</strong> ${(() => {
                  const total = perNftData.reduce(
                    (sum, d) => sum + Number(d.allocation),
                    0,
                  );
                  return (total / perNftData.length).toFixed(2);
                })()} tokens</p>
                <p><strong>Max:</strong> ${perNftData.length > 0 ? perNftData[0].allocation.toLocaleString() : 0} tokens (Tier ${perNftData.length > 0 ? perNftData[0].rarityTier : 0})</p>
            </div>
        </div>
    </div>

    <div class="chart-container">
        <h2>NFT Allocations Per Holder (Ordered from Least to Greatest)</h2>
        <div style="position: relative; height: 400px;">
            <canvas id="perUserChart"></canvas>
        </div>
    </div>

    <div class="chart-container">
        <h2>NFT Allocations Per NFT (Ordered by Rarity Tier & Allocation)</h2>
        <div style="position: relative; height: 400px;">
            <canvas id="perNftChart"></canvas>
        </div>
    </div>

    <script>
        // Per User Chart
        const perUserCtx = document.getElementById('perUserChart').getContext('2d');
        const perUserPoints = ${JSON.stringify(sampledPerUserData.map((d) => ({ x: d.rank, y: d.allocation })))};

        new Chart(perUserCtx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'NFT Allocations Per Holder',
                    data: perUserPoints,
                    borderColor: '#FF6384',
                    backgroundColor: '#FF6384',
                    pointRadius: 2,
                    pointHoverRadius: 4,
                    borderWidth: 2,
                    showLine: true,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    intersect: false,
                    mode: 'point'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { usePointStyle: true }
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return 'Holder Rank: ' + context[0].parsed.x.toLocaleString();
                            },
                            label: function(context) {
                                return 'Total Allocation: ' + context.parsed.y.toLocaleString() + ' tokens';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Holder Rank (Ordered by Total Allocation)',
                            font: { size: 12 }
                        },
                        grid: { display: true, color: '#e0e0e0' }
                    },
                    y: {
                        type: 'linear',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Total Token Allocation',
                            font: { size: 12 }
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        },
                        grid: { display: true, color: '#e0e0e0' }
                    }
                }
            }
        });

        // Per NFT Chart
        const perNftCtx = document.getElementById('perNftChart').getContext('2d');
        const perNftPoints = ${JSON.stringify(sampledPerNftData)};

        // Color NFTs by rarity tier
        const tierColors = {
            0: '#C9CBCF',
            1: '#FFCE56',
            2: '#36A2EB',
            3: '#9966FF',
            4: '#FF6384',
            5: '#FF9F40'
        };

        // Group by tier for multiple datasets
        const tierDatasets = {};
        perNftPoints.forEach(point => {
            if (!tierDatasets[point.tier]) {
                tierDatasets[point.tier] = [];
            }
            tierDatasets[point.tier].push({ x: point.x, y: point.y });
        });

        const datasets = Object.keys(tierDatasets).sort((a, b) => b - a).map(tier => ({
            label: 'Rarity Tier ' + tier,
            data: tierDatasets[tier],
            borderColor: tierColors[tier] || '#333',
            backgroundColor: tierColors[tier] || '#333',
            pointRadius: 2,
            pointHoverRadius: 4,
            borderWidth: 2,
            showLine: true,
            fill: false
        }));

        new Chart(perNftCtx, {
            type: 'scatter',
            data: { datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    intersect: false,
                    mode: 'point'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { usePointStyle: true }
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return 'NFT Rank: ' + context[0].parsed.x.toLocaleString();
                            },
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toLocaleString() + ' tokens';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'NFT Rank (Ordered by Rarity Tier, then Allocation)',
                            font: { size: 12 }
                        },
                        grid: { display: true, color: '#e0e0e0' }
                    },
                    y: {
                        type: 'linear',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Token Allocation',
                            font: { size: 12 }
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        },
                        grid: { display: true, color: '#e0e0e0' }
                    }
                }
            }
        });
    </script>
</body>
</html>`;
}

/**
 * Generate HTML for user allocation distribution (line/scatter plot)
 */
function generateUserAllocationHTML(
  historicalData: UserAllocationData[],
  auraData: UserAllocationData[],
): string {
  // Sample data to 100 points each for efficient rendering
  const sampledHistoricalData = sampleUserAllocationData(historicalData, 100);
  const sampledAuraData = sampleUserAllocationData(auraData, 100);

  return `
<!DOCTYPE html>
<html>
<head>
    <title>User Allocation Distribution - Historical & Aura Allocations</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .chart-container { width: 100%; margin: 20px 0; }
        .stats { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .stats-item { text-align: center; }
        h1 { text-align: center; color: #333; }
        h2 { color: #666; margin-top: 30px; }
    </style>
</head>
<body>
    <h1>User Allocation Distribution - Historical & Aura Allocations</h1>
    
    <div class="stats">
        <h2>Summary Statistics</h2>
        <p style="text-align: center; color: #666; font-size: 0.9em; margin-bottom: 15px;">
            <em>Note: Charts display all top 500 allocations plus sampled lower allocations for optimal visualization. Statistics show full dataset.</em>
        </p>
        <div class="stats-grid">
            <div class="stats-item">
                <h3>Historical Allocations</h3>
                <p><strong>Users:</strong> ${historicalData.length.toLocaleString()}</p>
                <p><strong>Total:</strong> ${(() => {
                  const total = historicalData.reduce(
                    (sum, d) => sum + Number(d.allocation),
                    0,
                  );
                  return total.toLocaleString();
                })()} tokens</p>
                <p><strong>Average:</strong> ${(() => {
                  const total = historicalData.reduce(
                    (sum, d) => sum + Number(d.allocation),
                    0,
                  );
                  return (total / historicalData.length).toFixed(2);
                })()} tokens</p>
                <p><strong>Median:</strong> ${historicalData.length > 0 ? historicalData[Math.floor(historicalData.length / 2)].allocation.toFixed(2) : 0} tokens</p>
            </div>
            <div class="stats-item">
                <h3>Aura Allocations</h3>
                <p><strong>Users:</strong> ${auraData.length.toLocaleString()}</p>
                <p><strong>Total:</strong> ${(() => {
                  const total = auraData.reduce(
                    (sum, d) => sum + Number(d.allocation),
                    0,
                  );
                  return total.toLocaleString();
                })()} tokens</p>
                <p><strong>Average:</strong> ${(() => {
                  const total = auraData.reduce(
                    (sum, d) => sum + Number(d.allocation),
                    0,
                  );
                  return (total / auraData.length).toFixed(2);
                })()} tokens</p>
                <p><strong>Median:</strong> ${auraData.length > 0 ? auraData[Math.floor(auraData.length / 2)].allocation.toFixed(2) : 0} tokens</p>
            </div>
        </div>
    </div>

    <div class="chart-container">
        <h2>Historical Allocations Distribution (Ordered from Greatest to Least)</h2>
        <div style="position: relative; height: 400px;">
            <canvas id="historicalChart"></canvas>
        </div>
    </div>

    <div class="chart-container">
        <h2>Aura Allocations Distribution (Ordered from Greatest to Least)</h2>
        <div style="position: relative; height: 400px;">
            <canvas id="auraChart"></canvas>
        </div>
    </div>

    <script>
        // Prepare sampled data for line charts
        const historicalPoints = ${JSON.stringify(sampledHistoricalData.map((d) => ({ x: d.rank, y: d.allocation })))};
        const auraPoints = ${JSON.stringify(sampledAuraData.map((d) => ({ x: d.rank, y: d.allocation })))};

        // Calculate x-axis ranges with gap before rank 1
        const historicalMaxRank = ${historicalData.length};
        const auraMaxRank = ${auraData.length};
        const historicalXMin = historicalMaxRank > 0 ? -historicalMaxRank * 0.02 : -10;
        const auraXMin = auraMaxRank > 0 ? -auraMaxRank * 0.02 : -10;

        // Historical Allocations Chart
        const historicalCtx = document.getElementById('historicalChart').getContext('2d');
        new Chart(historicalCtx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Historical Allocations',
                        data: historicalPoints,
                        borderColor: '#36A2EB',
                        backgroundColor: '#36A2EB',
                        pointRadius: 2,
                        pointHoverRadius: 4,
                        borderWidth: 2,
                        showLine: true,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    intersect: false,
                    mode: 'point'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return 'Rank: ' + context[0].parsed.x.toLocaleString();
                            },
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toLocaleString() + ' tokens';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: historicalXMin,
                        title: {
                            display: true,
                            text: 'User Rank (1 = Highest Allocation)',
                            font: { size: 12 }
                        },
                        ticks: {
                            callback: function(value) {
                                return value >= 0 ? value.toLocaleString() : '';
                            }
                        },
                        grid: {
                            display: true,
                            color: '#e0e0e0'
                        }
                    },
                    y: {
                        type: 'linear',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Token Allocation',
                            font: { size: 12 }
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        },
                        grid: {
                            display: true,
                            color: '#e0e0e0'
                        }
                    }
                }
            }
        });

        // Aura Allocations Chart
        const auraCtx = document.getElementById('auraChart').getContext('2d');
        new Chart(auraCtx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Aura Allocations',
                        data: auraPoints,
                        borderColor: '#FFCE56',
                        backgroundColor: '#FFCE56',
                        pointRadius: 2,
                        pointHoverRadius: 4,
                        borderWidth: 2,
                        showLine: true,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    intersect: false,
                    mode: 'point'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return 'Rank: ' + context[0].parsed.x.toLocaleString();
                            },
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toLocaleString() + ' tokens';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: auraXMin,
                        title: {
                            display: true,
                            text: 'User Rank (1 = Highest Allocation)',
                            font: { size: 12 }
                        },
                        ticks: {
                            callback: function(value) {
                                return value >= 0 ? value.toLocaleString() : '';
                            }
                        },
                        grid: {
                            display: true,
                            color: '#e0e0e0'
                        }
                    },
                    y: {
                        type: 'linear',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Token Allocation',
                            font: { size: 12 }
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        },
                        grid: {
                            display: true,
                            color: '#e0e0e0'
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
 * Main execution function
 */
async function main() {
  console.log('Starting token allocation distribution visualization...\n');

  try {
    // Fetch all data
    const [
      nftTierData,
      equalRarityData,
      nftUserData,
      nftIndividualData,
      historicalUserData,
      auraUserData,
      nftCorrelationData,
      auraCorrelationData,
      historicalCorrelationData,
    ] = await Promise.all([
      getNftTierDistribution(),
      getEqualRarityDistribution(),
      getNftUserAllocations(),
      getNftIndividualAllocations(),
      getHistoricalUserAllocations(),
      getAuraUserAllocations(),
      getNftCorrelationData(),
      getAuraCorrelationData(),
      getHistoricalCorrelationData(),
    ]);

    console.log('\nData Summary:');
    console.log(`- NFT tiers: ${nftTierData.length}`);
    console.log(`- Equal/Rarity tiers: ${equalRarityData.length}`);
    console.log(`- NFT users: ${nftUserData.length}`);
    console.log(`- Individual NFTs: ${nftIndividualData.length}`);
    console.log(`- Historical users: ${historicalUserData.length}`);
    console.log(`- Aura users: ${auraUserData.length}`);
    console.log(`- NFT correlation data users: ${nftCorrelationData.length}`);
    console.log(`- Aura correlation data users: ${auraCorrelationData.length}`);
    console.log(
      `- Historical correlation data users: ${historicalCorrelationData.length}`,
    );

    // Calculate Gini coefficients and Lorenz curves
    console.log('\nCalculating Gini coefficients and Lorenz curves...');
    const giniData = calculateGiniAndLorenzData(
      nftUserData,
      historicalUserData,
      auraUserData,
    );

    console.log('Gini Coefficients:');
    console.log(
      `- NFT: ${giniData.nft.gini.toFixed(3)} (${getGiniInterpretation(giniData.nft.gini)})`,
    );
    console.log(
      `- Historical: ${giniData.historical.gini.toFixed(3)} (${getGiniInterpretation(giniData.historical.gini)})`,
    );
    console.log(
      `- Aura: ${giniData.aura.gini.toFixed(3)} (${getGiniInterpretation(giniData.aura.gini)})`,
    );
    console.log(
      `- Combined: ${giniData.combined.gini.toFixed(3)} (${getGiniInterpretation(giniData.combined.gini)})`,
    );

    // Create/clear output directory
    const outputDir = path.join(process.cwd(), 'allocation-distribution');

    // Remove existing directory if it exists
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
      console.log('Cleared existing allocation-distribution directory');
    }

    // Create fresh directory
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('Created allocation-distribution directory');

    console.log('\nGenerating charts...');

    // 1. Total allocation by tier (column & pie charts)
    const totalAllocationHTML = generateTierDistributionHTML(
      nftTierData,
      'NFT Allocations - Total Token Allocation by User Tier',
      'total-allocation-by-tier.html',
      true,
    );
    fs.writeFileSync(
      path.join(outputDir, 'total-allocation-by-tier.html'),
      totalAllocationHTML,
    );
    console.log('Generated: total-allocation-by-tier.html');

    // 2. Average allocation by tier (column & pie charts)
    const avgAllocationHTML = generateTierDistributionHTML(
      nftTierData,
      'NFT Allocations - Average Token Allocation by User Tier',
      'average-allocation-by-tier.html',
      false,
    );
    fs.writeFileSync(
      path.join(outputDir, 'average-allocation-by-tier.html'),
      avgAllocationHTML,
    );
    console.log('Generated: average-allocation-by-tier.html');

    // 3. Equal vs Rarity distribution comparison
    const equalRarityHTML = generateEqualRarityComparisonHTML(equalRarityData);
    fs.writeFileSync(
      path.join(outputDir, 'equal-vs-rarity-distribution.html'),
      equalRarityHTML,
    );
    console.log('Generated: equal-vs-rarity-distribution.html');

    // 4. User allocation distribution (line/scatter plots)
    const userAllocationHTML = generateUserAllocationHTML(
      historicalUserData,
      auraUserData,
    );
    fs.writeFileSync(
      path.join(outputDir, 'user-allocation-distribution.html'),
      userAllocationHTML,
    );
    console.log('Generated: user-allocation-distribution.html');

    // 5. Lorenz curves and Gini coefficients
    const lorenzHTML = generateLorenzCurveHTML(giniData);
    fs.writeFileSync(
      path.join(outputDir, 'lorenz-curves-gini-coefficients.html'),
      lorenzHTML,
    );
    console.log('Generated: lorenz-curves-gini-coefficients.html');

    // 6. NFT allocation charts (per user and per NFT)
    const nftAllocationHTML = generateNftAllocationHTML(
      nftUserData,
      nftIndividualData,
    );
    fs.writeFileSync(
      path.join(outputDir, 'nft-allocation-detailed.html'),
      nftAllocationHTML,
    );
    console.log('Generated: nft-allocation-detailed.html');

    // 7. Correlation matrices (NFT, Aura, Historical)
    console.log('\nCalculating correlation matrices...');
    const nftCorrelationMatrix =
      calculateNftCorrelationMatrix(nftCorrelationData);
    const auraCorrelationMatrix =
      calculateAuraCorrelationMatrix(auraCorrelationData);
    const historicalCorrelationMatrix = calculateHistoricalCorrelationMatrix(
      historicalCorrelationData,
    );

    const correlationHTML = generateCorrelationMatrixHTML(
      nftCorrelationMatrix,
      auraCorrelationMatrix,
      historicalCorrelationMatrix,
      nftCorrelationData.length,
      auraCorrelationData.length,
      historicalCorrelationData.length,
    );
    fs.writeFileSync(
      path.join(outputDir, 'correlation-matrix.html'),
      correlationHTML,
    );
    console.log('Generated: correlation-matrix.html');

    // Generate index file for easy navigation
    const indexHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Token Allocation Distribution Charts</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f8f9fa; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; margin-bottom: 30px; }
        .chart-links { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
        .chart-link { display: block; padding: 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; text-align: center; transition: background 0.3s; }
        .chart-link:hover { background: #0056b3; }
        .chart-link:last-child { grid-column: 1 / -1; }
        .description { color: #666; line-height: 1.6; margin-bottom: 20px; }
        .timestamp { text-align: center; color: #999; margin-top: 30px; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Token Allocation Distribution Charts</h1>
        
        <div class="description">
            <p>This dashboard provides comprehensive visualizations of token allocation distributions across different user tiers and allocation methods. The charts analyze data from NFT snapshots, historical allocations, and Aura allocations.</p>
        </div>

        <div class="chart-links">
            <a href="total-allocation-by-tier.html" class="chart-link">
                NFT Allocations - Total by Tier<br>
                <small>Column & pie charts showing total NFT tokens by user tier</small>
            </a>
            
            <a href="average-allocation-by-tier.html" class="chart-link">
                NFT Allocations - Average by Tier<br>
                <small>Column & pie charts showing average NFT tokens per tier</small>
            </a>
            
            <a href="equal-vs-rarity-distribution.html" class="chart-link">
                NFT Allocations - Equal vs Rarity<br>
                <small>Comparison of equal and rarity-based NFT allocation methods</small>
            </a>
            
            <a href="user-allocation-distribution.html" class="chart-link">
                Historical & Aura - User Distribution<br>
                <small>Separate line charts for Historical & Aura allocations</small>
            </a>
            
            <a href="lorenz-curves-gini-coefficients.html" class="chart-link">
                Inequality Analysis - Lorenz Curves & Gini<br>
                <small>Wealth inequality analysis with Lorenz curves and Gini coefficients</small>
            </a>
            
            <a href="nft-allocation-detailed.html" class="chart-link">
                NFT Allocations - Detailed Analysis<br>
                <small>Per-user and per-NFT allocation charts with rarity tier breakdown</small>
            </a>
            
            <a href="correlation-matrix.html" class="chart-link">
                Correlation Matrices<br>
                <small>NFT, Aura, and Historical correlation analyses with key insights</small>
            </a>
        </div>

        <div class="timestamp">
            Generated on: ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(path.join(outputDir, 'index.html'), indexHTML);
    console.log('Generated: index.html');

    console.log(`\nAll charts generated successfully!`);
    console.log(`Output directory: ${outputDir}`);
    console.log(
      `Open ${path.join(outputDir, 'index.html')} in your browser to view the charts`,
    );
    console.log(`\nGenerated files:`);
    console.log(`   - index.html (main dashboard)`);
    console.log(`   - total-allocation-by-tier.html`);
    console.log(`   - average-allocation-by-tier.html`);
    console.log(`   - equal-vs-rarity-distribution.html`);
    console.log(`   - user-allocation-distribution.html`);
    console.log(`   - lorenz-curves-gini-coefficients.html`);
    console.log(`   - nft-allocation-detailed.html`);
    console.log(`   - correlation-matrix.html`);
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
