import { logger } from '@hicommonwealth/core';
import { getPublicClient, ValidChains } from '@hicommonwealth/evm-protocols';
import { models } from '@hicommonwealth/model/db';
import { TaskPayloads } from '@hicommonwealth/model/services';
import { QueryTypes } from 'sequelize';
import { createPublicClient, Hex } from 'viem';
import { config } from '../../../config';

const log = logger(import.meta);

const MAGNA_CONTRACT_ADDRESS = '0xd7BFCe565E6C578Bd6B835ed5EDEC96e39eCfad6';

// Withdraw function selectors
const WITHDRAW_SELECTORS = [
  '0x8612372a', // withdraw(uint256 withdrawalAmount,uint32 rootIndex,bytes decodableArgs,bytes32[] proof)
];

interface ClaimAddressRecord {
  user_id: number;
  address: string;
  magna_claimed_at: Date;
}

// Alchemy API Types
type AssetTransferCategory =
  | 'external' // Top level ETH transactions
  | 'internal' // Internal ETH transfers (contract calls)
  | 'erc20' // ERC20 token transfers
  | 'erc721' // ERC721 NFT transfers
  | 'erc1155' // ERC1155 NFT transfers
  | 'specialnft'; // Special NFT transfers

interface AssetTransferParams {
  /** Starting block (hex string or "latest") */
  fromBlock?: string;
  /** Ending block (hex string or "latest") */
  toBlock?: string;
  /** Filter by sender address */
  fromAddress?: string;
  /** Filter by recipient address */
  toAddress?: string;
  /** Filter by contract address (for token transfers) */
  contractAddresses?: string[];
  /** Array of transfer categories to include */
  category: AssetTransferCategory[];
  /** Include additional metadata (gas, blockTimestamp, etc.) */
  withMetadata?: boolean;
  /** Exclude transfers with zero value */
  excludeZeroValue?: boolean;
  /** Maximum number of results per page (max 1000, default varies by category) */
  maxCount?: number;
  /** Pagination key from previous response - if present, fetch next page */
  pageKey?: string;
  /** Sort order: 'asc' or 'desc' (default: 'asc') */
  order?: 'asc' | 'desc';
}

interface RawContract {
  /** Hex string of the transfer value */
  value: string | null;
  /** Contract address (null for native ETH) */
  address: string | null;
  /** Hex string of token decimals */
  decimal: string | null;
}

interface ERC1155Metadata {
  tokenId: string;
  value: string;
}

interface AssetTransfer {
  /** Block number (hex string) */
  blockNum: string;
  /** Unique transfer ID */
  uniqueId: string;
  /** Transaction hash */
  hash: string;
  /** Sender address */
  from: string;
  /** Recipient address */
  to: string | null;
  /** Transfer value (converted to decimal) */
  value: number | null;
  /** ERC721 token ID */
  erc721TokenId: string | null;
  /** ERC1155 metadata array */
  erc1155Metadata: ERC1155Metadata[] | null;
  /** Token ID (deprecated, use erc721TokenId or erc1155Metadata) */
  tokenId: string | null;
  /** Asset symbol (e.g., "ETH", "USDC") */
  asset: string | null;
  /** Transfer category */
  category: AssetTransferCategory;
  /** Raw contract data */
  rawContract: RawContract;
  /** Optional metadata (when withMetadata: true) */
  metadata?: {
    blockTimestamp: string;
  };
}

interface AssetTransfersResponse {
  /** Array of asset transfers */
  transfers: AssetTransfer[];
  /**
   * Pagination key for next page of results.
   * If defined and non-empty, additional results are available.
   * Pass this value as pageKey param in next request.
   */
  pageKey?: string;
}

interface BlockByTimestampResponse {
  data: Array<{
    network: string;
    block: {
      number: number;
      timestamp: string;
    };
  }>;
}

/**
 * Fetches transaction history for an address from Alchemy API
 * Returns transactions that called the Magna contract's withdraw function
 * Handles pagination if there are more results available
 */
async function getWithdrawTransactionsForAddress(
  client: ReturnType<typeof createPublicClient>,
  address: string,
  fromBlock: bigint,
): Promise<string[]> {
  const txHashes: string[] = [];
  let pageKey: string | undefined;

  try {
    do {
      const params: AssetTransferParams = {
        fromAddress: address.toLowerCase(),
        toAddress: MAGNA_CONTRACT_ADDRESS.toLowerCase(),
        fromBlock: `0x${fromBlock.toString(16)}`,
        category: ['external'],
        withMetadata: true,
        excludeZeroValue: false,
        ...(pageKey && { pageKey }), // Include pageKey for pagination if present
      };

      const response = (await client.request({
        method: 'alchemy_getAssetTransfers',
        params: [params],
      })) as AssetTransfersResponse;

      if (response && response.transfers) {
        for (const transfer of response.transfers) {
          const txHash = transfer.hash;
          if (txHash) {
            // Verify this transaction actually called withdraw
            try {
              const tx = await client.getTransaction({
                hash: txHash as Hex,
              });

              if (
                tx.to?.toLowerCase() === MAGNA_CONTRACT_ADDRESS.toLowerCase() &&
                tx.input &&
                tx.input.length > 10
              ) {
                const selector = tx.input.slice(0, 10);
                if (WITHDRAW_SELECTORS.includes(selector.toLowerCase())) {
                  txHashes.push(txHash);
                }
              }
            } catch (err) {
              log.warn(
                `Failed to verify transaction ${txHash} for address ${address}`,
                err,
              );
            }
          }
        }
      }

      // Update pageKey for next iteration - if it's defined and non-empty, there are more results
      pageKey =
        response?.pageKey && response.pageKey.length > 0
          ? response.pageKey
          : undefined;
    } while (pageKey); // Continue fetching while there are more pages
  } catch (err) {
    log.error(
      `Failed to fetch transactions for address ${address}`,
      undefined,
      { error: err },
    );
  }

  return txHashes;
}

