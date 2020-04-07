/**
 * Fetches events from edgeware chain in real time.
 */
import { ApiPromise } from '@polkadot/api';
import { Header } from '@polkadot/types/interfaces';

import { IBlockSubscriber } from '../interfaces';
import { SubstrateBlock } from './types';

export default class extends IBlockSubscriber<ApiPromise, SubstrateBlock> {
  private _subscription;

  /**
   * Initializes subscription to chain and starts emitting events.
   */
  public subscribe(cb: (block: SubstrateBlock) => any) {
    // subscribe to events and pass to block processor
    this._subscription = this._api.rpc.chain.subscribeNewHeads(async (header: Header) => {
      const events = await this._api.query.system.events.at(header.hash);
      const block: SubstrateBlock = { header, events };
      console.log(`Block: ${block.header.number.toNumber()}`);
      cb(block);
    });
  }

  public unsubscribe() {
    if (this._subscription) {
      this._subscription();
      this._subscription = null;
    }
  }
}
