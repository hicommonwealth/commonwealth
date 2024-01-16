import { Log } from '@ethersproject/providers';
import { StatsDController } from '@hicommonwealth/adapters';
import { logger as _logger } from '@hicommonwealth/core';
import { ethers } from 'ethers';
import { rollbar } from '../../util/rollbar';
import {
  AbiSignatures,
  ContractSources,
  EvmSource,
  RawEvmEvent,
} from './types';

const logger = _logger().getLogger(__filename);

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
export async function getLogs(
  evmSource: EvmSource,
  startingBlockNum?: number,
  maxOldBlocks = 10,
): Promise<{ logs: Log[]; lastBlockNum: number }> {
  const provider = getProvider(evmSource.rpc);
  const currentBlockNum = await provider.getBlockNumber();

  if (Object.keys(evmSource.contracts).length === 0) {
    logger.warn(`No contracts given`);
    rollbar.error(`No contracts given`);
    return { logs: [], lastBlockNum: currentBlockNum };
  }

  if (!startingBlockNum) {
    startingBlockNum = currentBlockNum - maxOldBlocks;
  } else if (currentBlockNum - startingBlockNum > 500) {
    // limit the number of blocks to fetch to 500 to avoid rate limiting on some EVM nodes like Celo
    // this should eventually be configured on the ChainNodes table by rpc since each rpc has different
    // rate limits e.g. Alchemy has a limit of 10k logs while Celo public nodes have a limit of 500.
    startingBlockNum = currentBlockNum - 500;
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
      logger.warn(`Invalid ABI for contract ${address}`);
      rollbar.error(`Invalid ABI for contract ${address}`);
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

  return events;
}

export async function getEvents(
  evmSource: EvmSource,
  startingBlockNum?: number,
  maxOldBlocks?: number,
): Promise<{ events: RawEvmEvent[]; lastBlockNum: number }> {
  const { logs, lastBlockNum } = await getLogs(
    evmSource,
    startingBlockNum,
    maxOldBlocks,
  );
  const events = await parseLogs(evmSource.contracts, logs);
  return { events, lastBlockNum };
}
