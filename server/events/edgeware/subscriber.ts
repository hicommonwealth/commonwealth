/**
 * Fetches events from edgeware chain in real time.
 */
import { ApiPromise } from '@polkadot/api';
import { Header } from '@polkadot/types/interfaces';

import { IBlockSubscriber } from '../interfaces';
import Processor from './processor';
import { SubstrateConnectionOptions, SubstrateBlock, SubstrateEvent } from './types';
import { constructSubstrateApiPromise } from './util';

export default class extends IBlockSubscriber<SubstrateBlock, SubstrateEvent> {
  private _api: ApiPromise;
  private _subscription: () => void;

  constructor(
    protected _blockProcessor: Processor,
    protected _connectionOptions: SubstrateConnectionOptions,
  ) {
    super(_blockProcessor, _connectionOptions);
  }

  /**
   * Initializes subscription to chain and starts emitting events.
   */
  public async connect() {
    this._api = await constructSubstrateApiPromise(this._connectionOptions);

    // subscribe to events and pass to block processor
    this._subscription = await this._api.rpc.chain.subscribeNewHeads(async (header: Header) => {
      const events = await this._api.query.system.events.at(header.hash);
      const block: SubstrateBlock = { header, events };
      this._blockProcessor.process(block);
    });
  }

  /**
   * Halts emission of chain events.
   */
  public async disconnect() {
    if (this._subscription) {
      this._subscription();
      this._subscription = null;
    }
  }
}
