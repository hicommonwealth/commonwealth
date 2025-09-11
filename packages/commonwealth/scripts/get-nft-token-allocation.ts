import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { QueryTypes } from 'sequelize';
import { NFTTrait } from './get-nft-holder-snapshot';

////////////////// Configuration //////////////////

// Higher tier is better i.e. rarer.

// Define the percentiles to assign rarity tiers. Must always start at 100.
// Must always be in descending order - index of percentile is the assigned rarity_tier.
// Ex: [100, 10] -> NFTs would be classified into 2 tiers.
//  Tier 1: top 10% of NFTs by rarity value
//  Tier 0: rest of NFTs
const RarityPercentiles = [100, 75, 15, 6.5, 3.5];

// Define the ranks to assign rarity tiers.
// Ex: [300, 400] -> NFTs would be classified into 3 tiers.
//  Tier 2: ranks 1-300 (top 300)
//  Tier 1: ranks 301-700 (next 400)
//  Tier 0: ranks 701+ (remaining)
const RarityRanks = [1, 10];

// The weights used to calculate token allocation for each NFT based on its rarity tier derived from rank.
// MUST always have one more weight than the number of RarityRanks.
// NOTE: rarity_tier is used as the index for the weight so this should be in reverse order of RarityRanks.
// Ex: If RarityRanks = [1, 10] then suppose RarityTierWeightsByRank = [1, 5, 10]
//  Tier 2 (index 2): has a weight of 10
//  Tier 1 (index 1): has a weight of 5
//  Tier 0 (index 0): has a weight of 1
const RarityTierWeightsByRank = [1, 5, 10];

// The weights used to calculate token allocation for each NFT based on its rarity tier derived from percentile.
// MUST always be equal to the number of RarityPercentiles.
// Ex: If RarityPercentiles = [100, 75, 15, 6.5, 3.5] then suppose RarityTierWeightsByPercentile = [1, 5, 10, 20, 50]
//  Tier 4 (index 4): has a weight of 50
//  Tier 3 (index 3): has a weight of 20
//  Tier 2 (index 2): has a weight of 10
//  Tier 1 (index 1): has a weight of 5
//  Tier 0 (index 0): has a weight of 1
const RarityTierWeightsByPercentile = [1, 5, 10, 20, 50];

const TokenSupply = 10_000_000_000;
const EqualDistributionPercent = 0.6;
const RarityDistributionPercent = 0.4;

////////////////// End Configuration //////////////////

////////////////// Config Validation //////////////////

let highestPercentile = 100;
for (let i = 0; i < RarityPercentiles.length; i++) {
  if (RarityPercentiles[i] > highestPercentile) {
    throw new Error('Rarity tier is not in ascending order');
  }
  if (RarityPercentiles[i] === highestPercentile && highestPercentile !== 100) {
    throw new Error('Must have unique percentile thresholds');
  }
  highestPercentile = RarityPercentiles[i];
}

if (EqualDistributionPercent + RarityDistributionPercent !== 1) {
  throw new Error(
    'EqualDistributionPercent and RarityDistributionPercent must sum to 1',
  );
}

if (EqualDistributionPercent < 0 || EqualDistributionPercent > 1) {
  throw new Error('EqualDistributionPercent must be between 0 and 1');
}

if (RarityDistributionPercent < 0 || RarityDistributionPercent > 1) {
  throw new Error('RarityDistributionPercent must be between 0 and 1');
}

if (RarityTierWeightsByRank.length !== RarityRanks.length + 1) {
  throw new Error(
    'RarityTierWeightsByRank must have one more weight than RarityRanks',
  );
}

if (RarityTierWeightsByPercentile.length !== RarityPercentiles.length) {
  throw new Error(
    'RarityTierWeightsByPercentile must have one weight per RarityPercentiles',
  );
}

////////////////// End Config Validation //////////////////

const TraitRarityCache: Record<string, number> = {};

