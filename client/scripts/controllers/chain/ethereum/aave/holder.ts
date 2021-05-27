import BN from 'bn.js';
import { Coin } from 'shared/adapters/currency';
import { IApp } from 'state';

import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import EthereumAccount from 'controllers/chain/ethereum/account';

import AaveHolders from './holders';
import AaveChain from './chain';

export default class AaveHolder extends EthereumAccount {
  private _isHolder: boolean;

  // TODO
  private _balance: Coin;

  private _Holders: AaveHolders;

  public get balance(): Promise<Coin> {
    // TODO
    return Promise.resolve(this._balance);
  }

  public get isHolder() { return this._isHolder; }

  constructor(
    app: IApp,
    ChainInfo: AaveChain,
    Accounts: EthereumAccounts,
    Holders: AaveHolders,
    address?: string,
  ) {
    super(app, ChainInfo, Accounts, address);
    this._Holders = Holders;
    this._initialized = new Promise((resolve) => {
      this.refresh().then(() => resolve(true));
    });
    Holders.store.add(this);
  }

  public async refresh() {
    const balance = await this._Holders.api.Contract?.balanceOf(this.address);
    // TODO
    if (!balance.isZero()) {
      this._isHolder = true;
      this._balance = new Coin('AAVE', new BN(balance.toString()));
    } else {
      this._isHolder = false;
      this._balance = new Coin('AAVE', new BN(0));
    }
    // TODO; delegates
  }
}
