/**
 * Fetches events from substrate chain in real time.
 */
import { ApiPromise } from '@polkadot/api';
import { Header, RuntimeVersion, Extrinsic } from '@polkadot/types/interfaces';

import { IEventSubscriber } from '../interfaces';
import { SubstrateBlock } from './types';

import { factory, formatFilename } from '../../logging';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IEventSubscriber<ApiPromise, SubstrateBlock> {
  private _subscription: () => void;
  private _versionName: string;
  private _versionNumber: number;

  /**
   * Initializes subscription to chain and starts emitting events.
   */
  public subscribe(cb: (block: SubstrateBlock) => any) {
    // wait for version available before we start producing blocks
    new Promise((resolve) => {
      this._api.rpc.state.subscribeRuntimeVersion((version: RuntimeVersion) => {
        this._versionNumber = +version.specVersion;
        this._versionName = version.specName.toString();
        log.info(`Fetched runtime version for ${this._versionName}: ${this._versionNumber}`);
        resolve();
      });
    }).then(() => {
      // subscribe to events and pass to block processor
      return this._api.rpc.chain.subscribeNewHeads(async (header: Header) => {
        const events = await this._api.query.system.events.at(header.hash);
        const signedBlock = await this._api.rpc.chain.getBlock(header.hash);
        const extrinsics: Extrinsic[] = signedBlock.block.extrinsics;
        const block: SubstrateBlock = {
          header,
          events,
          extrinsics,
          versionNumber: this._versionNumber,
          versionName: this._versionName,
        };
        log.trace(`Fetched Block for ${this._versionName}:${this._versionNumber}: ${+block.header.number}`);
        cb(block);
      });
    }).then((subscription: () => void) => {
      this._subscription = subscription;
    });
  }

  public unsubscribe() {
    if (this._subscription) {
      this._subscription();
      this._subscription = null;
    }
  }
}
