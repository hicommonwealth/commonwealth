/**
 * Fetches events from Compound contract in real time.
 */
import type { Listener } from '@ethersproject/providers';

import { IEventSubscriber, SupportedNetwork } from '../../../interfaces';
import { addPrefix, factory } from '../../../logging';

import type { RawEvent, Api } from './types';

export class Subscriber extends IEventSubscriber<Api, RawEvent> {
  private readonly _origin: string;

  private _listener: Listener | null;

  protected readonly log;

  constructor(api: Api, origin: string, verbose = false) {
    super(api, verbose);
    this._origin = origin;

    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.Compound, this._origin])
    );
  }

  /**
   * Initializes subscription to chain and starts emitting events.
   */
  public async subscribe(cb: (event: RawEvent) => void): Promise<void> {
    this._listener = (event: RawEvent): void => {
      const logStr = `Received ${this._origin} event: ${JSON.stringify(
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
      this._api.removeListener('*', this._listener);
      this._listener = null;
    }
  }
}
