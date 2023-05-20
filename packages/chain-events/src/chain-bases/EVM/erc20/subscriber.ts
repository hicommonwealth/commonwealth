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
    cb: (event: RawEvent, origin?: string) => void
  ): Promise<void> {
    this._listener = (origin: string, event: RawEvent): void => {
      const log = factory.getLogger(
        addPrefix(__filename, [SupportedNetwork.ERC20, origin])
      );
      const logStr = `Received ${this._origin} event: ${JSON.stringify(
        event,
        null,
        2
      )}.`;
      // eslint-disable-next-line no-unused-expressions
      this._verbose ? log.info(logStr) : log.trace(logStr);
      cb(event, origin);
    };
    this._api.tokens.forEach(({ contract, origin }) =>
      contract.on('*', this._listener.bind(this, origin))
    );
  }

  public unsubscribe(): void {
    if (this._listener) {
      this._api.tokens.forEach(({ contract }) => contract.removeAllListeners());
      this._listener = null;
    }
  }

  public async addNewToken(
    tokenAddress: string,
    origin?: string,
    retryTimeMs = 10 * 1000,
    retries = 5
  ): Promise<void> {
    const log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.ERC20, origin])
    );
    const existingToken = this.api.tokens.find(({ contract }) => {
      return contract.address === tokenAddress;
    });
    if (existingToken) {
      log.info('Token is already being monitored');
      return;
    }
    try {
      const contract = ERC20Factory.connect(tokenAddress, this.api.provider);
      await contract.deployed();
      const totalSupply = new BN((await contract.totalSupply()).toString());
      this.api.tokens.push({ contract, totalSupply, origin });
      contract.on('*', this._listener.bind(this, origin));
    } catch (e) {
      await sleep(retryTimeMs);
      if (retries > 0) {
        log.error('Retrying connection...');
        this.addNewToken(tokenAddress, origin, retryTimeMs, retries - 1);
      }
    }
  }
}
