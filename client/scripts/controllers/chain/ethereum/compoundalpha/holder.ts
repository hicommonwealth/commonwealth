import BN from 'bn.js';
import { IApp } from 'state';

import { Uni } from 'adapters/chain/ethereum/types';

import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import EthereumAccount from 'controllers/chain/ethereum/account';

import { ICompoundalphaHolder } from 'adapters/chain/compoundalpha/types';
import CompoundalphaHolders from './holders';
import CompoundalphaChain from './chain';

export default class CompoundalphaHolder extends EthereumAccount {
  private _isHolder: boolean;
  private _isDelegate: boolean;

  private _balance: Uni;
  private _delegates: Uni;

  private _Holders: CompoundalphaHolders;

  public get balance(): Promise<Uni> {
    return this.initialized.then(() => this.isHolder
      ? this._balance
      : new Uni(this._Holders.api.uniAddress, 0));
  }

  public get isHolder() { return this._isHolder; }
  public get isDelegate() { return this._isDelegate; }
  public get getbalance() { return this._balance; }

  constructor(
    app: IApp,
    ChainInfo: CompoundalphaChain,
    Accounts: EthereumAccounts,
    Holders: CompoundalphaHolders,
    address?: string,
    data?: ICompoundalphaHolder
  ) {
    super(app, ChainInfo, Accounts, address);
    this._Holders = Holders;
    if (data) {
      if (address.toLowerCase() !== data.id.toLowerCase()) {
        throw new Error('Holder does not correspond with account');
      }
      this._isHolder = true;
      this._balance = new Uni(this._Holders.api.uniAddress, new BN(data.balance));
      this._delegates = new Uni(this._Holders.api.uniAddress, new BN(data.delegates));
      this._initialized = Promise.resolve(true);
    } else {
      this._initialized = new Promise((resolve, reject) => {
        this.refresh().then(() => resolve(true));
      });
    }
    Holders.store.add(this);
  }

  public async refresh() {
    const balance = await this._Holders.api.uniContract?.balanceOf(this.address);
    if (!balance.isZero()) {
      this._isHolder = true;
      this._balance = new Uni(this._Holders.api.uniAddress, new BN(balance.toString()));
    } else {
      this._isHolder = false;
      this._balance = new Uni(this._Holders.api.uniAddress, new BN(0));
    }
    const delegates = await this._Holders.api.uniContract.getCurrentVotes(this.address);
    if (!delegates.isZero()) {
      this._isDelegate = true;
      this._delegates = new Uni(this._Holders.api.uniAddress, new BN(delegates.toString()));
    } else {
      this._isDelegate = false;
      this._delegates = new Uni(this._Holders.api.uniAddress, new BN(0));
    }
  }

  public async priorDelegates(blockNumber: number | string) {
    const delegates = await this._Holders.api.uniContract.getPriorVotes(this.address, blockNumber);
    return new BN(delegates.toString(), 10) || new BN(0);
  }

  public async balanceOf() {
    const balance = await this._Holders.api.uniContract.balanceOf(this.address);
    console.log('balanceOf Compoundalpha Accounts', balance);
    if (!balance.isZero()) {
      this._isHolder = true;
      this._balance = new Uni(this._Holders.api.uniAddress, new BN(balance.toString()));
    } else {
      this._isHolder = false;
      this._balance = new Uni(this._Holders.api.uniAddress, new BN(0));
    }
    return balance.toString();
  }
}
