import BN from 'bn.js';
import { IApp } from 'state';
import { from, of, Observable, BehaviorSubject } from 'rxjs';
import { switchMap, first } from 'rxjs/operators';

import { MPond } from 'adapters/chain/ethereum/types';

import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumChain from 'controllers/chain/ethereum/chain';

import { IMarlinHolder } from 'adapters/chain/marlin/types';
import MarlinHolders from './holders';
import MarlinChain from './chain';

export default class MarlinHolder extends EthereumAccount {
  private _isHolder: boolean;
  private _isDelegate: boolean;

  private _balance: BehaviorSubject<Comp> = new BehaviorSubject(null);
  private _delegates: BehaviorSubject<Comp> = new BehaviorSubject(null);

  private _Holders: MarlinHolders;

  public get balance(): Observable<Comp> {
    return from(this.initialized).pipe(
      switchMap(() => this.isHolder
        ? this._balance.asObservable()
        : of(new Comp(this._Holders.api.compAddress, 0)))
    );
  }

  public get isHolder() { return this._isHolder; }
  public get isDelegate() { return this._isDelegate; }
  public get getbalance() { return this._balance.value; }

  constructor(
    app: IApp,
    ChainInfo: MarlinChain,
    Accounts: EthereumAccounts,
    Holders: MarlinHolders,
    address: string,
    data?: IMarlinHolder
  ) {
    super(app, ChainInfo, Accounts, address);
    this._Holders = Holders;
    if (data) {
      if (address.toLowerCase() !== data.id.toLowerCase()) {
        throw new Error('Holder does not correspond with account');
      }
      this._isHolder = true;
      this._balance.next(new Comp(this._Holders.api.compAddress, new BN(data.balance)));
      this._delegates.next(new Comp(this._Holders.api.compAddress, new BN(data.delegates)));
      this._initialized = Promise.resolve(true);
    } else {
      this._initialized = new Promise((resolve, reject) => {
        this.refresh().then(() => resolve(true));
      });
    }
    Holders.store.add(this);
  }

  public async refresh() {
    const balance = await this._Holders.api.compContract?.balanceOf(this.address);
    if (!balance.isZero()) {
      this._isHolder = true;
      this._balance.next(new Comp(this._Holders.api.compAddress, new BN(balance.toString())));
    } else {
      this._isHolder = false;
      this._balance.next(new Comp(this._Holders.api.compAddress, new BN(0)));
    }
    const delegates = await this._Holders.api.compContract.getCurrentVotes(this.address);
    if (!delegates.isZero()) {
      this._isDelegate = true;
      this._delegates.next(new Comp(this._Holders.api.compAddress, new BN(delegates.toString())));
    } else {
      this._isDelegate = false;
      this._delegates.next(new Comp(this._Holders.api.compAddress, new BN(0)));
    }
  }

  public async priorDelegates(blockNumber: number | string) {
    const delegates = new BN((await this._Holders.api.compContract.getPriorVotes(this.address, blockNumber)).toString(), 10);
    return delegates || 0;
  }

  public async balanceOf() {
    const balance = await this._Holders.api.compContract.balanceOf(this.address);
    console.log('balanceOf Marlin Accounts', balance);
    if (!balance.isZero()) {
      this._isHolder = true;
      this._balance.next(new Comp(this._Holders.api.compAddress, new BN(balance.toString())));
    } else {
      this._isHolder = false;
      this._balance.next(new Comp(this._Holders.api.compAddress, new BN(0)));
    }
    return balance.toString();
  }
}
