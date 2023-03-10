/**
 * Fetches events from ERC20 contract in real time.
 */
import type { Listener, Log } from '@ethersproject/providers';
import sleep from 'sleep-promise';
import BN from 'bn.js';

import {
  EvmEventSourceMapType,
  IEventSubscriber,
  SupportedNetwork,
} from '../../interfaces';
import { ERC20, ERC20__factory as ERC20Factory } from '../../contractTypes';
import { addPrefix, factory } from '../../logging';

import type { RawEvent, IErc20Contracts } from './types';
import Timeout = NodeJS.Timeout;
import { ethers } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';

export class Subscriber extends IEventSubscriber<IErc20Contracts, RawEvent> {
  private _name: string;

  private _listener: Listener | null;

  private subIntervalId: Timeout;

  protected readonly log;

  private eventSourceMap: EvmEventSourceMapType;

  protected lastBlockNumber: number;

  constructor(api: IErc20Contracts, name: string, verbose = false) {
    super(api, verbose);
    this._name = name;
    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.ERC20, this._name])
    );
  }

  private async estimateBlockTime(numEstimateBlocks = 10): Promise<number> {
    const provider = this._api.provider;

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
      this._api.provider,
      cb
    );
  }

  public unsubscribe(): void {
    if (this.subIntervalId) {
      clearInterval(this.subIntervalId);
      this.subIntervalId = null;
    }
  }

  public async addNewToken(
    tokenAddress: string,
    tokenName?: string,
    retryTimeMs = 10 * 1000,
    retries = 5
  ): Promise<void> {
    const log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.ERC20, tokenName])
    );
    const existingToken = this.api.tokens.find(({ contract }) => {
      return contract.address === tokenAddress;
    });
    if (existingToken) {
      log.info('Token is already being monitored');
      return;
    }
    try {
      const contract = ERC20Factory.connect(tokenAddress, this.api.provider);
      await contract.deployed();
      const totalSupply = new BN((await contract.totalSupply()).toString());
      this.api.tokens.push({ contract, totalSupply, tokenName });
      contract.on('*', this._listener.bind(this, tokenName));
    } catch (e) {
      await sleep(retryTimeMs);
      if (retries > 0) {
        log.error('Retrying connection...');
        this.addNewToken(tokenAddress, tokenName, retryTimeMs, retries - 1);
      }
    }
  }
}
