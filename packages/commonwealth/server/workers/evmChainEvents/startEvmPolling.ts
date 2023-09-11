// TODO: @Timothee remove when filling in stubs
// @ts-nocheck
/* eslint-disable */

import { getBlocks } from './blocks';
import { parseBlocks } from './blocks';
import { EvmEventSourceInstance } from '../../models/evmEventSource';

async function getEventSources(): Promise<EvmEventSourceInstance[]> {
  // this function needs to first fetch all chain-event subscription chains
  // then we fetch all contract addresses and chain node ids (through either
  // CommunityContracts or ChainNodes) before fetching all event sources
  // that match the contract address and chain node id.
  // Thus this function will only return event sources on which there are
  // active chain-event subscriptions.
}

async function emitChainEventNotifs(events: any): Promise<void> {
  // this function needs to map event sources to chain-based subscriptions
  // this can be done as follows:
  // EvmEventSources(contract_address, chain_node_d) maps to
  // Contracts(address, chain_node_id) which maps to
  // CommunityContracts(contract_id, chain_id) which maps to
  // Subscriptions(category = 'chain-event', chain_id)
  // Since we need Chain.network in the final event data we
  // will need to join with the Chains table as well
}

async function processChain(
  eventSources: EvmEventSourceInstance[]
): Promise<void> {
  // get lastProcessedEvmBlock
  const startBlockNum = 0;

  const blocks = await getBlocks(startBlockNum);
  const events = await parseBlocks(eventSources, blocks);
  await emitChainEventNotifs(events);

  // update lastProcessedEvmBlock
}

async function scheduleBlockFetching(
  eventSources: EvmEventSourceInstance[],
  interval: number
) {
  // schedule processChain execution by chainNode
  // chainNodes should be evenly distributed in the interval time
  // for example if interval is 2 minutes and there are 4 chain nodes
  // then processChain should be called for a new chainNode every 30 seconds
  // average execution time for each chainNode should be reported to datadog so
  // this scheduling algo can be improved over time
  await processChain(eventSources);
}

/**
 * Starts an infinite loop that periodically fetches and parses blocks from
 * relevant EVM blockchains. Events parsed from these blocks are emitted
 * as chain-event notifications.
 */
export async function startEvmPolling(interval: number) {
  const eventSources = await getEventSources();

  await scheduleBlockFetching(eventSources, interval);

  return setInterval(scheduleBlockFetching, interval, eventSources, interval);
}
