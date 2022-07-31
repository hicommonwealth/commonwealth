/**
 * Fetches events from a Moloch contract in real time.
 */
import { Listener } from '@ethersproject/providers';

import { IEventSubscriber, SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import { RawEvent, Api } from './types';

export class Subscriber extends IEventSubscriber<Api, RawEvent> {
  private _name: string;

  private _listener: Listener | null;

  private log;

  constructor(api: Api, name: string, verbose = false) {
    super(api, verbose);
    this._name = name;
    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.Moloch, this._name])
    );
  }

  /**
   * Initializes subscription to chain and starts emitting events.
   */
  public async subscribe(cb: (event: RawEvent) => void): Promise<void> {
    this._listener = (event: RawEvent): void => {
      const logStr = `Received ${this._name} event: ${JSON.stringify(
        event,
        null,
        2
      )}.`;
      // eslint-disable-next-line no-unused-expressions
      this._verbose ? this.log.info(logStr) : this.log.trace(logStr);
      cb(event);
    };
    this._api.on('*', this._listener);
  }

  public unsubscribe(): void {
    if (this._listener) {
      this.log.info(`Unsubscribing from ${this._name}`);
      this._api.removeListener('*', this._listener);
      this._listener = null;
    }
  }
}
