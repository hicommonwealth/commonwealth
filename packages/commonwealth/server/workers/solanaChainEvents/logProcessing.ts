import { logger as _logger, stats } from '@hicommonwealth/core';
import {
  getAllProgramIds,
  processSolanaEvents as mapSolanaEvents,
  SolanaEvent,
  SolanaLogInfo,
  SolanaNetworks,
  SolanaSlotDetails,
  SolanaTransactionInfo,
} from '@hicommonwealth/model/services';
import { EventPairs } from '@hicommonwealth/schemas';
import { ConfirmedSignatureInfo, Connection, PublicKey } from '@solana/web3.js';

const logger = _logger(import.meta);

/**
 * Fetches transaction signatures for specified programs within a slot range
 * Uses pagination to handle more than 1000 transactions in the slot range
 */
async function getTransactionSignatures(
  connection: Connection,
  programIds: string[],
  startSlot: number,
  endSlot: number,
): Promise<ConfirmedSignatureInfo[]> {
  try {
    const signatures: ConfirmedSignatureInfo[] = [];
    const validProgramIds: string[] = [];

    // Validate program IDs first
    for (const programId of programIds) {
      try {
        // Check if this is a valid public key
        new PublicKey(programId);
        validProgramIds.push(programId);
      } catch (e) {
        logger.warn(`Invalid Solana program ID: ${programId}`, { error: e });
      }
    }

    if (validProgramIds.length === 0) {
      logger.warn('No valid program IDs provided', { programIds });
      return [];
    }

    // Process each program ID with proper pagination
    for (const programId of validProgramIds) {
      try {
        logger.debug(
          `Fetching signatures for program ${programId} between slots ${startSlot} and ${endSlot}`,
        );

        const allProgramSignatures: ConfirmedSignatureInfo[] = [];
        let lastSignature: string | undefined = undefined;
        let fetchMore = true;
        const batchLimit = 1000; // Maximum number of signatures per request

        // Use pagination to fetch all signatures within the slot range
        while (fetchMore) {
          // Get batch of signatures using proper slot range filtering
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const options: any = {
            limit: batchLimit,
            minContextSlot: startSlot,
            maxContextSlot: endSlot,
          };

          // Add before parameter for pagination if we have a last signature
          if (lastSignature) {
            options.before = lastSignature;
          }

          const batchSignatures = await connection.getSignaturesForAddress(
            new PublicKey(programId),
            options,
          );

          // Check if we received any results
          if (batchSignatures.length === 0) {
            fetchMore = false;
            continue;
          }

          // Filter out signatures that have errors or don't match our slot range
          // This is a safety check even though we're using min/maxContextSlot
          const validBatchSignatures = batchSignatures.filter(
            (sig) =>
              !sig.err &&
              sig.slot !== null &&
              sig.slot >= startSlot &&
              sig.slot <= endSlot,
          );

          allProgramSignatures.push(...validBatchSignatures);

          // Check if we need to fetch more (got full batch)
          if (batchSignatures.length < batchLimit) {
            fetchMore = false;
          } else {
            // Update last signature for pagination
            lastSignature =
              batchSignatures[batchSignatures.length - 1].signature;
          }
        }

        logger.debug(
          `Found ${allProgramSignatures.length} valid signatures for program ${programId}`,
        );
        signatures.push(...allProgramSignatures);

        // Record stats
        stats().increment('ce.solana.signatures.fetched', {
          programId: String(programId),
          count: String(allProgramSignatures.length),
        });
      } catch (error) {
        logger.error(
          `Error fetching signatures for program ${programId}:`,
          error,
        );
        // Continue with other program IDs
      }
    }

    // Return unique signatures sorted by slot number
    const uniqueSignatures = Array.from(
      new Map(signatures.map((sig) => [sig.signature, sig])).values(),
    );

    // Sort by slot to process them in order
    return uniqueSignatures.sort((a, b) => (a.slot || 0) - (b.slot || 0));
  } catch (error) {
    logger.error('Error fetching Solana transaction signatures:', error, {
      programIds,
      startSlot,
      endSlot,
    });
    return [];
  }
}

/**
 * Get slot details for a specific slot
 */
