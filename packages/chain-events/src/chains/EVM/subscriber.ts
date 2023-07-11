import type { JsonRpcProvider, Provider } from '@ethersproject/providers';

import { EvmEventSourceMapType, SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import Timeout = NodeJS.Timeout;
import { getRawEvents } from 'chain-events/src/eth';
import { RawEvent } from 'chain-events/src/chains/EVM/types';
import { LastCachedBlockNumber } from 'chain-events/src/LastCachedBlockNumber';
import { decimalToHex } from 'chain-events/src';

export class Subscriber {
  private readonly _name: string;
  private readonly _verbose: boolean;

  private eventSourceMap: EvmEventSourceMapType;
  private subIntervalId: Timeout;

  protected readonly log;

  protected provider: Provider;
  protected contractAddresses: string[];
  protected readonly lastCachedBlockNumber: LastCachedBlockNumber;

  constructor(
    provider: Provider,
    name: string,
    contractAddresses: string[],
    lastCachedBlockNumber: LastCachedBlockNumber,
    verbose = false
  ) {
    this.provider = provider;
    this.contractAddresses = contractAddresses;
    this._name = name;
    this._verbose = verbose;
    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.Aave, this._name])
    );
    this.lastCachedBlockNumber = lastCachedBlockNumber;
  }

  private async estimateBlockTime(numEstimateBlocks = 10): Promise<number> {
    // retrieves the last numEstimateBlocks blocks to estimate block time
    const currentBlockNum = (await this.provider.getBlockNumber()) - 100;
    this.log.info(`Current Block: ${currentBlockNum}`);
    const blockPromises = [];
    for (
      let i = currentBlockNum;
      i > currentBlockNum - numEstimateBlocks;
      i--
    ) {
      blockPromises.push(this.provider.getBlock(i));
    }
    const blocks = await Promise.all(blockPromises);
    const timestamps = blocks.map((x) => x.timestamp).reverse();
    let maxBlockTime = 0;

    for (let i = 1; i < timestamps.length; i++) {
      if (maxBlockTime < timestamps[i] - timestamps[i - 1])
        maxBlockTime = timestamps[i] - timestamps[i - 1];
    }

    if (maxBlockTime === 0) {
      this.log.error(
        `Failed to estimate block time.`,
        new Error(`maxBlockTime is 0.`)
      );
      // default to Ethereum block time
      return 12;
    }

    this.log.info(`Polling interval: ${maxBlockTime} seconds`);
    return maxBlockTime;
  }

  private async fetchLogs(
    provider: JsonRpcProvider,
    cb: (event: RawEvent) => void
  ) {
    const currentBlockNum = await provider.getBlockNumber();
    console.log('Subscriber polled current block number:', currentBlockNum);
    if (
      this.lastCachedBlockNumber.get() &&
      this.lastCachedBlockNumber.get() != currentBlockNum
    ) {
      const rawEvents = await getRawEvents(provider, this.eventSourceMap, {
        start: this.lastCachedBlockNumber.get() + 1,
        end: currentBlockNum,
      });

      for (const rawEvent of rawEvents) {
        cb(rawEvent);
      }
    }
    this.lastCachedBlockNumber.set(currentBlockNum);
  }

  /**
   * Initializes subscription to chain and starts emitting events.
   * @param cb A callback to execute for each event
   * @param eventSourceMap
   * @param numEstimateBlocks The number of blocks to search for the max block time
   */
  public async subscribe(
    cb: (event: RawEvent) => void,
    eventSourceMap: EvmEventSourceMapType,
    numEstimateBlocks = 10
  ): Promise<void> {
    if (this.subIntervalId) {
      this.log.info('Already subscribed!');
      return;
    }

    this.eventSourceMap = eventSourceMap;

    const maxBlockTime = await this.estimateBlockTime(numEstimateBlocks);

    // TODO: keep track of the number of requests that return no blocks - adjust accordingly
    this.subIntervalId = setInterval(
      this.fetchLogs.bind(this),
      maxBlockTime * 1000,
      this.provider,
      cb
    );
  }

  public unsubscribe(): void {
    if (this.subIntervalId) {
      clearInterval(this.subIntervalId);
      this.subIntervalId = undefined;
    }
  }
}
