import { logger } from '@hicommonwealth/core';
import { getPublicClient, ValidChains } from '@hicommonwealth/evm-protocols';
import { models } from '@hicommonwealth/model/db';
import { TaskPayloads } from '@hicommonwealth/model/services';
import { QueryTypes } from 'sequelize';
import { createPublicClient, Hex } from 'viem';
import { config } from '../../../config';

const log = logger(import.meta);

// Withdraw function selectors
const WITHDRAW_SELECTORS = [
  '0x8612372a', // withdraw(uint256 withdrawalAmount,uint32 rootIndex,bytes decodableArgs,bytes32[] proof)
];

interface ClaimAddressRecord {
  user_id: number;
  address: string;
  claimed_at: Date;
}

let currentBlockNumber: bigint = BigInt(0);

async function isTxnFinal(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: ReturnType<typeof createPublicClient<any, any, any, any>>,
  txnBlockNumber: bigint,
): Promise<boolean> {
  // initialize current block number
  if (currentBlockNumber === BigInt(0)) {
    currentBlockNumber = await client.getBlockNumber();
  }

  // check if txn is finalized
  if (txnBlockNumber > currentBlockNumber + BigInt(500)) return true;
  else {
    // if not, refresh the current block number and check again
    currentBlockNumber = await client.getBlockNumber();
    if (txnBlockNumber > currentBlockNumber + BigInt(500)) return true;
  }
  return false;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: ReturnType<typeof createPublicClient<any, any, any, any>>,
  address: string,
  fromBlock: bigint,
): Promise<{ txHash: string; txBlockNumber: bigint }[]> {
  const txns: { txHash: string; txBlockNumber: bigint }[] = [];
  let pageKey: string | undefined;

  try {
    do {
      const params: AssetTransferParams = {
        fromAddress: address.toLowerCase(),
        toAddress: config.MAGNA.CONTRACT_ADDRESS.toLowerCase(),
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
                tx.to?.toLowerCase() ===
                  config.MAGNA.CONTRACT_ADDRESS.toLowerCase() &&
                tx.input &&
                tx.input.length > 10
              ) {
                const selector = tx.input.slice(0, 10);
                if (WITHDRAW_SELECTORS.includes(selector.toLowerCase())) {
                  txns.push({
                    txHash: txHash,
                    txBlockNumber: tx.blockNumber,
                  });
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

  return txns;
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

/**
 * Processes claim addresses for a specific transaction type (initial claim or cliff claim)
 */
async function processTxnType(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: ReturnType<typeof createPublicClient<any, any, any, any>>,
  txnType: 'claim' | 'cliff',
  alchemyApiKey: string,
): Promise<{ successCount: number; failureCount: number }> {
  const isCliff = txnType === 'cliff';
  const logPrefix = isCliff ? 'Cliff Claim' : 'Initial Claim';

  log.info(`Starting ${logPrefix} transaction indexing...`);

  const query = isCliff
    ? `
      SELECT user_id, address, magna_cliff_claimed_at as claimed_at
      FROM "ClaimAddresses"
      WHERE magna_cliff_claimed_at IS NOT NULL
        AND magna_cliff_claim_data IS NOT NULL
        AND (magna_cliff_claim_tx_finalized = FALSE OR magna_cliff_claim_tx_finalized IS NULL)
      ORDER BY magna_cliff_claimed_at ASC;
    `
    : `
      SELECT user_id, address, magna_claimed_at as claimed_at
      FROM "ClaimAddresses"
      WHERE magna_claimed_at IS NOT NULL
        AND magna_claim_data IS NOT NULL
        AND (magna_claim_tx_finalized = FALSE OR magna_claim_tx_finalized IS NULL)
      ORDER BY magna_cliff_claimed_at ASC;
    `;

  const claimAddresses = await models.sequelize.query<ClaimAddressRecord>(
    query,
    {
      type: QueryTypes.SELECT,
    },
  );

  if (claimAddresses.length === 0) {
    log.info(`No ${logPrefix} addresses need transaction indexing`);
    return { successCount: 0, failureCount: 0 };
  }

  log.info(
    `Found ${claimAddresses.length} ${logPrefix} addresses to index transactions for`,
  );

  // Determine the earliest timestamp to start searching from
  const earliestTimestamp = claimAddresses[0].claimed_at;

  const startBlock = await getBlockNumberFromTimestamp(
    alchemyApiKey,
    earliestTimestamp,
  );

  log.info(`Searching for ${logPrefix} transactions from block ${startBlock}`);

  let successCount = 0;
  let failureCount = 0;

  for (const record of claimAddresses) {
    try {
      log.info(
        `Processing ${logPrefix} for address ${record.address} (user ${record.user_id})`,
      );

      const foundTxns = await getWithdrawTransactionsForAddress(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        client as any,
        record.address,
        startBlock,
      );

      if (foundTxns.length === 0) {
        log.warn(
          `No withdraw transactions found for address ${record.address}`,
        );
        failureCount++;
        continue;
      }

      // Determine which transaction to use:
      // - For initial claim: use the first (earliest) transaction
      // - For cliff claim: use the second transaction if available, otherwise warn
      let txn: { txHash: string; txBlockNumber: bigint };

      if (isCliff) {
        if (foundTxns.length < 2) {
          log.warn(
            `Expected 2 transactions for cliff claim but found ${foundTxns.length} for address ${record.address}`,
          );
          failureCount++;
          continue;
        }
        // Use the second (later) transaction for cliff claim
        txn = foundTxns[1];
      } else {
        // Use the first (earliest) transaction for initial claim
        txn = foundTxns[0];
      }

      log.info(
        `Found ${logPrefix} withdraw transaction ${txn.txHash} for address ${record.address}`,
      );

      const updateQuery = `
        UPDATE "ClaimAddresses"
        SET ${isCliff ? 'magna_cliff_claim_tx_hash' : 'magna_claim_tx_hash'}           = :tx_hash,
            updated_at                                                                 = NOW(),
            ${isCliff ? 'magna_cliff_claim_tx_finalized' : 'magna_claim_tx_finalized'} = :tx_finalized
        WHERE user_id = :user_id;
      `;

      const [, updated] = await models.sequelize.query(updateQuery, {
        type: QueryTypes.UPDATE,
        replacements: {
          user_id: record.user_id,
          tx_hash: txn.txHash,
          tx_finalized: await isTxnFinal(client, txn.txBlockNumber),
        },
      });

      if (updated > 0) {
        successCount++;
        log.info(
          `Successfully updated ${logPrefix} transaction hash for user ${record.user_id}`,
        );
      } else {
        failureCount++;
        log.warn(
          `Failed to update ${logPrefix} transaction hash for user ${record.user_id}`,
        );
      }

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (err) {
      failureCount++;
      log.error(
        `Error processing ${logPrefix} for address ${record.address}`,
        err as Error,
        {
          user_id: record.user_id,
        },
      );
    }
  }

  log.info(
    `${logPrefix} indexing completed! Success: ${successCount}, Failures: ${failureCount}`,
  );

  return { successCount, failureCount };
}

export const magnaTxnSyncTask = {
  input: TaskPayloads.MagnaTxnSync,
  fn: async () => {
    log.info('Starting MagnaTxnSync job...');

    if (!config.MAGNA.API_KEY) {
      log.warn('Magna txn sync not enabled');
      return;
    }

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

    // Process initial claim transactions
    const claimResults = await processTxnType(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client as any,
      'claim',
      config.ALCHEMY.APP_KEYS.PRIVATE,
    );

    // Process cliff claim transactions
    const cliffResults = await processTxnType(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client as any,
      'cliff',
      config.ALCHEMY.APP_KEYS.PRIVATE,
    );

    const totalSuccess = claimResults.successCount + cliffResults.successCount;
    const totalFailures = claimResults.failureCount + cliffResults.failureCount;

    log.info(
      `MagnaTxnSync job completed! Total Success: ${totalSuccess}, Total Failures: ${totalFailures}`,
    );
  },
};
