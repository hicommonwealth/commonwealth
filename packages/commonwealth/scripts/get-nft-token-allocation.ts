import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { UserTierMap } from '@hicommonwealth/shared';
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

const UserTierWeightsMap: Record<UserTierMap, number> = {
  [UserTierMap.IncompleteUser]: 0,
  [UserTierMap.BannedUser]: 0,
  [UserTierMap.NewlyVerifiedWallet]: 1,
  [UserTierMap.VerifiedWallet]: 1,
  [UserTierMap.SocialVerified]: 2,
  [UserTierMap.ChainVerified]: 2,
  [UserTierMap.FullyVerified]: 3,
  [UserTierMap.ManuallyVerified]: 3,
  [UserTierMap.SystemUser]: 0,
};

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
  console.log('Starting tier-weighted distribution allocation calculation...');

  // Fetch all NFTs with their calculated rarity and user tier
  const nfts = await models.sequelize.query<{
    token_id: number;
    calculated_rarity: number;
    user_tier: number | null;
  }>(
    `
      SELECT token_id, calculated_rarity, user_tier
      FROM nft_collection_data
      WHERE calculated_rarity IS NOT NULL
      ORDER BY calculated_rarity DESC, token_id;
    `,
    {
      type: QueryTypes.SELECT,
    },
  );

  console.log(`Found ${nfts.length} NFTs for tier-weighted distribution`);

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

  // Calculate the sum of all weights
  let totalWeightSum = 0;
  const nftWeights: {
    token_id: number;
    weight: number;
    calculated_rarity: number;
  }[] = [];

  for (const nft of nfts) {
    // Get user tier weight, default to IncompleteUser (0) if no user_tier
    const userTier = nft.user_tier ?? UserTierMap.IncompleteUser;
    const weight = UserTierWeightsMap[userTier as UserTierMap] || 0;
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
      totalEqualDistributionTokens * weightPercentage,
    );
    totalAllocated += allocation;

    allocations.push({
      token_id: nftWeight.token_id,
      allocation,
      calculated_rarity: nftWeight.calculated_rarity,
    });
  }

  // Calculate remainder tokens that need to be distributed
  const remainder = totalEqualDistributionTokens - totalAllocated;

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
        SET equal_distribution_allocation = :allocation,
            updated_at                    = NOW()
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

  if (totalAllocated !== totalEqualDistributionTokens) {
    throw new Error(
      `Failed to allocate all tokens. Expected: ${totalEqualDistributionTokens}, Actual: ${totalAllocated}`,
    );
  }

  // Calculate tier distribution summary
  const tierSummary: {
    [tier: number]: { count: number; totalAllocation: number };
  } = {};
  for (const allocation of allocations) {
    const nft = nfts.find((n) => n.token_id === allocation.token_id);
    if (nft) {
      const tier = nft.user_tier ?? UserTierMap.IncompleteUser;
      if (!tierSummary[tier]) {
        tierSummary[tier] = { count: 0, totalAllocation: 0 };
      }
      tierSummary[tier].count += 1;
      tierSummary[tier].totalAllocation += allocation.allocation;
    }
  }

  // Verify total allocation
  console.log(`\nTier-Weighted Distribution Allocation Summary:`);
  console.log(`- Total tokens allocated: ${totalAllocated.toLocaleString()}`);
  console.log(`- Total weight sum: ${totalWeightSum.toLocaleString()}`);
  console.log(`- Remainder tokens distributed: ${remainder.toLocaleString()}`);

  console.log('\nAllocation by user tier:');
  Object.keys(tierSummary)
    .map(Number)
    .sort((a, b) => b - a) // Sort by tier DESC (highest tier first)
    .forEach((tier) => {
      const summary = tierSummary[tier];
      const avgAllocation = (summary.totalAllocation / summary.count).toFixed(
        2,
      );
      const tierWeight = UserTierWeightsMap[tier as UserTierMap] || 0;
      console.log(
        `Tier ${tier} (weight: ${tierWeight}): ${summary.count} NFTs, ${summary.totalAllocation.toLocaleString()} tokens (avg: ${avgAllocation})`,
      );
    });

  console.log(
    `✅ Tier-weighted distribution allocation completed! Processed ${processedCount}/${allocations.length} tokens successfully.`,
  );
}

