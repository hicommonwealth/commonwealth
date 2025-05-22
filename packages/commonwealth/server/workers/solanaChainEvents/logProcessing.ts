import * as anchor from '@coral-xyz/anchor';
import { BorshCoder } from '@coral-xyz/anchor';
import { logger as _logger, stats } from '@hicommonwealth/core';
import {
  findIdlByProgramId,
  getAllProgramIds,
  SolanaNetworks,
} from '@hicommonwealth/evm-protocols';
import {
  processSolanaEvents as mapSolanaEvents,
  SolanaEvent,
  SolanaLogInfo,
  SolanaSlotDetails,
  SolanaTransactionInfo,
} from '@hicommonwealth/model';
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

        let allProgramSignatures: ConfirmedSignatureInfo[] = [];
        let lastSignature: string | undefined = undefined;
        let fetchMore = true;
        const batchLimit = 1000; // Maximum number of signatures per request

        // Use pagination to fetch all signatures within the slot range
        while (fetchMore) {
          // Get batch of signatures using proper slot range filtering
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
    const block = await connection.getBlock(slot);

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
 * Decodes events from a Solana transaction using Anchor
 */
async function decodeEventsFromTransaction(
  connection: Connection,
  signature: string,
  programIds: string[],
): Promise<{
  events: Array<{ name: string; data: any; programId: string }>;
  slot?: number;
  blockTime?: number;
}> {
  try {
    // Get the full transaction details
    const transaction = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction || !transaction.meta) {
      return { events: [] };
    }

    const events: Array<{ name: string; data: any; programId: string }> = [];

    // For each program ID, try to decode events
    for (const programId of programIds) {
      // Get the IDL for this program
      const idlWithAddress = findIdlByProgramId(programId);
      if (!idlWithAddress) continue;

      // Create an Anchor coder from the IDL
      const coder = new BorshCoder(idlWithAddress.idl);

      // Skip the account key check as it's complex to handle all transaction versions
      // Instead, let's rely on the logs to determine if the program was called
      const programWasCalled =
        transaction.meta.logMessages?.some((log) =>
          log.includes(`Program ${programId}`),
        ) || false;

      if (!programWasCalled) continue;

      // Look for logs that might contain events
      const programLogs =
        transaction.meta.logMessages?.filter(
          (log) =>
            log.includes(`Program ${programId}`) ||
            log.includes('Program log:'),
        ) || [];

      // Extract events based on the log pattern
      for (let i = 0; i < programLogs.length; i++) {
        const log = programLogs[i];

        // Skip logs that don't have program output
        if (!log.includes('Program log:')) continue;

        // Look for specific event patterns in the log
        // Format: "Program log: Event [EventName]"
        const eventMatch = log.match(/Program log: Event ([A-Za-z]+)/);
        if (eventMatch && eventMatch[1]) {
          const eventName = eventMatch[1];

          // Get the next log which might contain the data
          if (
            i + 1 < programLogs.length &&
            programLogs[i + 1].includes('Program log: ')
          ) {
            const dataLog = programLogs[i + 1];
            // Try to extract and decode data
            try {
              // For Anchor events, the data is often Base58 encoded
              const dataMatch = dataLog.match(/Program log: (.*)/);
              if (dataMatch && dataMatch[1]) {
                const rawData = dataMatch[1];

                // Find the event definition in the IDL
                const eventDef = idlWithAddress.idl.events?.find(
                  (e) => e.name === eventName,
                );
                if (eventDef) {
                  // Try to decode using Anchor
                  try {
                    const decodedData = anchor.utils.bytes.bs58.decode(rawData);
                    const eventData = coder.events.decode(
                      anchor.utils.bytes.base64.encode(decodedData.subarray(8)),
                    );

                    if (eventData) {
                      events.push({
                        name: eventName,
                        data: eventData.data,
                        programId,
                      });
                    }
                  } catch (decodeErr) {
                    logger.debug(`Error decoding event data: ${decodeErr}`);
                    // Try alternative decoding approach for raw data
                  }
                }
              }
            } catch (err) {
              logger.debug(`Error parsing event data: ${err}`);
            }
          }
        }

        // Alternative: Look for direct data patterns
        // Format: "Program log: data: [Base64 or other encoded data]"
        const directDataMatch = log.match(/Program log: data: (.*)/);
        if (directDataMatch && directDataMatch[1]) {
          try {
            const base64Data = directDataMatch[1];
            // Try to decode using Anchor's event decoder
            const eventData = coder.events.decode(base64Data);
            if (eventData) {
              events.push({
                name: eventData.name,
                data: eventData.data,
                programId,
              });
            }
          } catch (err) {
            logger.debug(`Error decoding direct data: ${err}`);
          }
        }
      }

      // If we couldn't find any events via logs, try to extract from inner instructions
      if (events.length === 0 && transaction.meta.innerInstructions) {
        for (const innerIx of transaction.meta.innerInstructions) {
          for (const ix of innerIx.instructions) {
            // Use the actual programId string for comparison instead of index
            const ixProgramId =
              transaction.transaction.message.staticAccountKeys?.[
                ix.programIdIndex
              ]?.toString();
            if (ixProgramId === programId && ix.data) {
              try {
                // For Anchor events, we need to decode the data
                const rawData = anchor.utils.bytes.bs58.decode(ix.data);

                // Check if this might be an event (events typically have a specific format)
                // This is a heuristic approach as we don't have direct event markers
                if (rawData.length > 8) {
                  try {
                    // Skip the first 8 bytes (discriminator) and encode the rest as base64
                    const base64Data = anchor.utils.bytes.base64.encode(
                      rawData.subarray(8),
                    );
                    const eventData = coder.events.decode(base64Data);

                    if (eventData) {
                      events.push({
                        name: eventData.name,
                        data: eventData.data,
                        programId,
                      });
                    }
                  } catch (decodeErr) {
                    // This instruction wasn't an event or couldn't be decoded
                    logger.debug(
                      `Failed to decode potential event: ${decodeErr}`,
                    );
                  }
                }
              } catch (err) {
                logger.debug(`Error processing inner instruction: ${err}`);
              }
            }
          }
        }
      }
    }

    return {
      events,
      slot: transaction.slot,
      blockTime: transaction.blockTime || undefined,
    };
  } catch (error) {
    logger.error(`Error decoding events from transaction ${signature}:`, error);
    return { events: [] };
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
          // Decode events from the transaction
          const decodedEventData = await decodeEventsFromTransaction(
            connection,
            signature,
            programIds,
          );

          const slot = decodedEventData.slot || sigInfo.slot;
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
            timestamp:
              decodedEventData.blockTime || Math.floor(Date.now() / 1000),
          };

          // Create transaction info
          const transactionInfo: SolanaTransactionInfo = {
            signature,
            slot,
            blockTime: decodedEventData.blockTime || slotDetails.timestamp,
          };

          // Process each decoded event
          for (const decodedEvent of decodedEventData.events) {
            // Map the event name to our internal event type

            if (!decodedEvent.name) {
              logger.debug(`Unknown event type for event: ${decodedEvent}`);
              continue;
            }

            // Determine the network from the connection's RPC URL
            const network = connection.rpcEndpoint.includes('devnet')
              ? SolanaNetworks.Devnet
              : SolanaNetworks.Mainnet;

            // Get transaction logs
            const transaction = await connection.getTransaction(signature, {
              maxSupportedTransactionVersion: 0,
            });

            // Create log info
            const logInfo: SolanaLogInfo = {
              signature,
              slot,
              blockTime: decodedEventData.blockTime || slotDetails.timestamp,
              programId: decodedEvent.programId,
              logs: transaction?.meta?.logMessages || [],
              data: transaction?.meta?.loadedAddresses
                ? JSON.stringify(transaction.meta.loadedAddresses)
                : undefined,
            };

            // Add the event to our list
            events.push({
              eventSource: {
                chainId: network,
                programId: decodedEvent.programId,
                eventType: decodedEvent.name,
              },
              transaction: transactionInfo,
              slot: slotDetails,
              log: logInfo,
              meta: {
                events_migrated: false,
                created_at_slot: slot,
                event_name: undefined, // We don't map to a specific schema event name here
              },
            });

            logger.debug(
              `Extracted Solana event: (${decodedEvent.name}) from transaction ${signature}`,
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
