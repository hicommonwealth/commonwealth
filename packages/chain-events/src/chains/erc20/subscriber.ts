/**
 * Fetches events from ERC20 contract in real time.
 */
import type {Listener, Log} from '@ethersproject/providers';
import sleep from 'sleep-promise';
import BN from 'bn.js';

import { IEventSubscriber, SupportedNetwork } from '../../interfaces';
import {ERC20, ERC20__factory as ERC20Factory} from '../../contractTypes';
import { addPrefix, factory } from '../../logging';

import type {RawEvent, IErc20Contracts} from './types';
import Timeout = NodeJS.Timeout;
import {ethers} from "ethers";

export class Subscriber extends IEventSubscriber<IErc20Contracts, RawEvent> {
  private _name: string;

  private _listener: Listener | null;

  private subIntervalId: Timeout;

  protected readonly log;

  constructor(api: IErc20Contracts, name: string, verbose = false) {
    super(api, verbose);
    this._name = name;
    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.Aave, this._name])
    );
  }

  /**
   * Initializes subscription to chain and starts emitting events.
   * @param cb A callback to execute for each event
   * @param numEstimateBlocks The number of blocks to search for the max block time
   */
  public async subscribe(cb: (event: RawEvent) => void, numEstimateBlocks = 10): Promise<void> {
    if (this.subIntervalId) {
      this.log.info('Already subscribed!');
      return;
    }

    // retrieves the last numEstimateBlocks blocks to estimate block time
    const currentBlockNum = await this._api.provider.getBlockNumber();
    this.log.info(`Current Block: ${currentBlockNum}`);
    const blockPromises = [];
    for (let i = currentBlockNum; i > currentBlockNum - numEstimateBlocks; i--) {
      blockPromises.push(this._api.provider.getBlock(i));
    }
    const blocks = await Promise.all(blockPromises);
    const timestamps = blocks.map(x => x.timestamp).reverse();
    let maxBlockTime = 0;
    for (let i = 1; i < timestamps.length; i++) {
      if (maxBlockTime < timestamps[i] - timestamps[i - 1]) maxBlockTime = timestamps[i] - timestamps[i - 1];
    }
    this.log.info(`Polling interval: ${maxBlockTime} seconds`);

    // TODO: keep track of the number of requests that return no blocks - adjust accordingly
    let lastBlockNumber: number;
    this.subIntervalId = setInterval(async () => {
      const currentBlockNum = await this._api.provider.getBlockNumber();
      console.log("New current block number:", currentBlockNum);
      if (lastBlockNumber && lastBlockNumber != currentBlockNum) {
        for (let i = lastBlockNumber + 1; i <= currentBlockNum; i++) {
          const block = await this._api.provider.getBlock(i)
          const logStr = `Received ${this._name} block: ${JSON.stringify(
            block,
            null,
            2
          )}.`;
          // eslint-disable-next-line no-unused-expressions
          this._verbose ? this.log.info(logStr) : this.log.trace(logStr);

          const logs = await this._api.provider.getLogs({
            fromBlock: lastBlockNumber,
            toBlock: currentBlockNum,
          });

          // create an object where the keys are contract addresses and the values are arrays containing all of the
          // event signatures from that contract that we want to listen for
          const tokenHashMap: { [address: string]: { eventSignatures: string[], contract: ERC20 }} = {};
          for (const token of this._api.tokens) {
            tokenHashMap[token.contract.address.toLowerCase()] = {
              eventSignatures: Object.keys(token.contract.interface.events).map(x => ethers.utils.id(x)),
              contract: token.contract
            };
            console.log(token.tokenName);
          }

          // filter the logs we need
          for (const log of logs) {
            if (tokenHashMap[log.address.toLowerCase()]?.eventSignatures.includes(log.topics[0])) {
              const parsedRawEvent = tokenHashMap[log.address.toLowerCase()].contract.interface.parseLog(log);

              const rawEvent: RawEvent = {
                address: log.address,
                args: parsedRawEvent.args as any,
                name: parsedRawEvent.name,
                blockNumber: log.blockNumber
              }
              cb(rawEvent);
            }
          }
        }
      }
      lastBlockNumber = currentBlockNum;
    }, maxBlockTime * 1000);
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