async function calculateRarityDistributionAllocation(
  tierAssignmentType: 'r' | 'p',
) {
  console.log(
    'Starting combined rarity and user tier distribution allocation calculation...',
  );

  // Fetch all NFTs with their calculated rarity, rarity tier, and user tier
  const nfts = await models.sequelize.query<{
    token_id: number;
    calculated_rarity: number;
    rarity_tier: number;
    user_tier: number | null;
  }>(
    `
      SELECT token_id, calculated_rarity, rarity_tier, user_tier
      FROM nft_collection_data
      WHERE calculated_rarity IS NOT NULL AND rarity_tier IS NOT NULL
      ORDER BY calculated_rarity DESC, token_id ASC;
    `,
    {
      type: QueryTypes.SELECT,
    },
  );

  console.log(
    `Found ${nfts.length} NFTs for combined rarity and user tier distribution`,
  );

  if (nfts.length === 0) {
    console.log(
      'No NFTs found with calculated rarity and rarity tier. Run updateAllNftRarity and tier assignment first.',
    );
    return;
  }

  // Select the appropriate rarity weight array based on tier assignment type
  const rarityWeights =
    tierAssignmentType === 'r'
      ? RarityTierWeightsByRank
      : RarityTierWeightsByPercentile;

  // Calculate the sum of all combined weights (rarity weight * user tier weight)
  let totalWeightSum = 0;
  const nftWeights: {
    token_id: number;
    weight: number;
    calculated_rarity: number;
    rarity_weight: number;
    user_tier_weight: number;
  }[] = [];

  for (const nft of nfts) {
    const rarityWeight = rarityWeights[nft.rarity_tier] || 0;
    const userTier = nft.user_tier ?? UserTierMap.IncompleteUser;
    const userTierWeight = UserTierWeightsMap[userTier as UserTierMap] || 0;

    // Combined weight is the product of rarity weight and user tier weight
    // This gives higher allocations to both rare NFTs AND higher tier users
    const combinedWeight = rarityWeight * userTierWeight; // Use minimum 0.1 to avoid zero weights

    totalWeightSum += combinedWeight;
    nftWeights.push({
      token_id: nft.token_id,
      weight: combinedWeight,
      calculated_rarity: nft.calculated_rarity,
      rarity_weight: rarityWeight,
      user_tier_weight: userTierWeight,
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

  // Calculate allocations for each NFT based on combined weight percentage
  let processedCount = 0;
  let totalAllocated = 0;
  const allocations: {
    token_id: number;
    allocation: number;
    calculated_rarity: number;
    rarity_weight: number;
    user_tier_weight: number;
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
      rarity_weight: nftWeight.rarity_weight,
      user_tier_weight: nftWeight.user_tier_weight,
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

  // Calculate rarity tier distribution summary
  const rarityTierSummary: {
    [tier: number]: { count: number; totalAllocation: number };
  } = {};

  // Calculate user tier distribution summary
  const userTierSummary: {
    [tier: number]: { count: number; totalAllocation: number };
  } = {};

  for (const allocation of allocations) {
    const nft = nfts.find((n) => n.token_id === allocation.token_id);
    if (nft) {
      // Rarity tier summary
      const rarityTier = nft.rarity_tier;
      if (!rarityTierSummary[rarityTier]) {
        rarityTierSummary[rarityTier] = { count: 0, totalAllocation: 0 };
      }
      rarityTierSummary[rarityTier].count += 1;
      rarityTierSummary[rarityTier].totalAllocation += allocation.allocation;

      // User tier summary
      const userTier = nft.user_tier ?? UserTierMap.IncompleteUser;
      if (!userTierSummary[userTier]) {
        userTierSummary[userTier] = { count: 0, totalAllocation: 0 };
      }
      userTierSummary[userTier].count += 1;
      userTierSummary[userTier].totalAllocation += allocation.allocation;
    }
  }

  // Verify total allocation
  console.log(
    `\nCombined Rarity and User Tier Distribution Allocation Summary:`,
  );
  console.log(`- Total tokens allocated: ${totalAllocated.toLocaleString()}`);
  console.log(
    `- Total combined weight sum: ${totalWeightSum.toLocaleString()}`,
  );
  console.log(`- Remainder tokens distributed: ${remainder.toLocaleString()}`);

  console.log('\nAllocation by rarity tier:');
  Object.keys(rarityTierSummary)
    .map(Number)
    .sort((a, b) => b - a) // Sort by tier DESC (highest tier first)
    .forEach((tier) => {
      const summary = rarityTierSummary[tier];
      const avgAllocation = (summary.totalAllocation / summary.count).toFixed(
        2,
      );
      const rarityWeight =
        tierAssignmentType === 'r'
          ? RarityTierWeightsByRank[tier] || 0
          : RarityTierWeightsByPercentile[tier] || 0;
      console.log(
        `Rarity Tier ${tier} (weight: ${rarityWeight}): ${summary.count} NFTs, ${summary.totalAllocation.toLocaleString()} tokens (avg: ${avgAllocation})`,
      );
    });

  console.log('\nAllocation by user tier:');
  Object.keys(userTierSummary)
    .map(Number)
    .sort((a, b) => b - a) // Sort by tier DESC (highest tier first)
    .forEach((tier) => {
      const summary = userTierSummary[tier];
      const avgAllocation = (summary.totalAllocation / summary.count).toFixed(
        2,
      );
      const userTierWeight = UserTierWeightsMap[tier as UserTierMap] || 0;
      console.log(
        `User Tier ${tier} (weight: ${userTierWeight}): ${summary.count} NFTs, ${summary.totalAllocation.toLocaleString()} tokens (avg: ${avgAllocation})`,
      );
    });

  console.log(
    `✅ Combined rarity and user tier distribution allocation completed! Processed ${processedCount}/${allocations.length} tokens successfully.`,
  );
}

async function resolveUsers() {
  console.log('Starting user resolution for NFT holders...');

  // Update user_id and user_tier by joining with Addresses and Users tables
  const updateQuery = `
    UPDATE nft_collection_data 
    SET 
      user_id = u.id,
      user_tier = u.tier,
      updated_at = NOW()
    FROM "Addresses" a
    INNER JOIN "Users" u ON a.user_id = u.id
    WHERE LOWER(nft_collection_data.holder_address) = LOWER(a.address)
      AND (nft_collection_data.user_id IS NULL OR nft_collection_data.user_tier IS NULL);
  `;

  try {
    const [, updatedRows] = await models.sequelize.query(updateQuery, {
      type: QueryTypes.UPDATE,
    });

    console.log(`✅ Updated ${updatedRows} NFT records with user information`);

    // If in testing mode, assign random tiers to NFTs without resolved users
    if (process.env.TESTING === 'true') {
      console.log(
        '🧪 Testing mode detected - assigning random user tiers to unresolved NFTs...',
      );

      // Get all valid user tier values (excluding SystemUser for testing)
      const validTiers = [
        UserTierMap.NewlyVerifiedWallet,
        UserTierMap.VerifiedWallet,
        UserTierMap.SocialVerified,
        UserTierMap.ChainVerified,
        UserTierMap.ManuallyVerified,
      ];

      // Get all NFTs that don't have user tiers assigned
      const nftsWithoutTiers = await models.sequelize.query<{
        token_id: number;
      }>(
        `
          SELECT token_id
          FROM nft_collection_data
          WHERE user_tier IS NULL;
        `,
        {
          type: QueryTypes.SELECT,
        },
      );

      console.log(
        `Found ${nftsWithoutTiers.length} NFTs without user tiers for random assignment`,
      );

      // Assign random tiers
      let randomAssignmentCount = 0;
      for (const nft of nftsWithoutTiers) {
        const randomTier =
          validTiers[Math.floor(Math.random() * validTiers.length)];

        await models.sequelize.query(
          `
            UPDATE nft_collection_data
            SET user_tier = :tier,
                updated_at = NOW()
            WHERE token_id = :tokenId;
          `,
          {
            replacements: {
              tier: randomTier,
              tokenId: nft.token_id,
            },
            type: QueryTypes.UPDATE,
          },
        );

        randomAssignmentCount++;

        // Log progress every 1000 tokens
        if (randomAssignmentCount % 1000 === 0) {
          console.log(
            `Assigned random tiers to ${randomAssignmentCount}/${nftsWithoutTiers.length} NFTs...`,
          );
        }
      }

      console.log(
        `✅ Assigned random user tiers to ${randomAssignmentCount} NFTs for testing`,
      );
    }

    // Get summary statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_nfts,
        COUNT(user_id) as nfts_with_users,
        COUNT(*) - COUNT(user_id) as nfts_without_users,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT user_tier) as unique_tiers
      FROM nft_collection_data;
    `;

    const [stats] = await models.sequelize.query<{
      total_nfts: number;
      nfts_with_users: number;
      nfts_without_users: number;
      unique_users: number;
      unique_tiers: number;
    }>(statsQuery, {
      type: QueryTypes.SELECT,
    });

    console.log('\n📊 User Resolution Summary:');
    console.log(`- Total NFTs: ${stats.total_nfts.toLocaleString()}`);
    console.log(
      `- NFTs with resolved users: ${stats.nfts_with_users.toLocaleString()}`,
    );
    console.log(
      `- NFTs without users: ${stats.nfts_without_users.toLocaleString()}`,
    );
    console.log(`- Unique users: ${stats.unique_users.toLocaleString()}`);
    console.log(`- Unique user tiers: ${stats.unique_tiers.toLocaleString()}`);

    // Show tier distribution for resolved users
    const tierDistributionQuery = `
      SELECT 
        user_tier,
        COUNT(*) as nft_count,
        COUNT(DISTINCT user_id) as user_count
      FROM nft_collection_data 
      WHERE user_id IS NOT NULL
      GROUP BY user_tier
      ORDER BY user_tier;
    `;

    const tierStats = await models.sequelize.query<{
      user_tier: number;
      nft_count: number;
      user_count: number;
    }>(tierDistributionQuery, {
      type: QueryTypes.SELECT,
    });

    if (tierStats.length > 0) {
      console.log('\n📈 User Tier Distribution:');
      tierStats.forEach((tier) => {
        console.log(
          `Tier ${tier.user_tier}: ${tier.nft_count.toLocaleString()} NFTs from ${tier.user_count.toLocaleString()} users`,
        );
      });
    }
  } catch (error) {
    console.error('Error resolving users:', error);
    throw error;
  }
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
  await resolveUsers();

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
