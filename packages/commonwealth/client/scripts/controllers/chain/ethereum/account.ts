import { EthereumCoin } from 'adapters/chain/ethereum/types';
import BN from 'bn.js';
import type { IApp } from 'state';
import Account from '../../../models/Account';
import type EthereumAccounts from './accounts';
import EthereumChain from './chain';

export default class EthereumAccount extends Account {
  // TODO: @Timothee this function is not used so this entire object is useless
  public get balance(): Promise<EthereumCoin> {
    if (!this._Chain) return; // TODO
    return this._Chain.api.eth
      .getBalance(this.address)
      .then((v) => new EthereumCoin('ETH', new BN(v), false));
  }

  protected _initialized: Promise<boolean>;
  get initialized(): Promise<boolean> {
    return this._initialized;
  }

  private _Chain: EthereumChain;
  private _Accounts: EthereumAccounts;

  // CONSTRUCTORS
  constructor(
    app: IApp,
    ChainInfo: EthereumChain,
    Accounts: EthereumAccounts,
    address: string,
    ignoreProfile = true
  ) {
    super({ community: app.chain.meta, address, ignoreProfile });
    if (!app.isModuleReady) {
      // defer chain initialization
      app.chainModuleReady.once('ready', () => {
        if (app.chain.chain instanceof EthereumChain) {
          this._Chain = app.chain.chain;
        } else {
          console.error('Did not successfully initialize account with chain');
        }
      });
    } else {
      this._Chain = ChainInfo;
    }
    this._Accounts = Accounts;
    this._Accounts.store.add(this);
  }
}
