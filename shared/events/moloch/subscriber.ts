/**
 * Fetches events from a Moloch contract in real time.
 */
import { Listener } from 'ethers/providers';

import { IEventSubscriber } from '../interfaces';
import { MolochRawEvent, MolochApi } from './types';

import { factory, formatFilename } from '../../logging';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IEventSubscriber<MolochApi, MolochRawEvent> {
  private _name: string;
  private _listener: Listener | null;
  constructor(api: MolochApi, name: string) {
    super(api);
    this._name = name;
  }

  /**
   * Initializes subscription to chain and starts emitting events.
   */
  public subscribe(cb: (event: MolochRawEvent) => any) {
    this._listener = (event: MolochRawEvent) => {
      log.trace(`Received ${this._name} event: ${JSON.stringify(event, null, 2)}.`);
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
