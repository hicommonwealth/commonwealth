/**
 * Fetches events from ERC20 contract in real time.
 */
import type { Listener } from '@ethersproject/providers';
import sleep from 'sleep-promise';
import BN from 'bn.js';

import { IEventSubscriber, SupportedNetwork } from '../../../interfaces';
import { ERC20__factory as ERC20Factory } from '../../../contractTypes';
import { addPrefix, factory } from '../../../logging';

import type { RawEvent, IErc20Contracts } from './types';

export class Subscriber extends IEventSubscriber<IErc20Contracts, RawEvent> {
  private _origin: string;

  private _listener: Listener | null;

  constructor(api: IErc20Contracts, origin: string, verbose = false) {
    super(api, verbose);
    this._origin = origin;
  }

  /**
   * Initializes subscription to chain and starts emitting events.
   */
  public async subscribe(
    cb: (event: RawEvent, contractAddress: string) => void
  ): Promise<void> {
    this._listener = (contractAddress: string, event: RawEvent): void => {
      const log = factory.getLogger(
        addPrefix(__filename, [SupportedNetwork.ERC20, contractAddress])
      );
      const logStr = `Received ${this._origin} event: ${JSON.stringify(
        event,
        null,
        2
      )}.`;
      // eslint-disable-next-line no-unused-expressions
      this._verbose ? log.info(logStr) : log.trace(logStr);
      cb(event, contractAddress);
    };
    this._api.tokens.forEach(({ contract, contractAddress }) =>
      contract.on('*', this._listener.bind(this, contractAddress))
    );
  }

  public unsubscribe(): void {
    if (this._listener) {
      this._api.tokens.forEach(({ contract }) => contract.removeAllListeners());
      this._listener = null;
    }
  }
}
