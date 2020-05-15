/**
 * Fetches events from a Moloch contract in real time.
 */
import { IEventSubscriber } from '../interfaces';
import { MolochApi } from '.';
import { MolochRawEvent } from './types';

import { factory, formatFilename } from '../../../server/util/logging';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IEventSubscriber<MolochApi, MolochRawEvent> {
  private _name: string;
  constructor(api: MolochApi, name: string) {
    super(api);
    this._name = name;
  }

  /**
   * Initializes subscription to chain and starts emitting events.
   */
  public subscribe(cb: (event: MolochRawEvent) => any) {
    this._api.on('*', (...args) => {
      log.info(`Received ${this._name} event: ${JSON.stringify(args, null, 2)}.`);
    });
  }

  public unsubscribe() {

  }
}
