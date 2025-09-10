import { createObjectCsvWriter } from 'csv-writer';
import fetch from 'node-fetch';

// Configuration
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY;
const COLLECTION_SLUG = 'pudgypenguins';
const CHAIN = 'ethereum';
const DELAY_MS = 500; // Delay between API calls to respect rate limits
const TESTING_NFT_COUNT = 10;

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

interface NFTTrait {
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

interface CSVRow {
  token_id: string;
  name: string;
  holder_address: string;
  opensea_url: string;
  traits: string; // JSON string of the entire traits array
  rarity: string; // JSON string of the entire rarity object
}

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  try {
    const response = await fetch(url, {
      headers: {
        'X-API-KEY': OPENSEA_API_KEY!,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch NFT ${tokenId}: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as NFTDetails;
    console.log('NTF Details: ', data);
    return data;
  } catch (error) {
    console.error(`Error fetching NFT ${tokenId}:`, error);
    return null;
  }
}

// Convert NFT data to CSV format
function convertToCSVFormat(
  assets: NFTAsset[],
  nftDetailsArray: (NFTDetails | null)[],
): CSVRow[] {
  const csvData: CSVRow[] = [];

  assets.forEach((asset, index) => {
    const details = nftDetailsArray[index];

    if (!details) return;

    // Handle multiple owners (create a row for each owner)
    const owners =
      details.nft.owners.length > 0
        ? details.nft.owners
        : [{ address: 'Unknown', quantity: 1 }];

    owners.forEach((owner) => {
      const row: CSVRow = {
        token_id: asset.identifier,
        name: asset.name || `Token ${asset.identifier}`,
        holder_address: owner.address,
        opensea_url: asset.opensea_url,
        traits: JSON.stringify(details.nft.traits || []),
        rarity: JSON.stringify(details.nft.rarity || {}),
      };

      csvData.push(row);
    });
  });

  return csvData;
}

// Main function
async function main() {
  try {
    console.log('Starting NFT data export...');

    // Step 1: Fetch all collection assets
    const assets = await fetchCollectionAssets();
    console.log(`Found ${assets.length} assets in collection`);

    if (assets.length === 0) {
      console.log('No assets found. Please check your collection slug.');
      return;
    }

    // Step 2: Fetch detailed data for each NFT
    console.log('Fetching detailed NFT data...');
    const nftDetailsArray: (NFTDetails | null)[] = [];

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      console.log(
        `Fetching details for NFT ${i + 1}/${assets.length}: ${asset.identifier}`,
      );

      const details = await fetchNFTDetails(asset.contract, asset.identifier);
      nftDetailsArray.push(details);

      // Rate limiting delay
      if (i < assets.length - 1) {
        await delay(DELAY_MS);
      }
    }

    // Step 3: Convert to CSV format
    console.log('Converting data to CSV format...');
    const csvData = convertToCSVFormat(assets, nftDetailsArray);

    // Step 4: Write to CSV file
    const headers = [
      { id: 'token_id', title: 'Token ID' },
      { id: 'name', title: 'Name' },
      { id: 'holder_address', title: 'Holder Address' },
      { id: 'opensea_url', title: 'OpenSea URL' },
      { id: 'traits', title: 'Traits (JSON)' },
      { id: 'rarity', title: 'Rarity (JSON)' },
    ];

    const csvWriter = createObjectCsvWriter({
      path: `${COLLECTION_SLUG}_nfts.csv`,
      header: headers,
    });

    await csvWriter.writeRecords(csvData);
    console.log(`✅ CSV file created: ${COLLECTION_SLUG}_nfts.csv`);
    console.log(`Total records: ${csvData.length}`);
  } catch (error) {
    console.error('Error in main execution:', error);
  }
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