async function getSlotDetails(
  connection: Connection,
  slot: number,
): Promise<SolanaSlotDetails | null> {
  try {
    // Get block info for the slot
    const block = await connection.getBlock(slot, {
      maxSupportedTransactionVersion: 0,
    });

    if (!block) {
      logger.debug(`No block found for slot ${slot}`);
      return null;
    }

    // Extract block hash and parent slot
    const blockhash = block.blockhash;
    const parentSlot = block.parentSlot;

    // Get timestamp or use current time as fallback
    const timestamp = block.blockTime || Math.floor(Date.now() / 1000);

    return {
      slot,
      blockhash,
      parentSlot,
      timestamp,
    };
  } catch (error) {
    logger.error('Error fetching Solana slot details:', error, {
      slotNumber: String(slot),
    });
    return null;
  }
}

/**
 * Gets transaction details for decoding by Anchor later
 * This function replaces decodeEventsFromTransaction to separate
 * fetching transaction data from decoding events
 */
async function getTransactionDetails(
  connection: Connection,
  signature: string,
  programIds: string[],
): Promise<{
  programIdsInTransaction: string[];
  slot?: number;
  blockTime?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: any;
}> {
  try {
    // Get the full transaction details
    const transaction = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction || !transaction.meta) {
      return { programIdsInTransaction: [], transaction: null };
    }

    // Find which of our program IDs were called in this transaction
    const programIdsInTransaction = programIds.filter((programId) =>
      transaction.meta?.logMessages?.some((log) =>
        log.includes(`Program ${programId}`),
      ),
    );

    return {
      programIdsInTransaction,
      slot: transaction.slot,
      blockTime: transaction.blockTime || undefined,
      transaction,
    };
  } catch (error) {
    logger.error(`Error getting transaction details for ${signature}:`, error);
    return { programIdsInTransaction: [], transaction: null };
  }
}

/**
 * Extract Solana events from transactions using Anchor IDLs
 */
async function extractEvents(
  connection: Connection,
  signatures: ConfirmedSignatureInfo[],
  programIds: string[],
): Promise<{
  events: SolanaEvent[];
  slots: Set<number>;
}> {
  const events: SolanaEvent[] = [];
  const processedSlots = new Set<number>();
  const slotDetailsCache: Record<number, SolanaSlotDetails> = {};

  // Process transactions in batches to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < signatures.length; i += batchSize) {
    const batch = signatures.slice(i, i + batchSize);

    // Process each signature in the batch
    await Promise.all(
      batch.map(async (sigInfo) => {
        const signature = sigInfo.signature;

        try {
          // Get transaction details but don't decode events
          const txDetails = await getTransactionDetails(
            connection,
            signature,
            programIds,
          );

          if (
            !txDetails.transaction ||
            txDetails.programIdsInTransaction.length === 0
          ) {
            return; // Skip if no transaction data or no relevant programs called
          }

          const slot = txDetails.slot || sigInfo.slot;
          if (!slot) return; // Skip if no slot info available

          // Record the slot as processed
          processedSlots.add(slot);

          // Get slot details (cached)
          if (!slotDetailsCache[slot]) {
            const details = await getSlotDetails(connection, slot);
            if (details) {
              slotDetailsCache[slot] = details;
            }
          }

          // Use cached slot details or create temporary ones
          const slotDetails = slotDetailsCache[slot] || {
            slot: slot,
            blockhash: '',
            parentSlot: 0,
            timestamp: txDetails.blockTime || Math.floor(Date.now() / 1000),
          };

          // Create transaction info
          const transactionInfo: SolanaTransactionInfo = {
            signature,
            slot,
            blockTime: txDetails.blockTime || slotDetails.timestamp,
          };

          // Determine the network from the connection's RPC URL
          const network = connection.rpcEndpoint.includes('devnet')
            ? SolanaNetworks.Devnet
            : SolanaNetworks.Mainnet;

          // For each program ID in this transaction
          for (const programId of txDetails.programIdsInTransaction) {
            // Create log info with all available data for proper decoding later
            const logInfo: SolanaLogInfo = {
              signature,
              slot,
              blockTime: txDetails.blockTime || slotDetails.timestamp,
              programId,
              logs: txDetails.transaction?.meta?.logMessages || [],
              data: txDetails.transaction?.meta?.loadedAddresses
                ? JSON.stringify(txDetails.transaction.meta.loadedAddresses)
                : undefined,
            };

            // Create one generic event entry for this program
            // Let chain-event-utils handle all the event decoding
            events.push({
              eventSource: {
                chainId: network,
                programId,
              },
              transaction: transactionInfo,
              slot: slotDetails,
              log: logInfo,
            });

            logger.debug(
              `Extracted Solana transaction data for program ${programId} from transaction ${signature}`,
            );
          }
        } catch (error) {
          logger.error(`Error processing transaction ${signature}:`, error);
        }
      }),
    );
  }

  return { events, slots: processedSlots };
}

