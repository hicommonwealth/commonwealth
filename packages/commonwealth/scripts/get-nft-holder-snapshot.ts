import { models } from '@hicommonwealth/model/db';
import fetch from 'node-fetch';
import { QueryTypes } from 'sequelize';

// Configuration
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY;
const COLLECTION_SLUG = 'pudgypenguins';
const CHAIN = 'ethereum';
const DELAY_MS = 500; // Delay between API calls to respect rate limits
const TESTING_NFT_COUNT = 21;

// Types
interface NFTAsset {
  identifier: string;
  collection: string;
  contract: string;
  token_standard: string;
  name: string;
  description: string;
  image_url: string;
  display_image_url: string;
  display_animation_url: string | null;
  metadata_url: string;
  opensea_url: string;
  updated_at: string;
  is_disabled: boolean;
  is_nsfw: boolean;
}

interface NFTOwnership {
  address: string;
  quantity: number;
}

export interface NFTTrait {
  trait_type: string;
  display_type: string | null;
  max_value: string | null;
  value: string | number | null;
}

interface NFTDetails {
  nft: NFTAsset & {
    owners: NFTOwnership[];
    traits: NFTTrait[];
    rarity: {
      strategy_id: string;
      strategy_version: string;
      rank: number;
      score?: number;
      calculated_rank?: string | null;
      max_rank?: number;
      total_supply?: number;
      ranking_features?: Record<string, number> | null;
    };
  };
}

