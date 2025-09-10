import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { QueryTypes } from 'sequelize';
import { NFTTrait } from './get-nft-holder-snapshot';

const RarityTier = [3.5, 6.5, 15, 75];

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
      logging: console.log,
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

async function assignRarityTier() {
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
  const thresholds = RarityTier.map((percentile) => {
    const index = Math.floor((percentile / 100) * totalNfts);
    return index < totalNfts ? nfts[index].calculated_rarity : 0;
  });

  console.log(
    'Percentile thresholds:',
    thresholds
      .map((threshold, i) => `Top ${RarityTier[i]}%: ${threshold}`)
      .join(', '),
  );

  // Assign rarity tiers
  let processedCount = 0;
  const tierCounts = [0, 0, 0, 0, 0]; // Count for tiers 0-4

  for (const nft of nfts) {
    let rarityTier = 4; // Default to lowest tier (tier 4)

    // Find the appropriate tier based on calculated_rarity
    for (let i = 0; i < RarityTier.length; i++) {
      if (nft.calculated_rarity >= thresholds[i]) {
        rarityTier = i;
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
      console.log(`Processed ${processedCount}/${totalNfts} tokens...`);
    }
  }

  console.log('Rarity tier distribution:');
  tierCounts.forEach((count, tier) => {
    const percentage = ((count / totalNfts) * 100).toFixed(2);
    console.log(`Tier ${tier}: ${count} NFTs (${percentage}%)`);
  });

  console.log(
    `✅ Rarity tier assignment completed! Processed ${processedCount}/${totalNfts} tokens successfully.`,
  );
}

async function main() {
  await updateAllNftRarity();
  await assignRarityTier();
}

main()
  .then(() => {
    console.log('Success');
    // eslint-disable-next-line n/no-process-exit
    dispose()('EXIT', true);
  })
  .catch((error) => {
    console.error('Error in main execution:', error);
    // eslint-disable-next-line n/no-process-exit
    dispose()('ERROR', true);
  });
