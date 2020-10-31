import BN from 'bn.js';
import { IApp } from 'state';
import { from, of, Observable, BehaviorSubject } from 'rxjs';
import { switchMap, first } from 'rxjs/operators';

import { Comp } from 'adapters/chain/ethereum/types';
// import { IMarlinHolder } from 'adapters/chain/Marlin/types';

import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumChain from 'controllers/chain/ethereum/chain';

import { IMarlinHolder } from 'adapters/chain/marlin/types';
import MarlinHolders from './holders';

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
    ChainInfo: EthereumChain,
    Accounts: EthereumAccounts,
    Holders: MarlinHolders,
    address: string,
    data?: IMarlinHolder
  ) {
    super(app, ChainInfo, Accounts, address);
    this._Holders = Holders;
    if (data) {
      if (address.toLowerCase() !== data.id.toLowerCase()) {
        throw new Error('member does not correspond with account');
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
    const balance = await this._Holders.api.compContract.balances(this.address);
    if (!balance.exists) {
      this._isHolder = false;
      this._balance.next(new Comp(this._Holders.api.compAddress, new BN(0)));
    } else {
      this._isHolder = true;
      this._balance.next(new Comp(this._Holders.api.compAddress, new BN(balance.toString())));
    }
  }

  // public async updateDelegateKeyTx(delegateKey: string) {
  //   if (this._Members.api.userAddress !== this.address) {
  //     throw new Error('can only updateDelegateKey metamask verified user');
  //   }

  //   if (!(await this._Members.isSenderMember())) {
  //     throw new Error('caller must be member');
  //   }

  //   if (parseInt(delegateKey, 16) === 0) {
  //     throw new Error('delegate key cannot be 0');
  //   }

  //   // ensure delegate is not member
  //   const delegateMember = await this._Members.api.Contract.members(delegateKey);
  //   if (delegateMember.exists) {
  //     throw new Error('can\'t overwrite existing member');
  //   }

  //   // ensure no other member is using delegate
  //   const otherMemberDelegate = await this._Members.api.Contract.memberAddressByDelegateKey(delegateKey);
  //   if (parseInt(otherMemberDelegate, 16) !== 0) {
  //     throw new Error('other member already using delegate key');
  //   }

  //   const tx = await this._Members.api.Contract.updateDelegateKey(
  //     delegateKey,
  //     { gasLimit: this._Members.api.gasLimit }
  //   );
  //   const txReceipt = await tx.wait();
  //   if (txReceipt.status !== 1) {
  //     throw new Error('failed to update delegate key');
  //   }

  //   // trigger update to refresh key
  //   await this.refresh();
  //   return txReceipt;
  // }


  // public async ragequitTx(sharesToBurn: BN) {
  //   if (this._Members.api.userAddress !== this.address) {
  //     throw new Error('can only ragequit metamask verified user');
  //   }

  //   if (!(await this._Members.isSenderMember())) {
  //     throw new Error('sender must be member');
  //   }

  //   const shares = await this.balance.pipe(first()).toPromise();
  //   if (shares.lt(sharesToBurn)) {
  //     throw new Error('not enough shares');
  //   }

  //   // we can guarantee this is available bc we waited for balance above
  //   const highestIndexYesVote = this.highestIndexYesVote;
  //   const prop = await this._Members.api.Contract.proposalQueue(highestIndexYesVote.toString());
  //   if (!prop.processed) {
  //     throw new Error('must wait for last YES-voted proposal to process');
  //   }

  //   const tx = await this._Members.api.Contract.ragequit(
  //     sharesToBurn.toString(),
  //     { gasLimit: this._Members.api.gasLimit }
  //   );
  //   const txReceipt = await tx.wait();
  //   if (txReceipt.status !== 1) {
  //     throw new Error('failed to process ragequit');
  //   }

  //   // trigger update to refresh holdings
  //   await this.refresh();
  //   return txReceipt;
  // }
}
