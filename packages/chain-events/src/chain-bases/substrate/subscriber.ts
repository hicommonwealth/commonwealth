/**
 * Fetches events from substrate chain in real time.
 */
import type { ApiPromise } from '@polkadot/api';
import type { VoidFn } from '@polkadot/api/types';
import type { Header, RuntimeVersion } from '@polkadot/types/interfaces';

import { IEventSubscriber, SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import type { Block } from './types';

export class Subscriber extends IEventSubscriber<ApiPromise, Block> {
  private _subscription: VoidFn;

  private _versionName: string;

  private _versionNumber: number;

  protected readonly log;

  constructor(
    protected readonly _api: ApiPromise,
    protected _verbose = false,
    origin?: string
  ) {
    super(_api);
    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.Substrate, origin])
    );
  }

  /**
   * Initializes subscription to chain and starts emitting events.
   */
  public async subscribe(cb: (block: Block) => void): Promise<void> {
    // wait for version available before we start producing blocks
    await new Promise<void>((resolve) => {
      this._api.rpc.state.subscribeRuntimeVersion((version: RuntimeVersion) => {
        this._versionNumber = +version.specVersion;
        this._versionName = version.specName.toString();
        this.log.info(
          `Fetched runtime version for ${this._versionName}: ${this._versionNumber}`
        );
        resolve();
      });
    });

    // subscribe to events and pass to block processor
    this._subscription = await this._api.rpc.chain.subscribeNewHeads(
      async (header: Header) => {
        const events = await this._api.query.system.events.at(header.hash);
        const signedBlock = await this._api.rpc.chain.getBlock(header.hash);
        const { extrinsics } = signedBlock.block;
        const block: Block = {
          header,
          events,
          extrinsics,
          versionNumber: this._versionNumber,
          versionName: this._versionName,
        };
        const logStr = `Fetched Block for ${this._versionName}:${
          this._versionNumber
        }: ${+block.header.number}`;
        // eslint-disable-next-line no-unused-expressions
        this._verbose ? this.log.info(logStr) : this.log.trace(logStr);
        cb(block);
      }
    );
  }

  public unsubscribe(): void {
    if (this._subscription) {
      this.log.info(`Unsubscribing from ${this._versionName}`);
      this._subscription();
      this._subscription = null;
    } else {
      this.log.info(`No subscriber to unsubscribe from`);
    }
  }
}
