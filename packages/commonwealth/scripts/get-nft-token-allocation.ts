import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { QueryTypes } from 'sequelize';
import { NFTTrait } from './get-nft-holder-snapshot';

////////////////// Rarity Tier Definitions //////////////////

// Higher tier is better i.e. rarer.

// Define the percentiles to assign rarity tiers. Must always start at 100.
// Ex: [100, 10] -> NFTs would be classified into 2 tiers.
//  The top 10% of NFTs by rarity value would be tier 1 and the rest would be tier 0.
// Must always be in descending order - index of percentile is the assigned rarity_tier.
const RarityPercentiles = [100, 75, 15, 6.5, 3.5];
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

// Define the ranks to assign rarity tiers.
// Ex: [300, 400] -> NFTs would be classified into 3 tiers.
//  Tier 2: ranks 1-300 (top 300)
//  Tier 1: ranks 301-700 (next 400)
//  Tier 0: ranks 701+ (remaining)
const RarityRanks = [1, 10];

////////////////// End Rarity Tier Definitions //////////////////

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
      ORDER BY calculated_rarity DESC;
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
            updated_at = NOW()
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
      ORDER BY calculated_rarity DESC;
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
  let cumulativeThresholds = [0]; // Start with 0
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
            updated_at = NOW()
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

// Parse command line arguments
function parseArguments() {
  const args = process.argv.slice(2);
  let tierAssignmentType = 'p'; // Default to percentile

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-t' && i + 1 < args.length) {
      const type = args[i + 1];
      if (type === 'r' || type === 'p') {
        tierAssignmentType = type;
      } else {
        console.error(
          'Invalid argument for -t. Use "r" for rank-based or "p" for percentile-based assignment.',
        );
        process.exit(1);
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