/**
 * Fetches the block number for a given timestamp using Alchemy Blocks API
 * Returns the first block BEFORE the given timestamp on Base network
 */
async function getBlockNumberFromTimestamp(
  apiKey: string,
  timestamp: Date,
): Promise<bigint> {
  try {
    // Convert timestamp to ISO format
    const isoTimestamp = timestamp.toISOString();

    // Build the API URL with query parameters
    const url = new URL(
      `https://api.g.alchemy.com/data/v1/${apiKey}/utility/blocks/by-timestamp`,
    );
    url.searchParams.append('networks', 'base-mainnet');
    url.searchParams.append('timestamp', isoTimestamp);
    url.searchParams.append('direction', 'BEFORE');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Alchemy Blocks API request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as BlockByTimestampResponse;

    if (!data.data || data.data.length === 0) {
      throw new Error('No block data returned from Alchemy Blocks API');
    }

    const blockNumber = data.data[0].block.number;
    log.info(
      `Fetched block number ${blockNumber} for timestamp ${isoTimestamp}`,
    );

    return BigInt(blockNumber);
  } catch (err) {
    log.error(
      'Failed to fetch block number from Alchemy Blocks API',
      err as Error,
    );
    throw err;
  }
}

export const magnaTxnSyncTask = {
  input: TaskPayloads.MagnaTxnSync,
  fn: async () => {
    log.info('Starting MagnaTxnSync job...');

    if (!config.ALCHEMY?.APP_KEYS?.PRIVATE) {
      log.error('Missing Alchemy private API key');
      return;
    }

    const chainNode = await models.ChainNode.scope('withPrivateData').findOne({
      where: {
        eth_chain_id: ValidChains.Base,
      },
    });
    if (!chainNode) {
      log.error('Base chain node not found!');
      return;
    }

    const client = getPublicClient({
      rpc: chainNode.private_url!,
      eth_chain_id: ValidChains.Base,
    });

    const claimAddresses = await models.sequelize.query<ClaimAddressRecord>(
      `
        SELECT user_id, address, magna_claimed_at
        FROM "ClaimAddresses"
        WHERE magna_claimed_at IS NOT NULL
          AND magna_claim_data IS NOT NULL
          AND magna_claim_tx_hash IS NULL
          AND address IS NOT NULL
        ORDER BY magna_claimed_at ASC
      `,
      {
        type: QueryTypes.SELECT,
      },
    );

    if (claimAddresses.length === 0) {
      log.info('No claim addresses need transaction indexing');
      return;
    }

    log.info(
      `Found ${claimAddresses.length} claim addresses to index transactions for`,
    );

    const earliestClaim = claimAddresses[0].magna_claimed_at;
    const startBlock = await getBlockNumberFromTimestamp(
      config.ALCHEMY.APP_KEYS.PRIVATE,
      earliestClaim,
    );

    log.info(`Searching for transactions from block ${startBlock}`);

    let successCount = 0;
    let failureCount = 0;

    for (const record of claimAddresses) {
      try {
        log.info(
          `Processing address ${record.address} for user ${record.user_id}`,
        );

        const txHashes = await getWithdrawTransactionsForAddress(
          client,
          record.address,
          startBlock,
        );

        if (txHashes.length === 0) {
          log.warn(
            `No withdraw transactions found for address ${record.address}`,
          );
          failureCount++;
          continue;
        }

        // If multiple transactions found, use the most recent one
        const txHash = txHashes[txHashes.length - 1];

        log.info(
          `Found withdraw transaction ${txHash} for address ${record.address}`,
        );

        const [, updated] = await models.sequelize.query(
          `
            UPDATE "ClaimAddresses"
            SET magna_claim_tx_hash = :tx_hash,
                updated_at          = NOW()
            WHERE user_id = :user_id
              AND magna_claim_tx_hash IS NULL
          `,
          {
            type: QueryTypes.UPDATE,
            replacements: {
              user_id: record.user_id,
              tx_hash: txHash,
            },
          },
        );

        if (updated > 0) {
          successCount++;
          log.info(
            `Successfully updated transaction hash for user ${record.user_id}`,
          );
        } else {
          failureCount++;
          log.warn(
            `Failed to update transaction hash for user ${record.user_id}`,
          );
        }

        // Add a small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (err) {
        failureCount++;
        log.error(`Error processing address ${record.address}`, err as Error, {
          user_id: record.user_id,
        });
      }
    }

    log.info(
      `MagnaTxnSync job completed! Success: ${successCount}, Failures: ${failureCount}`,
    );
  },
};
