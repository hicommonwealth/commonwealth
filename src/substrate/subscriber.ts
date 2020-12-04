/**
 * Fetches events from substrate chain in real time.
 */
import { ApiPromise } from '@polkadot/api';
import { VoidFn } from '@polkadot/api/types';
import { Header, RuntimeVersion, Extrinsic } from '@polkadot/types/interfaces';

import { IEventSubscriber } from '../interfaces';
import { Block } from './types';

import { factory, formatFilename } from '../logging';
const log = factory.getLogger(formatFilename(__filename));

export class Subscriber extends IEventSubscriber<ApiPromise, Block> {
  private _subscription: VoidFn;
  private _versionName: string;
  private _versionNumber: number;

  /**
   * Initializes subscription to chain and starts emitting events.
   */
  public async subscribe(cb: (block: Block) => any): Promise<void> {
    // wait for version available before we start producing blocks
    await new Promise<void>((resolve) => {
      this._api.rpc.state.subscribeRuntimeVersion((version: RuntimeVersion) => {
        this._versionNumber = +version.specVersion;
        this._versionName = version.specName.toString();
        log.info(`Fetched runtime version for ${this._versionName}: ${this._versionNumber}`);
        resolve();
      });
    });

    // subscribe to events and pass to block processor
    this._subscription = await this._api.rpc.chain.subscribeNewHeads(async (header: Header) => {
      const events = await this._api.query.system.events.at(header.hash);
      const signedBlock = await this._api.rpc.chain.getBlock(header.hash);
      const extrinsics: Extrinsic[] = signedBlock.block.extrinsics;
      const block: Block = {
        header,
        events,
        extrinsics,
        versionNumber: this._versionNumber,
        versionName: this._versionName,
      };
      const logStr = `Fetched Block for ${this._versionName}:${this._versionNumber}: ${+block.header.number}`;
      this._verbose ? log.info(logStr) : log.trace(logStr);
      cb(block);
    });
  }

  public unsubscribe(): void {
    if (this._subscription) {
      this._subscription();
      this._subscription = null;
    }
  }
}
