import BN from 'bn.js';
import { IApp } from 'state';

import { MPond } from 'adapters/chain/ethereum/types';

import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import EthereumAccount from 'controllers/chain/ethereum/account';

import { IMarlinHolder } from 'adapters/chain/marlin/types';
import MarlinHolders from './holders';
import MarlinChain from './chain';

export default class MarlinHolder extends EthereumAccount {
  private _isHolder: boolean;
  private _isDelegate: boolean;

  private _balance: MPond;
  private _delegates: MPond;

  private _Holders: MarlinHolders;

  public get balance(): Promise<MPond> {
    return this.initialized.then(() => this.isHolder
      ? this._balance
      : new MPond(this._Holders.api.contractAddress, 0));
  }

  public get isHolder() { return this._isHolder; }
  public get isDelegate() { return this._isDelegate; }
  public get getbalance() { return this._balance; }

  constructor(
    app: IApp,
    ChainInfo: MarlinChain,
    Accounts: EthereumAccounts,
    Holders: MarlinHolders,
    address?: string,
    data?: IMarlinHolder
  ) {
    super(app, ChainInfo, Accounts, address);
    this._Holders = Holders;
    if (data) {
      if (address !== data.id) {
        throw new Error('Holder does not correspond with account');
      }
      this._isHolder = true;
      this._balance = new MPond(this._Holders.api.contractAddress, new BN(data.balance));
      this._delegates = new MPond(this._Holders.api.contractAddress, new BN(data.delegates));
      this._initialized = Promise.resolve(true);
    } else {
      this._initialized = new Promise((resolve, reject) => {
        this.refresh().then(() => resolve(true));
      });
    }
    Holders.store.add(this);
  }

  public async refresh() {
    const balance = await this._Holders.api.Contract?.balanceOf(this.address);
    if (!balance.isZero()) {
      this._isHolder = true;
      this._balance = new MPond(this._Holders.api.contractAddress, new BN(balance.toString()));
    } else {
      this._isHolder = false;
      this._balance = new MPond(this._Holders.api.contractAddress, new BN(0));
    }
    const delegates = await this._Holders.api.Contract.getCurrentVotes(this.address);
    if (!delegates.isZero()) {
      this._isDelegate = true;
      this._delegates = new MPond(this._Holders.api.contractAddress, new BN(delegates.toString()));
    } else {
      this._isDelegate = false;
      this._delegates = new MPond(this._Holders.api.contractAddress, new BN(0));
    }
  }

  public async priorDelegates(blockNumber: number | string) {
    const delegates = await this._Holders.api.Contract.getPriorVotes(this.address, blockNumber);
    return new BN(delegates.toString(), 10) || new BN(0);
  }

  public async balanceOf() {
    const balance = await this._Holders.api.Contract.balanceOf(this.address);
    console.log('balanceOf Marlin Accounts', balance);
    if (!balance.isZero()) {
      this._isHolder = true;
      this._balance = new MPond(this._Holders.api.contractAddress, new BN(balance.toString()));
    } else {
      this._isHolder = false;
      this._balance = new MPond(this._Holders.api.contractAddress, new BN(0));
    }
    return balance.toString();
  }
}
