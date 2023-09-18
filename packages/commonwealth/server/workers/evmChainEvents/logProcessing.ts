import { ethers } from 'ethers';
import { Log } from '@ethersproject/providers';
import {
  AbiSignatures,
  ContractSources,
  EvmSource,
  RawEvmEvent,
} from './types';
import { decimalToHex } from 'chain-events/src';
import { StatsDController } from 'common-common/src/statsd';
import { factory, formatFilename } from 'common-common/src/logging';
import { rollbar } from './startEvmPolling';

const logger = factory.getLogger(formatFilename(__filename));

function getProvider(rpc: string) {
  return new ethers.providers.JsonRpcProvider(rpc);
}

export async function getLogs(
  evmSource: EvmSource,
  startingBlockNum?: number
): Promise<{ logs: Log[]; lastBlockNum: number }> {
  const provider = getProvider(evmSource.rpc);
  const currentBlockNum = await provider.getBlockNumber();

  // limit the number of blocks to fetch to 500 to avoid rate limiting on some EVM nodes like Celo
  // this should eventually be configured on the ChainNodes table by rpc since each rpc has different
  // rate limits e.g. Alchemy hasa limit of 10k logs while Celo public nodes have a limit of 500.
  if (!startingBlockNum || currentBlockNum - startingBlockNum > 500) {
    // TODO: log and report warning with the exact block range that is skipped
    startingBlockNum = currentBlockNum - 10;
  } else {
    startingBlockNum += 1;
  }

  console.log(`Fetching logs from ${startingBlockNum} to ${currentBlockNum}`);
  const logs: Log[] = await provider.send('eth_getLogs', [
    {
      fromBlock: decimalToHex(startingBlockNum),
      toBlock: decimalToHex(currentBlockNum),
      address: Object.keys(evmSource.contracts),
    },
  ]);

  return { logs, lastBlockNum: currentBlockNum };
}

export async function parseLogs(
  sources: ContractSources,
  logs: Log[]
): Promise<RawEvmEvent[]> {
  const events: RawEvmEvent[] = [];
  const interfaces = {};
  for (const log of logs) {
    const address = ethers.utils.getAddress(log.address);
    const data: AbiSignatures = sources[address];
    const signature = data.sources.find(
      (s) => s.event_signature === log.topics[0]
    );
    if (signature) {
      if (!interfaces[address]) {
        interfaces[address] = new ethers.utils.Interface(data.abi);
      }
      let parsedLog: ethers.utils.LogDescription;
      try {
        parsedLog = interfaces[address].parseLog(log);
      } catch (e) {
        const msg = `Failed to parse log from contract ${address} with signature ${log.topics[0]}`;
        logger.error(msg, e);
        rollbar.error(msg, e);
        continue;
      }
      StatsDController.get().increment('ce.evm.event', {
        contractAddress: address,
        kind: signature.kind,
      });
      events.push({
        contractAddress: address,
        kind: signature.kind,
        blockNumber: parseInt(log.blockNumber.toString(), 16),
        args: parsedLog.args,
      });
    }
  }

  return events;
}

export async function getEvents(
  evmSource: EvmSource,
  startingBlockNum?: number
): Promise<{ events: RawEvmEvent[]; lastBlockNum: number }> {
  const { logs, lastBlockNum } = await getLogs(evmSource, startingBlockNum);
  const events = await parseLogs(evmSource.contracts, logs);
  return { events, lastBlockNum };
}
