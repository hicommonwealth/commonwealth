/**
 * Fetches events from ERC721 contract in real time.
 */
import type { Listener } from '@ethersproject/providers';
import sleep from 'sleep-promise';

import { IEventSubscriber, SupportedNetwork } from '../../../interfaces';
import { ERC721__factory as ERC721Factory } from '../../../contractTypes';
import { addPrefix, factory } from '../../../logging';

import type { RawEvent, IErc721Contracts } from './types';

export class Subscriber extends IEventSubscriber<IErc721Contracts, RawEvent> {
  private _name: string;

  private _listener: Listener | null;

  constructor(api: IErc721Contracts, name: string, verbose = false) {
    super(api, verbose);
    this._name = name;
  }

  /**
   * Initializes subscription to chain and starts emitting events.
   */
  public async subscribe(
    cb: (event: RawEvent, contractAddress: string) => void
  ): Promise<void> {
    this._listener = (contractAddress: string, event: RawEvent): void => {
      const log = factory.getLogger(
        addPrefix(__filename, [SupportedNetwork.ERC721, contractAddress])
      );
      const logStr = `Received ${this._name} event: ${JSON.stringify(
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
