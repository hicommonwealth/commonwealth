import { Log } from '@ethersproject/providers';
import { logger as _logger, stats } from '@hicommonwealth/core';
import { ethers } from 'ethers';
import {
  AbiSignatures,
  ContractSources,
  EvmSource,
  RawEvmEvent,
} from './types';

const logger = _logger().getLogger(__filename);
const MAX_OLD_BLOCKS = 10;

/**
 * Converts a string or integer number into a hexadecimal string that adheres to the following guidelines
 * https://ethereum.org/en/developers/docs/apis/json-rpc/#quantities-encoding
 * @param decimal
 */
function decimalToHex(decimal: number | string) {
  if (decimal == '0') {
    return '0x0';
  } else {
    return ethers.utils.hexStripZeros(
      ethers.BigNumber.from(decimal).toHexString(),
    );
  }
}

export function getProvider(rpc: string) {
  return new ethers.providers.JsonRpcProvider(rpc);
}

/**
 * Fetches logs from the given EVM source. startingBlockNum can be used to start fetching logs
 * from a specific block number. If startingBlockNum is more than 500 blocks behind the current
 * block number then shorten the range to 500 blocks. If startingBlockNum is not provided then
 * fetch logs from the last [maxOldBlocks] blocks.
 */
export async function getLogs({
  rpc,
  contractAddresses,
  startingBlockNum,
  endingBlockNum,
}: {
  rpc: string;
  contractAddresses: string[];
  startingBlockNum?: number;
  endingBlockNum?: number;
}): Promise<{ logs: Log[]; lastBlockNum: number }> {
  const provider = getProvider(rpc);

  if (!endingBlockNum) endingBlockNum = await provider.getBlockNumber();

  if (contractAddresses.length === 0) {
    logger.error(`No contracts given`);
    return { logs: [], lastBlockNum: endingBlockNum };
  }

  if (!startingBlockNum) {
    startingBlockNum = endingBlockNum - MAX_OLD_BLOCKS;
  } else if (endingBlockNum - startingBlockNum > 500) {
    // limit the number of blocks to fetch to 500 to avoid rate limiting on some EVM nodes like Celo
    // this should eventually be configured on the ChainNodes table by rpc since each rpc has different
    // rate limits e.g. Alchemy has a limit of 10k logs while Celo public nodes have a limit of 500.
    startingBlockNum = endingBlockNum - 500;
  }

  console.log(`Fetching logs from ${startingBlockNum} to ${endingBlockNum}`);
  const logs: Log[] = await provider.send('eth_getLogs', [
    {
      fromBlock: decimalToHex(startingBlockNum),
      toBlock: decimalToHex(endingBlockNum),
      address: contractAddresses,
    },
  ]);

  return { logs, lastBlockNum: endingBlockNum };
}

export async function parseLogs(
  sources: ContractSources,
  logs: Log[],
): Promise<RawEvmEvent[]> {
  const events: RawEvmEvent[] = [];
  const interfaces = {};
  for (const log of logs) {
    const address = ethers.utils.getAddress(log.address);
    const data: AbiSignatures = sources[address];
    const signature = data.sources.find(
      (s) => s.event_signature === log.topics[0],
    );
    if (!signature) continue;

    if (!data.abi || !Array.isArray(data.abi) || data.abi.length === 0) {
      logger.error(`Invalid ABI for contract ${address}`);
      continue;
    }

    if (!interfaces[address]) {
      interfaces[address] = new ethers.utils.Interface(data.abi);
    }

    let parsedLog: ethers.utils.LogDescription;
    try {
      parsedLog = interfaces[address].parseLog(log);
    } catch (e) {
      const msg = `Failed to parse log from contract ${address} with signature ${log.topics[0]}`;
      logger.error(msg, e);
      continue;
    }
    stats().increment('ce.evm.event', {
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

  return events;
}

export async function getEvents(
  evmSource: EvmSource,
  startingBlockNum?: number,
  endingBlockNum?: number,
): Promise<{ events: RawEvmEvent[]; lastBlockNum: number }> {
  const { logs, lastBlockNum } = await getLogs({
    rpc: evmSource.rpc,
    contractAddresses: Object.keys(evmSource.contracts),
    startingBlockNum,
    endingBlockNum,
  });
  const events = await parseLogs(evmSource.contracts, logs);
  return { events, lastBlockNum };
}

/**
 * This function is used to migrate recently added EvmEventSources to the
 * indicated end block. This is used when new event sources are added as a
 * result of other events being processed. Generally, this will be used in a
 * pattern where we listen for contract creation events that when processed
 * create new EvmEventSources derived from the created contract.
 */
export async function migrateEvents(
  evmSource: EvmSource,
  endingBlockNum: number,
): Promise<{ events: RawEvmEvent[]; lastBlockNum: number } | undefined> {
  let oldestBlock: number;
  const contracts: ContractSources = {};
  for (const [contractAddress, abiSignature] of Object.entries(
    evmSource.contracts,
  )) {
    for (const source of abiSignature.sources) {
      if (source.created_at_block && source.events_migrated === false) {
        if (!contracts[contractAddress]) {
          contracts[contractAddress] = {
            abi: abiSignature.abi,
            sources: [],
          };
        }
        contracts[contractAddress].sources.push(source);
        if (!oldestBlock || oldestBlock > source.created_at_block) {
          oldestBlock = source.created_at_block;
        }
      }
    }
  }

  if (Object.keys(contracts).length > 0) {
    const result = await getEvents(
      {
        rpc: evmSource.rpc,
        contracts,
      },
      oldestBlock,
      endingBlockNum,
    );
    logger.info('Events migrated', undefined, {
      startingBlockNum: oldestBlock,
      endingBlockNum,
    });
    return result;
  } else {
    logger.info('No events to migrate');
    return;
  }
}