async function calculateTraitRarity(trait_type: string, trait_value: string) {
  if (TraitRarityCache[`${trait_type}-${trait_value}`]) {
    return TraitRarityCache[`${trait_type}-${trait_value}`];
  }

  console.log(`Calculating rarity for ${trait_type}: ${trait_value}`);

  const [{ count: numNFTsWithTrait }] = await models.sequelize.query<{
    count: number;
  }>(
    `
      SELECT COUNT(*) as count
      FROM nft_collection_data
      WHERE traits @> $1::jsonb;
    `,
    {
      type: QueryTypes.SELECT,
      bind: [JSON.stringify([{ trait_type, value: trait_value }])],
    },
  );

  console.log(
    `Number of NFTs with ${trait_type}-${trait_value}: ${numNFTsWithTrait}`,
  );

  const [{ count: numNFTs }] = await models.sequelize.query<{ count: number }>(
    `
      SELECT COUNT(*) as count
      FROM nft_collection_data
    `,
    {
      type: QueryTypes.SELECT,
    },
  );

  const rarity = numNFTs / numNFTsWithTrait;
  TraitRarityCache[`${trait_type}-${trait_value}`] = rarity;
  return rarity;
}

async function calculateNftRarity(tokenId: number) {
  const [{ traits }] = await models.sequelize.query<{ traits: NFTTrait[] }>(
    `
      SELECT traits
      FROM nft_collection_data
      WHERE token_id = ${tokenId};
    `,
    {
      type: QueryTypes.SELECT,
    },
  );

  const traitRarities = await Promise.all(
    traits.map((trait) =>
      calculateTraitRarity(trait.trait_type, trait.value as string),
    ),
  );
  const nftRarity = traitRarities.reduce((acc, curr) => acc + curr, 0);
  return nftRarity;
}

async function updateAllNftRarity() {
  console.log('Starting NFT rarity calculation for all tokens...');

  // Fetch all token IDs from the nft_collection_data table
  const tokenIds = await models.sequelize.query<{ token_id: number }>(
    `
      SELECT token_id
      FROM nft_collection_data
      ORDER BY token_id;
    `,
    {
      type: QueryTypes.SELECT,
    },
  );

  console.log(`Found ${tokenIds.length} tokens to process`);

  // Process tokens in batches to avoid overwhelming the database
  let processedCount = 0;

  for (const { token_id } of tokenIds) {
    const rarity = await calculateNftRarity(token_id);
    // Update the calculated_rarity column for this token
    await models.sequelize.query(
      `
        UPDATE nft_collection_data
        SET calculated_rarity = :rarity,
            updated_at        = NOW()
        WHERE token_id = :tokenId;
      `,
      {
        replacements: {
          rarity: Math.round(rarity * 100) / 100,
          tokenId: token_id,
        }, // Round to 2 decimal places
        type: QueryTypes.UPDATE,
      },
    );

    processedCount++;
  }

  console.log(
    `✅ NFT rarity calculation completed! Processed ${processedCount}/${tokenIds.length} tokens successfully.`,
  );
}

