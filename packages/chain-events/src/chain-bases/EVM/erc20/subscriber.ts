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
  private _name: string;

  private _listener: Listener | null;

  constructor(api: IErc20Contracts, name: string, verbose = false) {
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
      const log = factory.getLogger(
        addPrefix(__filename, [SupportedNetwork.ERC20, tokenName])
      );
      const logStr = `Received ${this._name} event: ${JSON.stringify(
        event,
        null,
        2
      )}.`;
      // eslint-disable-next-line no-unused-expressions
      this._verbose ? log.info(logStr) : log.trace(logStr);
      cb(event, tokenName);
    };
    this._api.tokens.forEach(({ contract, tokenName }) =>
      contract.on('*', this._listener.bind(this, tokenName))
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
    tokenName?: string,
    retryTimeMs = 10 * 1000,
    retries = 5
  ): Promise<void> {
    const log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.ERC20, tokenName])
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
      this.api.tokens.push({ contract, totalSupply, tokenName });
      contract.on('*', this._listener.bind(this, tokenName));
    } catch (e) {
      await sleep(retryTimeMs);
      if (retries > 0) {
        log.error('Retrying connection...');
        this.addNewToken(tokenAddress, tokenName, retryTimeMs, retries - 1);
      }
    }
  }
}
