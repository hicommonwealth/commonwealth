import { MAGNA_WITHDRAW_SELECTORS } from '@hicommonwealth/shared';
import { createPublicClient } from 'viem';

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

type TxnData = {
  txHash: string;
  txBlockNumber: bigint;
  timestamp: bigint;
  status: 'reverted' | 'success' | 'pending';
};

// TODO: if getClaimAddress does not return a txnHash AND magna_claim_at (or cliff...) is set run getWithdrawTransactionsForAddress
//  find first txn with 'status' successful -> this is initial txn
//  if pending -> transaction is still processing -> wait X seconds -> call client.getTransactionReceipt again
//  if reverted -> prompt user to re-sign new transaction

/**
 * Fetches transaction history for an address from Alchemy API
 * Returns transactions that called the Magna contract's withdraw function
 * Handles pagination if there are more results available
 */
export async function getWithdrawTransactionsForAddress(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: ReturnType<typeof createPublicClient<any, any, any, any>>,
  contractAddress: string,
  address: string,
  fromBlock: bigint,
): Promise<TxnData[]> {
  const txns: TxnData[] = [];
  let pageKey: string | undefined;

  try {
    do {
      const params: AssetTransferParams = {
        fromAddress: address.toLowerCase(),
        toAddress: contractAddress.toLowerCase(),
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
          const txHash = transfer.hash as `0x${string}`;
          if (txHash) {
            // Verify this transaction actually called withdraw
            try {
              const [tx, receipt] = await Promise.all([
                client.getTransaction({ hash: txHash }),
                client.getTransactionReceipt({ hash: txHash }),
              ]);

              if (!tx) {
                throw new Error('Transaction not found');
              }

              if (
                tx.to?.toLowerCase() === contractAddress.toLowerCase() &&
                tx.input &&
                tx.input.length > 10
              ) {
                const selector = tx.input.slice(0, 10);
                if (MAGNA_WITHDRAW_SELECTORS.includes(selector.toLowerCase())) {
                  txns.push({
                    txHash: txHash,
                    txBlockNumber: tx.blockNumber,
                    timestamp: (
                      await client.getBlock({
                        blockHash: tx.blockHash,
                      })
                    ).timestamp,
                    status: receipt?.status || 'pending',
                  });
                }
              }
            } catch (err) {
              console.warn(
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
    console.error(
      `Failed to fetch transactions for address ${address}`,
      undefined,
      { error: err },
    );
  }

  return txns;
}
