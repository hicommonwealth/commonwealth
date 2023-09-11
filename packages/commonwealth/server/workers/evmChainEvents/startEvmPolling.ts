import { getEvents } from './logs';
import { EvmEventSourceInstance } from '../../models/evmEventSource';
import models from '../../database';

export type EventRpcSources = Record<string, EvmEventSourceInstance[]>;

async function getEventSources(): Promise<EventRpcSources> {
  // this function needs to first fetch all chain-event subscription chains
  // then we fetch all contract addresses and chain node ids (through either
  // CommunityContracts or ChainNodes) before fetching all event sources
  // that match the contract address and chain node id.
  // Thus this function will only return event sources on which there are
  // active chain-event subscriptions.
  const eventSources = await models.EvmEventSource.findAll();

  return eventSources.reduce((acc, eventSource) => {
    if (!eventSource.ChainNode) {
      // TODO: log and report error
      return acc;
    }

    const url = eventSource.ChainNode.private_url || eventSource.ChainNode.url;
    if (!acc[url]) {
      acc[url] = [eventSource];
    }
    acc[url].push(eventSource);
    return acc;
  }, {});
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

export async function processChain(
  rpc: string,
  eventSources: EvmEventSourceInstance[]
): Promise<void> {
  if (!eventSources.length) {
    return;
  }

  try {
    const startBlock = await models.LastProcessedEvmBlock.findOne({
      where: {
        chain_node_id: eventSources[0].chain_node_id,
      },
    });

    const { events, lastBlockNum } = await getEvents(
      rpc,
      eventSources,
      startBlock?.block_number
    );

    await emitChainEventNotifs(events);

    // save new block number
    // no need to transactionalize emitNotifications and save new block number
    // since duplicate notifications are not possible
    startBlock.block_number = lastBlockNum;
    startBlock.save();
  } catch (e) {}
}

/**
 * Schedules processFn execution for each chainNode RPC in eventRpcSources. processFn execution is scheduled
 * evenly across the interval time so that blocks are not fetched all at once for all chainNodes. For example,
 * if there are 2 chainNodes and the interval is 4000ms, then processFn will be called for chainNode1 at T=0ms
 * and at T=2000ms and for chainNode2. This would repeat every 4000ms so the next call for chainNode1 would be
 * at T=4000ms and for chainNode2 at T=6000ms.
 * @param eventRpcSources An object where the keys are chainNode RPCs and the values are EvmEventSourceInstance arrays
 * @param interval Time in milliseconds between each fetch of a ChainNode's blocks
 * @param processFn WARNING: must never throw an error. Errors thrown by processFn will not be caught.
 */
export function scheduleBlockFetching(
  eventRpcSources: EventRpcSources,
  interval: number,
  processFn: (
    rpc: string,
    eventSources: EvmEventSourceInstance[]
  ) => Promise<void>
) {
  if (!Object.keys(eventRpcSources).length) {
    return;
  }

  const rpcs = Object.keys(eventRpcSources);
  const betweenInterval = interval / rpcs.length;

  rpcs.forEach((rpc, index) => {
    const initialDelay = index * betweenInterval;

    setTimeout(() => {
      processFn(rpc, eventRpcSources[rpc]);

      setInterval(processFn, interval, rpc, eventRpcSources[rpc]);
    }, initialDelay);
  });
}

/**
 * Starts an infinite loop that periodically fetches and parses blocks from
 * relevant EVM blockchains. Events parsed from these blocks are emitted
 * as chain-event notifications. The interval between each fetch is specified in milliseconds and should be
 * no less than 500k ms (500 seconds) so that we support any EVM chain that has an average block time of
 * 1 second or more (block fetching is limited to 500 blocks per interval). The recommended interval
 * is 60_000 ms (60 seconds).
 */
export async function startEvmPolling(interval: number) {
  if (interval < 500_000) {
    throw new Error(
      `Interval for EVM polling must be at least 500_000 ms (500 seconds)`
    );
  }

  const eventSources = await getEventSources();

  scheduleBlockFetching(eventSources, interval, processChain);
}