// Event name extraction has been moved to the decodeAnchorEvent function in chain-event-utils.ts

/**
 * Main function to process Solana events within a specified slot range
 */
export async function processSolanaEvents({
  connection,
  programIds,
  startSlot,
  endSlot,
}: {
  connection: Connection;
  programIds: string[];
  startSlot: number;
  endSlot: number;
}): Promise<{
  events: EventPairs[];
  lastSlot: number;
}> {
  try {
    logger.info(
      `Processing Solana events from slot ${startSlot} to ${endSlot}`,
    );

    // Check if we have valid inputs
    if (!connection) {
      logger.error('Invalid connection for processSolanaEvents');
      return {
        events: [],
        lastSlot: startSlot,
      };
    }

    // Load programIds from IDLs if none are specified
    let effectiveProgramIds = programIds || [];
    if (effectiveProgramIds.length === 0) {
      // Determine the network based on the RPC URL
      const network = connection.rpcEndpoint.includes('devnet')
        ? SolanaNetworks.Devnet
        : SolanaNetworks.Mainnet;

      // Load program IDs from the respective network's IDLs
      effectiveProgramIds = getAllProgramIds(network);

      logger.info(
        `Loaded ${effectiveProgramIds.length} program IDs from ${network} IDLs`,
        {
          programIds: effectiveProgramIds.join(', '),
        },
      );

      if (effectiveProgramIds.length === 0) {
        logger.warn(`No program IDs found in ${network} IDLs`);
        return {
          events: [],
          lastSlot: endSlot,
        };
      }
    }

    // Ensure slot numbers are valid
    if (startSlot > endSlot) {
      logger.error('Start slot is greater than end slot', undefined, {
        startSlot: String(startSlot),
        endSlot: String(endSlot),
      });
      return {
        events: [],
        lastSlot: startSlot,
      };
    }

    // Measure performance
    const startTime = performance.now();

    // Get transaction signatures
    const signatures = await getTransactionSignatures(
      connection,
      effectiveProgramIds,
      startSlot,
      endSlot,
    );

    logger.info(`Found ${signatures.length} Solana transactions to process`, {
      startSlot,
      endSlot,
      signatureCount: signatures.length,
    });

    if (signatures.length === 0) {
      // No transactions found, return early but update lastSlot
      return {
        events: [],
        lastSlot: endSlot,
      };
    }

    // Extract events from transactions using Anchor decoding
    const { events, slots } = await extractEvents(
      connection,
      signatures,
      effectiveProgramIds,
    );

    logger.info(
      `Extracted ${events.length} events from ${signatures.length} transactions`,
      {
        eventCount: events.length,
      },
    );

    // Record statistics
    stats().increment('ce.solana.events.processed', {
      eventCount: String(events.length),
    });

    // Map Solana events to common event format
    const mappedEvents = mapSolanaEvents(events);

    // Log how many events were successfully mapped
    logger.info(
      `Mapped ${mappedEvents.length} events out of ${events.length} extracted events`,
    );

    // Determine the last slot we've processed
    const lastSlot = slots.size > 0 ? Math.max(...Array.from(slots)) : endSlot;

    const endTime = performance.now();
    logger.debug(
      `Solana event processing took ${(endTime - startTime).toFixed(2)}ms`,
      {
        processingTimeMs: endTime - startTime,
      },
    );

    return {
      events: mappedEvents,
      lastSlot,
    };
  } catch (error) {
    logger.error('Error processing Solana events:', error);
    // Return the start slot on error so we can retry this range
    return {
      events: [],
      lastSlot: startSlot,
    };
  }
}