interface NFTCollectionRow {
  token_id: string;
  name: string;
  holder_address: string;
  opensea_url: string;
  traits: NFTTrait[]; // Keep as object for JSONB insertion
  rarity: {
    strategy_id: string;
    strategy_version: string;
    rank: number;
    score?: number;
    calculated_rank?: string | null;
    max_rank?: number;
    total_supply?: number;
    ranking_features?: Record<string, number> | null;
  }; // Keep as object for JSONB insertion
}

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Create the nft_collection_data table if it doesn't exist
async function createNFTCollectionTable(): Promise<void> {
  console.log("Creating nft_collection_data table if it doesn't exist...");

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS nft_collection_data
    (
      token_id       INTEGER NOT NULL PRIMARY KEY,
      user_id        INTEGER,
      user_tier      INTEGER,
      name           VARCHAR(500),
      holder_address VARCHAR(42)  NOT NULL,
      opensea_url    TEXT,
      traits         JSONB NOT NULL,
      opensea_rarity         JSONB,
      calculated_rarity INTEGER,
      rarity_tier INTEGER,
      equal_distribution_allocation NUMERIC,
      rarity_distribution_allocation NUMERIC,
      total_token_allocation NUMERIC,
      created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

  -- Trigger function to update total_token_allocation
  CREATE OR REPLACE FUNCTION update_total_token_allocation()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.total_token_allocation := 
      COALESCE(NEW.equal_distribution_allocation, 0) + 
      COALESCE(NEW.rarity_distribution_allocation, 0);
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Drop the trigger if it already exists to avoid duplication
  DROP TRIGGER IF EXISTS trg_update_total_token_allocation ON nft_collection_data;

  -- Create the trigger to fire BEFORE INSERT OR UPDATE
  CREATE TRIGGER trg_update_total_token_allocation
  BEFORE INSERT OR UPDATE OF equal_distribution_allocation, rarity_distribution_allocation
  ON nft_collection_data
  FOR EACH ROW
  EXECUTE FUNCTION update_total_token_allocation();
  `;

  try {
    await models.sequelize.query(createTableQuery);
    console.log('✅ nft_collection_data table created/verified successfully');
  } catch (error) {
    console.error('Error creating nft_collection_data table:', error);
    throw error;
  }
}

// Get already processed token IDs
async function getProcessedTokenIds(): Promise<Set<string>> {
  console.log('Checking for already processed token IDs...');
  const rows = await models.sequelize.query<{ token_id: string }>(
    `SELECT DISTINCT token_id FROM nft_collection_data`,
    {
      type: QueryTypes.SELECT,
    },
  );

  const processedIds = new Set<string>();
  rows.forEach((row) => {
    processedIds.add(row.token_id);
  });

  console.log(`Found ${processedIds.size} already processed tokens`);
  return processedIds;
}

// Fetch collection assets
async function fetchCollectionAssets(): Promise<NFTAsset[]> {
  console.log(`Fetching collection assets for: ${COLLECTION_SLUG}`);

  const assets: NFTAsset[] = [];
  let next = '';
  let page = 1;

  do {
    const url =
      `https://api.opensea.io/api/v2/collection/${COLLECTION_SLUG}/nfts` +
      `?limit=${process.env.TESTING === 'true' ? TESTING_NFT_COUNT : 200}${next ? `&next=${next}` : ''}`;

    try {
      const response = await fetch(url, {
        headers: {
          'X-API-KEY': OPENSEA_API_KEY!,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as {
        nfts: NFTAsset[];
        next: string;
      };
      assets.push(...data.nfts);
      next = data.next;

      console.log(`Fetched page ${page}, total assets: ${assets.length}`);
      page++;

      if (next) {
        await delay(DELAY_MS);
      }

      if (process.env.TESTING === 'true' && assets.length > 10) {
        break;
      }
    } catch (error) {
      console.error('Error fetching collection assets:', error);
      break;
    }
  } while (next);

  return assets;
}

// Fetch individual NFT details (traits and ownership)
async function fetchNFTDetails(
  contractAddress: string,
  tokenId: string,
): Promise<NFTDetails | null> {
  const url = `https://api.opensea.io/api/v2/chain/${CHAIN}/contract/${contractAddress}/nfts/${tokenId}`;

  const response = await fetch(url, {
    headers: {
      'X-API-KEY': OPENSEA_API_KEY!,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    console.warn(`Failed to fetch NFT ${tokenId}: ${response.status}`);
    throw new Error('Failed to fetch NFT');
  }

  return (await response.json()) as NFTDetails;
}

// Insert single NFT data into the database immediately after fetch
async function insertSingleNFTData(
  asset: NFTAsset,
  details: NFTDetails | null,
): Promise<void> {
  if (!details) return;

  // Handle multiple owners (create a row for each owner)
  const owners =
    details.nft.owners.length > 0
      ? details.nft.owners
      : [{ address: 'Unknown', quantity: 1 }];

  const [owner] = details.nft.owners;

  if (!owner) {
    throw new Error(
      `Expected 1 owner for NFT ${asset.identifier}, got ${owners.length}`,
    );
  }

  const insertQuery = `
    INSERT INTO nft_collection_data (token_id, name, holder_address, opensea_url, traits, opensea_rarity)
    VALUES (?, ?, ?, ?, ?::jsonb, ?::jsonb)
  `;

  try {
    const queryParams = [
      asset.identifier,
      asset.name || `Token ${asset.identifier}`,
      owner.address,
      asset.opensea_url,
      JSON.stringify(details.nft.traits || []),
      JSON.stringify(
        details.nft.rarity || {
          strategy_id: '',
          strategy_version: '',
          rank: 0,
        },
      ),
    ];

    await models.sequelize.query(insertQuery, {
      replacements: queryParams,
    });

    console.log(
      `✅ Saved NFT ${asset.identifier} with ${owners.length} owner(s)`,
    );
  } catch (error) {
    console.error(`Error inserting NFT ${asset.identifier}:`, error);
    throw error;
  }
}

// Main function
async function main() {
  console.log('Starting NFT data export...');

  // Step 0: Create the database table
  await createNFTCollectionTable();

  // Step 1: Get already processed token IDs
  const processedTokenIds = await getProcessedTokenIds();

  // Step 2: Fetch all collection assets
  const assets = await fetchCollectionAssets();
  console.log(`Found ${assets.length} assets in collection`);

  if (assets.length === 0) {
    console.log('No assets found. Please check your collection slug.');
    return;
  }

  // Step 3: Filter out already processed assets
  const unprocessedAssets = assets.filter(
    (asset) => !processedTokenIds.has(asset.identifier),
  );
  console.log(
    `Found ${unprocessedAssets.length} unprocessed assets (${assets.length - unprocessedAssets.length} already processed)`,
  );

  if (unprocessedAssets.length === 0) {
    console.log('All assets have already been processed!');
    return;
  }

  // Step 4: Fetch detailed data for each unprocessed NFT and save immediately
  console.log('Fetching detailed NFT data and saving to database...');
  let processedCount = 0;

  for (let i = 0; i < unprocessedAssets.length; i++) {
    const asset = unprocessedAssets[i];
    console.log(
      `Processing NFT ${i + 1}/${unprocessedAssets.length}: ${asset.identifier}`,
    );

    const details = await fetchNFTDetails(asset.contract, asset.identifier);

    // Save to database immediately after fetch
    await insertSingleNFTData(asset, details);
    processedCount++;

    console.log(
      `Progress: ${processedCount}/${unprocessedAssets.length} processed`,
    );

    // Rate limiting delay
    if (i < unprocessedAssets.length - 1) {
      await delay(DELAY_MS);
    }
  }

  console.log(`✅ Processing completed`);
  console.log(`Total new records processed: ${processedCount}`);
  console.log(
    `Total records in database: ${processedTokenIds.size + processedCount}`,
  );
}

main()
  .then(() => {
    console.log('Success');
    // eslint-disable-next-line n/no-process-exit
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error in main execution:', error);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  });
