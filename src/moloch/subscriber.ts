/**
 * Fetches events from a Moloch contract in real time.
 */
import { Listener } from 'ethers/providers';

import { IEventSubscriber } from '../interfaces';
import { RawEvent, Api } from './types';

import { factory, formatFilename } from '../logging';
const log = factory.getLogger(formatFilename(__filename));

export class Subscriber extends IEventSubscriber<Api, RawEvent> {
  private _name: string;
  private _listener: Listener | null;
  constructor(api: Api, name: string, verbose = false) {
    super(api, verbose);
    this._name = name;
  }

  /**
   * Initializes subscription to chain and starts emitting events.
   */
  public subscribe(cb: (event: RawEvent) => any) {
    this._listener = (event: RawEvent) => {
      const logStr = `Received ${this._name} event: ${JSON.stringify(event, null, 2)}.`;
      this._verbose ? log.info(logStr) : log.trace(logStr);
      cb(event);
    };
    this._api.addListener('*', this._listener);
  }

  public unsubscribe() {
    if (this._listener) {
      this._api.removeListener('*', this._listener);
      this._listener = null;
    }
  }
}
