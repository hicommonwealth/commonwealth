import { logger, stats } from '@hicommonwealth/core';
import {
  getAllProgramIds,
  SolanaNetworks,
} from '@hicommonwealth/evm-protocols';
import { emitEvent, models } from '@hicommonwealth/model';
import { EventPairs } from '@hicommonwealth/schemas';
import { Connection } from '@solana/web3.js';
import { config } from '../../config';
import { processSolanaEvents } from './logProcessing';

const log = logger(import.meta);

/**
 * Given a ChainNode id, this function fetches all Solana events since
 * the last stored slot number and then emits notifications for each of them before updating
 * the last fetched slot number. This function will never throw an error.
 */
export async function processChainNode(
  chainId: string, // Solana network identifier (mainnet-beta, devnet, testnet)
  programIds: string[],
): Promise<void> {
  try {
    config.SOLANA_CE.LOG_TRACE &&
      log.debug(
        'Processing Solana events:\n' +
          `\tchainId: ${chainId}\n` +
          `\tprograms: ${JSON.stringify(programIds)}`,
      );
    stats().increment('ce.solana.chain_node_id', {
      chainNodeId: chainId,
    });
    console.log(`Solana ${chainId}`);
    const chainNode = await models.ChainNode.scope('withPrivateData').findOne({
      where: {
        name: `Solana ${chainId}`,
      },
    });
    if (!chainNode) {
      log.error(`ChainNode not found for Solana chain: ${chainId}`);
      return;
    }

    const lastProcessedSlot = await models.LastProcessedSolanaSlot.findOne({
      where: {
        chain_node_id: chainNode.id!,
      },
    });
    console.log(chainNode.private_url);
    const connection = new Connection(chainNode.private_url!, 'finalized');
    const currentSlot = await connection.getSlot();

    let startSlot: number;
    if (!lastProcessedSlot) {
      // If no slot is recorded, start 100 slots back
      startSlot = Math.max(1, currentSlot - 100);
    } else if (lastProcessedSlot.slot_number === currentSlot - 1) {
      // Last processed slot is the current slot - 1, nothing to do
      return;
    } else if (lastProcessedSlot.slot_number + 1 <= currentSlot - 1) {
      // Process from the next slot after the last processed slot
      startSlot = lastProcessedSlot.slot_number + 1;
    } else {
      // Something went wrong with slot numbers, nothing to do
      return;
    }

    // Limit the number of slots to process at once to avoid timeouts
    const maxSlotRange = config.SOLANA_CE.MAX_SLOT_RANGE || 100;
    const endSlot = Math.min(currentSlot - 1, startSlot + maxSlotRange);

    const allEvents: Array<EventPairs> = [];

    // Get events from the specified range of slots
    const { events, lastSlot } = await processSolanaEvents({
      connection,
      programIds,
      startSlot,
      endSlot,
    });

    allEvents.push(...events);

    // Emit all events
    if (allEvents.length > 0) {
      await emitEvent(
        models.Outbox,
        allEvents,
        // No transaction is provided, events are emitted directly
      );
    }

    // Update the last processed slot
    if (lastSlot > 0) {
      await models.LastProcessedSolanaSlot.upsert({
        chain_node_id: chainNode.id!,
        slot_number: lastSlot,
      });
    }

    log.info(
      `Processed Solana events from slot ${startSlot} to ${lastSlot} for ${chainId}, found ${allEvents.length} events`,
    );
  } catch (error) {
    log.error('Error processing Solana chain node:', error, {
      chainId,
      programIds,
    });
  }
}

/**
 * Schedules processing for all Solana chain nodes with the specified interval.
 */
export async function scheduleSolanaNodeProcessing(
  processorFunc: typeof processChainNode,
): Promise<void> {
  // Loop through all available Solana networks defined in the enum
  for (const solanaNetwork of Object.values(SolanaNetworks)) {
    try {
      // Get program IDs for this network
      const programIds = getAllProgramIds(solanaNetwork);

      // Process this Solana network
      await processorFunc(solanaNetwork, programIds);
    } catch (error) {
      log.error(`Error processing Solana network ${solanaNetwork}:`, error);
    }
  }
}
