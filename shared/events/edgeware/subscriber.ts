/**
 * Fetches events from edgeware chain in real time.
 */
import { ApiPromise } from '@polkadot/api';
import { Header, RuntimeVersion } from '@polkadot/types/interfaces';

import { IBlockSubscriber } from '../interfaces';
import { SubstrateBlock } from './types';

export default class extends IBlockSubscriber<ApiPromise, SubstrateBlock> {
  private _subscription;
  private _runtimeVersion: number;

  /**
   * Initializes subscription to chain and starts emitting events.
   */
  public subscribe(cb: (block: SubstrateBlock) => any) {
    // wait for version available before we start producing blocks
    const runtimeVersionP = new Promise((resolve) => {
      this._api.rpc.state.subscribeRuntimeVersion((version: RuntimeVersion) => {
        this._runtimeVersion = +version.specVersion;
        console.log(`Subscriber fetched runtime version: ${this._runtimeVersion}`);
        resolve();
      });
    });
    runtimeVersionP.then(() => {
      // subscribe to events and pass to block processor
      this._subscription = this._api.rpc.chain.subscribeNewHeads(async (header: Header) => {
        const events = await this._api.query.system.events.at(header.hash);
        const block: SubstrateBlock = { header, events, version: this._runtimeVersion };
        // TODO: add logging prefix output
        console.log(`Subscriber fetched Block: ${+block.header.number}`);
        cb(block);
      });
    });
  }

  public unsubscribe() {
    if (this._subscription) {
      this._subscription();
      this._subscription = null;
    }
  }
}
