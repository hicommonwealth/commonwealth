import { EvmEventSourceInstance } from '../../models/evmEventSource';
import { ethers } from 'ethers';
import { Log } from '@ethersproject/providers';

function getProvider(rpc: string) {
  return new ethers.providers.JsonRpcProvider(rpc);
}

async function getLogs(
  rpc: string,
  eventSources: EvmEventSourceInstance[],
  startingBlockNum?: number
): Promise<{ logs: Log[]; lastBlockNum: number }> {
  const provider = getProvider(rpc);
  const currentBlockNum = await provider.getBlockNumber();

  // limit the number of blocks to fetch to 500 to avoid rate limiting on some EVM nodes like Celo
  // this should eventually be configured on the ChainNodes table by rpc since each rpc has different
  // rate limits e.g. Alchemy hasa limit of 10k logs while Celo public nodes have a limit of 500.
  if (!startingBlockNum || currentBlockNum - startingBlockNum > 500) {
    // TODO: log and report warning with the exact block range that is skipped
    startingBlockNum = currentBlockNum - 10;
  }

  const logs: Log[] = await provider.send('eth_getLogs', [
    {
      fromBlock: startingBlockNum,
      toBlock: currentBlockNum,
      address: eventSources.map((eventSource) => eventSource.contract_address),
    },
  ]);

  return { logs, lastBlockNum: currentBlockNum };
}

async function parseLogs(eventSources: EvmEventSourceInstance[], logs: Log[]) {
  const events = [];
  const eventSourceMap = new Set(
    eventSources.map((eventSource) => eventSource.contract_address)
  );
  for (const log of logs) {
    if (eventSourceMap.has(log.topics[0])) {
      events.push(log);
    }
  }
}

export async function getEvents(
  rpc: string,
  eventSources: EvmEventSourceInstance[],
  startingBlockNum?: number
): Promise<{ events: any; lastBlockNum: number }> {
  const { logs, lastBlockNum } = await getLogs(
    rpc,
    eventSources,
    startingBlockNum
  );
  const events = await parseLogs(eventSources, logs);
  return { events, lastBlockNum };
}
