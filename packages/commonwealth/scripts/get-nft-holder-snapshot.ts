import { models } from '@hicommonwealth/model/db';
import fetch from 'node-fetch';
import { QueryTypes } from 'sequelize';
import { config } from '../server/config';

// Parse command line arguments
const args = process.argv.slice(2);
const shouldClearTable = args.includes('--clear');

// Configuration
const OPENSEA_API_KEY = config.OPENSEA_API_KEY;
const COLLECTION_SLUG = 'lamumu-by-common';
const CHAIN = 'ethereum';
const DELAY_MS = 250; // Delay between API calls to respect rate limits
const MAX_REQUESTS_PER_SECOND = 30;
const MAX_REQUESTS_PER_MINUTE = 60;
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

// Rate limiter class to enforce both per-second and per-minute limits
class RateLimiter {
  private requestTimestamps: number[] = [];
  private maxPerSecond: number;
  private maxPerMinute: number;

  constructor(maxPerSecond: number, maxPerMinute: number) {
    this.maxPerSecond = maxPerSecond;
    this.maxPerMinute = maxPerMinute;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();

    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => now - timestamp < 60000,
    );

    // Check how many requests were made in the last second
    const recentSecond = this.requestTimestamps.filter(
      (timestamp) => now - timestamp < 1000,
    ).length;

    // Check how many requests were made in the last minute
    const recentMinute = this.requestTimestamps.length;

    // Calculate wait time needed
    let waitTime = 0;

    if (recentSecond >= this.maxPerSecond) {
      // Need to wait until the oldest request in the last second is > 1s old
      const oldestInSecond = this.requestTimestamps
        .filter((timestamp) => now - timestamp < 1000)
        .sort((a, b) => a - b)[0];
      waitTime = Math.max(waitTime, 1000 - (now - oldestInSecond) + 10); // +10ms buffer
    }

    if (recentMinute >= this.maxPerMinute) {
      // Need to wait until the oldest request is > 1min old
      const oldest = this.requestTimestamps.sort((a, b) => a - b)[0];
      waitTime = Math.max(waitTime, 60000 - (now - oldest) + 10); // +10ms buffer
    }

    if (waitTime > 0) {
      console.log(`Rate limit: waiting ${waitTime}ms before next request`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    // Record this request
    this.requestTimestamps.push(Date.now());
  }
}

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Clear all existing NFT data from the table
async function clearNftSnapshotTable(): Promise<void> {
  console.log('Clearing existing NFT snapshot data...');
  await models.sequelize.query(
    'TRUNCATE TABLE "NftSnapshot" RESTART IDENTITY;',
  );
  console.log('✅ NFT snapshot table cleared');
}

// Get already processed token IDs
async function getProcessedTokenIds(): Promise<Set<string>> {
  console.log('Checking for already processed token IDs...');
  const rows = await models.sequelize.query<{ token_id: number }>(
    `SELECT DISTINCT token_id FROM "NftSnapshot";`,
    {
      type: QueryTypes.SELECT,
    },
  );
  const processedIds = new Set<string>();
  rows.forEach((row) => {
    processedIds.add(String(row.token_id));
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
  rateLimiter: RateLimiter,
): Promise<NFTDetails | null> {
  await rateLimiter.waitForSlot();
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
    INSERT INTO "NftSnapshot" (token_id, name, holder_address, opensea_url, traits, opensea_rarity)
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

  if (!config.OPENSEA_API_KEY) {
    console.error('OPENSEA_API_KEY is not set');
    return;
  }

  // Initialize rate limiter
  const rateLimiter = new RateLimiter(
    MAX_REQUESTS_PER_SECOND,
    MAX_REQUESTS_PER_MINUTE,
  );
  console.log(
    `Rate limiter configured: ${MAX_REQUESTS_PER_SECOND} requests/second, ${MAX_REQUESTS_PER_MINUTE} requests/minute`,
  );

  // Step 0: Clear table if --clear flag is provided
  if (shouldClearTable) {
    await clearNftSnapshotTable();
  }

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

    const details = await fetchNFTDetails(
      asset.contract,
      asset.identifier,
      rateLimiter,
    );

    // Save to database immediately after fetch
    await insertSingleNFTData(asset, details);
    processedCount++;

    console.log(
      `Progress: ${processedCount}/${unprocessedAssets.length} processed`,
    );
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