async function assignRarityTierByPercentile() {
  console.log('Starting rarity tier assignment...');

  // Fetch all NFTs with their calculated rarity, ordered by rarity (highest first)
  const nfts = await models.sequelize.query<{
    token_id: number;
    calculated_rarity: number;
  }>(
    `
      SELECT token_id, calculated_rarity
      FROM nft_collection_data
      WHERE calculated_rarity IS NOT NULL
      ORDER BY calculated_rarity DESC, token_id;
    `,
    {
      type: QueryTypes.SELECT,
    },
  );

  console.log(`Found ${nfts.length} NFTs with calculated rarity`);

  if (nfts.length === 0) {
    console.log(
      'No NFTs found with calculated rarity. Run updateAllNftRarity first.',
    );
    return;
  }

  // Calculate percentile thresholds
  const totalNfts = nfts.length;
  const thresholds = RarityPercentiles.map((percentile) => {
    const index = Math.floor((percentile / 100) * totalNfts);
    return index < totalNfts ? nfts[index].calculated_rarity : 0;
  });

  // Assign rarity tiers
  let processedCount = 0;
  const tierCounts = Array(RarityPercentiles.length).fill(0);

  for (const nft of nfts) {
    let rarityTier = 0; // Default to lowest tier

    // Find the appropriate tier based on calculated_rarity
    for (let i = 0; i < RarityPercentiles.length; i++) {
      if (nft.calculated_rarity < thresholds[i]) {
        break;
      }
      rarityTier = i;
    }

    tierCounts[rarityTier]++;

    // Update the rarity_tier in the database
    await models.sequelize.query(
      `
        UPDATE nft_collection_data
        SET rarity_tier = :rarityTier,
            updated_at  = NOW()
        WHERE token_id = :tokenId;
      `,
      {
        replacements: {
          rarityTier,
          tokenId: nft.token_id,
        },
        type: QueryTypes.UPDATE,
      },
    );

    processedCount++;

    // Log progress every 1000 tokens
    if (processedCount % 1000 === 0) {
      console.log(`Processed ${processedCount}/${totalNfts} tokens...`);
    }
  }

  console.log(
    '\n\nPercentile thresholds (Percentile %: Rarity Value):',
    thresholds
      .map((threshold, i) => `Top ${RarityPercentiles[i]}%: ${threshold}`)
      .join(', '),
  );

  console.log('\nRarity tier distribution:');
  tierCounts.forEach((count, tier) => {
    const percentage = ((count / totalNfts) * 100).toFixed(2);
    console.log(`Tier ${tier}: ${count} NFTs (${percentage}%)`);
  });

  console.log(
    `✅ Rarity tier assignment completed! Processed ${processedCount}/${totalNfts} tokens successfully.`,
  );
}

async function assignRarityTierByRank() {
  console.log('Starting rarity tier assignment by rank...');

  // Fetch all NFTs with their calculated rarity, ordered by rarity (highest first)
  const nfts = await models.sequelize.query<{
    token_id: number;
    calculated_rarity: number;
  }>(
    `
      SELECT token_id, calculated_rarity
      FROM nft_collection_data
      WHERE calculated_rarity IS NOT NULL
      ORDER BY calculated_rarity DESC, token_id;
    `,
    {
      type: QueryTypes.SELECT,
    },
  );

  console.log(`Found ${nfts.length} NFTs with calculated rarity`);

  if (nfts.length === 0) {
    console.log(
      'No NFTs found with calculated rarity. Run updateAllNftRarity first.',
    );
    return;
  }

  // Calculate rank thresholds based on cumulative counts
  const cumulativeThresholds = [0]; // Start with 0
  let cumulative = 0;
  for (const rank of RarityRanks) {
    cumulative += rank;
    cumulativeThresholds.push(cumulative);
  }

  // Build tier descriptions for logging
  const tierDescriptions: string[] = [];
  for (let i = 0; i < RarityRanks.length; i++) {
    const tierNumber = RarityRanks.length - i;
    const startRank = cumulativeThresholds[i] + 1;
    const endRank = cumulativeThresholds[i + 1];

    if (i === 0) {
      tierDescriptions.push(
        `Tier ${tierNumber}: Ranks 1-${endRank} (Top ${RarityRanks[i]} NFTs)`,
      );
    } else {
      tierDescriptions.push(
        `Tier ${tierNumber}: Ranks ${startRank}-${endRank} (Next ${RarityRanks[i]} NFTs)`,
      );
    }
  }
  tierDescriptions.push(
    `Tier 0: Ranks ${cumulativeThresholds[cumulativeThresholds.length - 1] + 1}+ (Remaining NFTs)`,
  );

  // Assign rarity tiers
  let processedCount = 0;
  const tierCounts = Array(RarityRanks.length + 1).fill(0); // +1 for tier 0

  for (let index = 0; index < nfts.length; index++) {
    const nft = nfts[index];
    let rarityTier = 0; // Default to lowest tier (tier 0)
    const currentRank = index + 1; // Convert 0-based index to 1-based rank

    // Find the appropriate tier based on rank position
    // Higher tier numbers are for rarer NFTs (lower rank numbers)
    for (let i = 0; i < RarityRanks.length; i++) {
      if (currentRank <= cumulativeThresholds[i + 1]) {
        rarityTier = RarityRanks.length - i;
        break;
      }
    }

    tierCounts[rarityTier]++;

    // Update the rarity_tier in the database
    await models.sequelize.query(
      `
        UPDATE nft_collection_data
        SET rarity_tier = :rarityTier,
            updated_at  = NOW()
        WHERE token_id = :tokenId;
      `,
      {
        replacements: {
          rarityTier,
          tokenId: nft.token_id,
        },
        type: QueryTypes.UPDATE,
      },
    );

    processedCount++;

    // Log progress every 1000 tokens
    if (processedCount % 1000 === 0) {
      console.log(`Processed ${processedCount}/${nfts.length} tokens...`);
    }
  }

  console.log('\n\nRank-based tier assignment:', tierDescriptions.join(', '));
  console.log('\nRarity tier distribution:');
  tierCounts.forEach((count, tier) => {
    const percentage = ((count / nfts.length) * 100).toFixed(2);
    console.log(`Tier ${tier}: ${count} NFTs (${percentage}%)`);
  });

  console.log(
    `✅ Rarity tier assignment by rank completed! Processed ${processedCount}/${nfts.length} tokens successfully.`,
  );
}

