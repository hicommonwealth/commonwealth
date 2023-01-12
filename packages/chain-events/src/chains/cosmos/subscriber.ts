/**
 * Fetches events from Cosmos chain in real time.
 */
import type { Block } from '@cosmjs/tendermint-rpc';

import type { IDisconnectedRange } from '../../interfaces';
import { IEventSubscriber, SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import type { RawEvent, Api } from './types';

export class Subscriber extends IEventSubscriber<Api, RawEvent> {
  private _name: string;

  private _pollTime: number;

  private _listener: NodeJS.Timeout | null;

  private _lastBlockHeight: number = null;

  protected readonly log;

  constructor(api: Api, name: string, pollTime = 15 * 1000, verbose = false) {
    super(api, verbose);
    this._name = name;
    this._pollTime = pollTime;

    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.Cosmos, this._name])
    );
  }

  private async _queryBlocks(): Promise<Block[]> {
    const lastBlockHeight = this._lastBlockHeight;
    const currentBlock = await this.api.tm.block();
    const currentHeight = currentBlock.block.header.height;
    this._lastBlockHeight = currentHeight;
    if (lastBlockHeight === null) {
      // query initial block only when uninitialized
      return [currentBlock.block];
    }

    // query all blocks before latest, walking backwards from current
    const results = [currentBlock.block];
    for (let blockN = currentHeight - 1; blockN > lastBlockHeight; blockN--) {
      try {
        const block = await this.api.tm.block(blockN);
        results.push(block.block);
      } catch (e) {
        this.log.warn(
          `Failed to fetch block ${blockN} (${e.message}), aborting re-subscribe`
        );
        break;
      }
    }
    return results;
  }

  private async _blocksToEvents(blocks: Block[]): Promise<RawEvent[]> {
    // parse all transactions
    const events: RawEvent[] = [];
    for (const block of blocks) {
      const {
        header: { height },
      } = block;
      for (const tx of block.txs) {
        const cosm = await import('@cosmjs/proto-signing');
        const decodedTx = cosm.decodeTxRaw(tx);
        const {
          body: { messages },
        } = decodedTx;
        for (const message of messages) {
          events.push({ height, message });
        }
      }
    }
    return events;
  }

  /**
   * Initializes subscription to chain and starts emitting events.
   */
  public async subscribe(
    cb: (event: RawEvent) => void,
    disconnectedRange?: IDisconnectedRange
  ): Promise<void> {
    if (disconnectedRange?.startBlock) {
      // set disconnected range to recover past blocks via "polling"
      this._lastBlockHeight = disconnectedRange.startBlock;
      this.log.info(
        `Polling Cosmos "${this._name}" events from ${this._lastBlockHeight}.`
      );
    }
    const listenFunc = async () => {
      const blocks = await this._queryBlocks();
      const events = await this._blocksToEvents(blocks);
      for (const event of events) {
        cb(event);
      }
    };
    await listenFunc();
    this.log.info(`Starting Cosmos "${this._name}" listener.`);
    this._listener = setInterval(listenFunc, this._pollTime);
  }

  public unsubscribe(): void {
    if (this._listener) {
      clearInterval(this._listener);
      this._listener = null;
    }
  }
}
