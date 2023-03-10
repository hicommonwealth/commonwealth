/**
 * Fetches events from Aave contract in real time.
 */
import type { Listener } from '@ethersproject/providers';

import {
  EvmEventSourceMapType,
  IEventSubscriber,
  SupportedNetwork,
} from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import type { RawEvent, Api } from './types';
import Timeout = NodeJS.Timeout;
import { JsonRpcProvider } from '@ethersproject/providers';

export class Subscriber extends IEventSubscriber<Api, RawEvent> {
  private _name: string;

  private subIntervalId: Timeout;

  protected readonly log;

  protected lastBlockNumber: number;

  private eventSourceMap: EvmEventSourceMapType;

  constructor(api: Api, name: string, verbose = false) {
    super(api, verbose);
    this._name = name;
    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.Aave, this._name])
    );
  }

  private async estimateBlockTime(numEstimateBlocks = 10): Promise<number> {
    const provider = this._api.governance.provider;

    // retrieves the last numEstimateBlocks blocks to estimate block time
    const currentBlockNum = await provider.getBlockNumber();
    this.log.info(`Current Block: ${currentBlockNum}`);
    const blockPromises = [];
    for (
      let i = currentBlockNum;
      i > currentBlockNum - numEstimateBlocks;
      i--
    ) {
      blockPromises.push(provider.getBlock(i));
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
      return 15;
    }

    this.log.info(`Polling interval: ${maxBlockTime} seconds`);
    return maxBlockTime;
  }

  private async fetchLogs(
    provider: JsonRpcProvider,
    cb: (event: RawEvent) => void
  ) {
    const currentBlockNum = await provider.getBlockNumber();
    console.log('New current block number:', currentBlockNum);
    if (this.lastBlockNumber && this.lastBlockNumber != currentBlockNum) {
      for (let i = this.lastBlockNumber + 1; i <= currentBlockNum; i++) {
        const logs = await provider.getLogs({
          fromBlock: this.lastBlockNumber,
          toBlock: currentBlockNum,
        });

        // filter the logs we need
        for (const log of logs) {
          if (
            this.eventSourceMap[
              log.address.toLowerCase()
            ]?.eventSignatures.includes(log.topics[0])
          ) {
            const parsedRawEvent =
              this.eventSourceMap[log.address.toLowerCase()].parseLog(log);

            const rawEvent: RawEvent = {
              address: log.address.toLowerCase(),
              args: parsedRawEvent.args as any,
              name: parsedRawEvent.name,
              blockNumber: log.blockNumber,
            };

            const logStr = `Found the following event log in block ${
              log.blockNumber
            }: ${JSON.stringify(rawEvent, null, 2)}.`;
            // eslint-disable-next-line no-unused-expressions
            this._verbose ? this.log.info(logStr) : this.log.trace(logStr);

            cb(rawEvent);
          }
        }
      }
    }
    this.lastBlockNumber = currentBlockNum;
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
    const provider = this._api.governance.provider;
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
      provider
    );
  }

  public unsubscribe(): void {
    if (this.subIntervalId) {
      clearInterval(this.subIntervalId);
      this.subIntervalId = undefined;
    }
  }
}