async function calculateEqualDistributionAllocations() {
  console.log('Starting equal distribution allocation calculation...');

  // Fetch all NFTs with their calculated rarity, ordered by rarity (highest first) for remainder distribution
  const nfts = await models.sequelize.query<{
    token_id: number;
    calculated_rarity: number;
  }>(
    `
      SELECT token_id, calculated_rarity
      FROM nft_collection_data
      WHERE calculated_rarity IS NOT NULL
      ORDER BY calculated_rarity DESC, token_id;
    `,
    {
      type: QueryTypes.SELECT,
    },
  );

  console.log(`Found ${nfts.length} NFTs for equal distribution`);

  if (nfts.length === 0) {
    console.log(
      'No NFTs found with calculated rarity. Run updateAllNftRarity first.',
    );
    return;
  }

  // Calculate total tokens for equal distribution
  const totalEqualDistributionTokens = Math.floor(
    TokenSupply * EqualDistributionPercent,
  );

  // Calculate base allocation per NFT (whole number)
  const baseAllocation = Math.floor(totalEqualDistributionTokens / nfts.length);
  const remainder = totalEqualDistributionTokens - baseAllocation * nfts.length;

  // Assign allocations
  let processedCount = 0;
  let totalAllocated = 0;

  for (let index = 0; index < nfts.length; index++) {
    const nft = nfts[index];
    // Each NFT gets base allocation, plus 1 extra token if within remainder range
    // Remainder is distributed to highest rarity NFTs first (already sorted by rarity DESC)
    const allocation = baseAllocation + (index < remainder ? 1 : 0);
    totalAllocated += allocation;

    // Update the equal_distribution_allocation column in the database
    await models.sequelize.query(
      `
        UPDATE nft_collection_data
        SET equal_distribution_allocation = :allocation,
            updated_at                    = NOW()
        WHERE token_id = :tokenId;
      `,
      {
        replacements: {
          allocation,
          tokenId: nft.token_id,
        },
        type: QueryTypes.UPDATE,
      },
    );

    processedCount++;

    // Log progress every 1000 tokens
    if (processedCount % 1000 === 0) {
      console.log(`Processed ${processedCount}/${nfts.length} tokens...`);
    }
  }

  if (totalAllocated !== totalEqualDistributionTokens) {
    throw new Error('Failed to allocate all tokens');
  }

  // Verify total allocation
  console.log(`\nAllocation Summary:`);
  console.log(`- Total tokens allocated: ${totalAllocated.toLocaleString()}`);
  console.log(`- Base allocation: ${baseAllocation.toLocaleString()}`);
  console.log(
    `- NFTs receiving base allocation: ${(nfts.length - remainder).toLocaleString()}`,
  );
  console.log(`- NFTs receiving base + 1: ${remainder.toLocaleString()}`);

  console.log(
    `✅ Equal distribution allocation completed! Processed ${processedCount}/${nfts.length} tokens successfully.`,
  );
}

