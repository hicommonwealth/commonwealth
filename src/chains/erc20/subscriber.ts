/**
 * Fetches events from Compound contract in real time.
 */
import { Listener } from '@ethersproject/providers';
import sleep from 'sleep-promise';

import { IEventSubscriber } from '../../interfaces';
import { ERC20__factory as ERC20Factory } from '../../contractTypes';
import { factory, formatFilename } from '../../logging';

import { RawEvent, Api, Token } from './types';

const log = factory.getLogger(formatFilename(__filename));

export class Subscriber extends IEventSubscriber<Api, RawEvent> {
  private _name: string;

  public tokens: Token[];

  private _listener: Listener | null;

  constructor(api: Api, name: string, verbose = false) {
    super(api, verbose);
    this._name = name;
  }

  /**
   * Initializes subscription to chain and starts emitting events.
   */
  public async subscribe(
    cb: (event: RawEvent, tokenName?: string) => void
  ): Promise<void> {
    this._listener = (tokenName: string, event: RawEvent): void => {
      const logStr = `Received ${this._name} event: ${JSON.stringify(
        event,
        null,
        2
      )}.`;
      // eslint-disable-next-line no-unused-expressions
      this._verbose ? log.info(logStr) : log.trace(logStr);
      cb(event, tokenName);
    };
    this._api.tokens.forEach((o, index) =>
      o.on('*', this._listener.bind(this, this._api.tokenNames[index]))
    );
  }

  public unsubscribe(): void {
    if (this._listener) {
      this._api.tokens.forEach((o) => o.removeListener('*', this._listener));
      this._listener = null;
    }
  }

  public async addNewToken(
    tokenAddress: string,
    retryTimeMs = 10 * 1000,
    retries = 5
  ): Promise<void> {
    const existingToken = this.api.tokens.find((o) => {
      return o.address === tokenAddress;
    });
    if (existingToken) {
      log.info('Token is already being monitored');
      return;
    }
    try {
      const contract = ERC20Factory.connect(tokenAddress, this.api.provider);
      await contract.deployed();
      this.api.tokens.push(contract);
      contract.on('*', this._listener);
    } catch (e) {
      await sleep(retryTimeMs);
      if (retries > 0) {
        log.error('Retrying connection...');
        this.addNewToken(tokenAddress, retryTimeMs, retries - 1);
      }
    }
  }
}