async function calculateRarityDistributionAllocation(
  tierAssignmentType: 'r' | 'p',
) {
  console.log('Starting rarity distribution allocation calculation...');

  // Fetch all NFTs with their calculated rarity and rarity tier
  const nfts = await models.sequelize.query<{
    token_id: number;
    calculated_rarity: number;
    rarity_tier: number;
  }>(
    `
      SELECT token_id, calculated_rarity, rarity_tier
      FROM nft_collection_data
      WHERE calculated_rarity IS NOT NULL AND rarity_tier IS NOT NULL
      ORDER BY calculated_rarity DESC, token_id ASC;
    `,
    {
      type: QueryTypes.SELECT,
    },
  );

  console.log(`Found ${nfts.length} NFTs for rarity distribution`);

  if (nfts.length === 0) {
    console.log(
      'No NFTs found with calculated rarity and rarity tier. Run updateAllNftRarity and tier assignment first.',
    );
    return;
  }

  // Select the appropriate weight array based on tier assignment type
  const weights =
    tierAssignmentType === 'r'
      ? RarityTierWeightsByRank
      : RarityTierWeightsByPercentile;

  // Calculate the sum of all weights
  let totalWeightSum = 0;
  const nftWeights: {
    token_id: number;
    weight: number;
    calculated_rarity: number;
  }[] = [];

  for (const nft of nfts) {
    const weight = weights[nft.rarity_tier] || 0;
    totalWeightSum += weight;
    nftWeights.push({
      token_id: nft.token_id,
      weight,
      calculated_rarity: nft.calculated_rarity,
    });
  }

  if (totalWeightSum === 0) {
    console.log('Total weight sum is 0. No tokens will be allocated.');
    return;
  }

  // Calculate total tokens for rarity distribution
  const totalRarityDistributionTokens = Math.floor(
    TokenSupply * RarityDistributionPercent,
  );

  // Calculate allocations for each NFT based on weight percentage
  let processedCount = 0;
  let totalAllocated = 0;
  const allocations: {
    token_id: number;
    allocation: number;
    calculated_rarity: number;
  }[] = [];

  for (const nftWeight of nftWeights) {
    // Calculate percentage of total weights this NFT has
    const weightPercentage = nftWeight.weight / totalWeightSum;

    // Calculate allocation (floor to ensure whole numbers)
    const allocation = Math.floor(
      totalRarityDistributionTokens * weightPercentage,
    );
    totalAllocated += allocation;

    allocations.push({
      token_id: nftWeight.token_id,
      allocation,
      calculated_rarity: nftWeight.calculated_rarity,
    });
  }

  // Calculate remainder tokens that need to be distributed
  const remainder = totalRarityDistributionTokens - totalAllocated;

  // Sort allocations by calculated_rarity DESC, token_id ASC for remainder distribution
  allocations.sort((a, b) => {
    if (a.calculated_rarity !== b.calculated_rarity) {
      return b.calculated_rarity - a.calculated_rarity; // DESC
    }
    return a.token_id - b.token_id; // ASC
  });

  // Distribute remainder tokens one by one to highest rarity NFTs first
  for (let i = 0; i < remainder && i < allocations.length; i++) {
    allocations[i].allocation += 1;
    totalAllocated += 1;
  }

  // Update the database with allocations
  processedCount = 0;
  for (const allocation of allocations) {
    await models.sequelize.query(
      `
        UPDATE nft_collection_data
        SET rarity_distribution_allocation = :allocation,
            updated_at                     = NOW()
        WHERE token_id = :tokenId;
      `,
      {
        replacements: {
          allocation: allocation.allocation,
          tokenId: allocation.token_id,
        },
        type: QueryTypes.UPDATE,
      },
    );

    processedCount++;

    // Log progress every 1000 tokens
    if (processedCount % 1000 === 0) {
      console.log(
        `Processed ${processedCount}/${allocations.length} tokens...`,
      );
    }
  }

  if (totalAllocated !== totalRarityDistributionTokens) {
    throw new Error(
      `Failed to allocate all tokens. Expected: ${totalRarityDistributionTokens}, Actual: ${totalAllocated}`,
    );
  }

  // Calculate tier distribution summary
  const tierSummary: {
    [tier: number]: { count: number; totalAllocation: number };
  } = {};
  for (const allocation of allocations) {
    const nft = nfts.find((n) => n.token_id === allocation.token_id);
    if (nft) {
      const tier = nft.rarity_tier;
      if (!tierSummary[tier]) {
        tierSummary[tier] = { count: 0, totalAllocation: 0 };
      }
      tierSummary[tier].count += 1;
      tierSummary[tier].totalAllocation += allocation.allocation;
    }
  }

  // Verify total allocation
  console.log(`\nRarity Distribution Allocation Summary:`);
  console.log(`- Total tokens allocated: ${totalAllocated.toLocaleString()}`);
  console.log(`- Total weight sum: ${totalWeightSum.toLocaleString()}`);
  console.log(`- Remainder tokens distributed: ${remainder.toLocaleString()}`);

  console.log('\nAllocation by tier:');
  Object.keys(tierSummary)
    .map(Number)
    .sort((a, b) => b - a) // Sort by tier DESC (highest tier first)
    .forEach((tier) => {
      const summary = tierSummary[tier];
      const avgAllocation = (summary.totalAllocation / summary.count).toFixed(
        2,
      );
      console.log(
        `Tier ${tier}: ${summary.count} NFTs, ${summary.totalAllocation.toLocaleString()} tokens (avg: ${avgAllocation})`,
      );
    });

  console.log(
    `✅ Rarity distribution allocation completed! Processed ${processedCount}/${allocations.length} tokens successfully.`,
  );
}

// Parse command line arguments
function parseArguments(): { tierAssignmentType: 'r' | 'p' } {
  const args = process.argv.slice(2);
  let tierAssignmentType: 'r' | 'p' = 'p'; // Default to percentile

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-t' && i + 1 < args.length) {
      const type = args[i + 1];
      if (type === 'r' || type === 'p') {
        tierAssignmentType = type as 'r' | 'p';
      } else {
        throw new Error(
          'Invalid argument for -t. Use "r" for rank-based or "p" for percentile-based assignment.',
        );
      }
      break;
    }
  }

  return { tierAssignmentType };
}

async function main() {
  const { tierAssignmentType } = parseArguments();

  console.log(
    `Using ${tierAssignmentType === 'r' ? 'rank-based' : 'percentile-based'} tier assignment`,
  );

  await updateAllNftRarity();

  if (tierAssignmentType === 'r') {
    await assignRarityTierByRank();
  } else {
    await assignRarityTierByPercentile();
  }

  console.log('\n');
  await calculateEqualDistributionAllocations();

  console.log('\n');
  await calculateRarityDistributionAllocation(tierAssignmentType);
}

main()
  .then(() => {
    // eslint-disable-next-line n/no-process-exit
    dispose()('EXIT', true);
  })
  .catch((error) => {
    console.error('Error in main execution:', error);
    // eslint-disable-next-line n/no-process-exit
    dispose()('ERROR', true);
  });
