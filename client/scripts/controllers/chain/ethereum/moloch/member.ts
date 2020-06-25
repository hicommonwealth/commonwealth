import BN from 'bn.js';
import { IApp } from 'state';
import { from, of, Observable, BehaviorSubject } from 'rxjs';
import { switchMap, first } from 'rxjs/operators';

import { MolochShares } from 'adapters/chain/ethereum/types';
import { IMolochMember } from 'adapters/chain/moloch/types';

import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumChain from 'controllers/chain/ethereum/chain';

import MolochMembers from './members';

export default class MolochMember extends EthereumAccount {
  private _isMember: boolean;
  private _delegateKey: string;
  // shares is a behavior subject so long-running balance subscriptions will
  // deal with ragequit/other share holding changes correctly
  private _shares: BehaviorSubject<MolochShares> = new BehaviorSubject(null);
  private _highestIndexYesVote: BN;
  private _tokenTribute: BN; // Not populated

  private _Members: MolochMembers;

  public get balance(): Observable<MolochShares> {
    return from(this.initialized).pipe(
      switchMap(() => this.isMember
        ? this._shares.asObservable()
        : of(new MolochShares(this._Members.api.contractAddress, 0)))
    );
  }

  public get isMember() { return this._isMember; }
  public get delegateKey() { return this._delegateKey; }
  public get shares() { return this._shares.value; }
  public get highestIndexYesVote() { return this._highestIndexYesVote; }

  constructor(
    app: IApp,
    ChainInfo: EthereumChain,
    Accounts: EthereumAccounts,
    Members: MolochMembers,
    address: string,
    data?: IMolochMember
  ) {
    super(app, ChainInfo, Accounts, address);
    this._Members = Members;
    if (data) {
      if (address.toLowerCase() !== data.id.toLowerCase()) {
        throw new Error('member does not correspond with account');
      }
      this._isMember = true;
      this._delegateKey = data.delegateKey.toLowerCase();
      this._shares.next(new MolochShares(this._Members.api.contractAddress, new BN(data.shares)));
      this._highestIndexYesVote = data.highestIndexYesVote ? new BN(data.highestIndexYesVote) : null;
      this._initialized = Promise.resolve(true);
    } else {
      this._initialized = new Promise((resolve, reject) => {
        this.refresh().then(() => resolve(true));
      });
    }
    Members.store.add(this);
  }

  public async refresh() {
    const m = await this._Members.api.Contract.members(this.address);
    if (!m.exists) {
      this._isMember = false;
      this._shares.next(new MolochShares(this._Members.api.contractAddress, new BN(0)));
    } else {
      this._isMember = true;
      this._delegateKey = m.delegateKey.toLowerCase();
      this._shares.next(new MolochShares(this._Members.api.contractAddress, new BN(m.shares.toString())));
      this._highestIndexYesVote = m.highestIndexYesVote ? new BN(m.highestIndexYesVote.toString()) : null;
    }
  }

  public async updateDelegateKeyTx(delegateKey: string) {
    if (this._Members.api.userAddress !== this.address) {
      throw new Error('can only updateDelegateKey metamask verified user');
    }

    if (!(await this._Members.isSenderMember())) {
      throw new Error('caller must be member');
    }

    if (parseInt(delegateKey, 16) === 0) {
      throw new Error('delegate key cannot be 0');
    }

    // ensure delegate is not member
    const delegateMember = await this._Members.api.Contract.members(delegateKey);
    if (delegateMember.exists) {
      throw new Error('can\'t overwrite existing member');
    }

    // ensure no other member is using delegate
    const otherMemberDelegate = await this._Members.api.Contract.memberAddressByDelegateKey(delegateKey);
    if (parseInt(otherMemberDelegate, 16) !== 0) {
      throw new Error('other member already using delegate key');
    }

    const tx = await this._Members.api.Contract.updateDelegateKey(
      delegateKey,
      { gasLimit: this._Members.api.gasLimit }
    );
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('failed to update delegate key');
    }

    // trigger update to refresh key
    await this.refresh();
    return txReceipt;
  }


  public async ragequitTx(sharesToBurn: BN) {
    if (this._Members.api.userAddress !== this.address) {
      throw new Error('can only ragequit metamask verified user');
    }

    if (!(await this._Members.isSenderMember())) {
      throw new Error('sender must be member');
    }

    const shares = await this.balance.pipe(first()).toPromise();
    if (shares.lt(sharesToBurn)) {
      throw new Error('not enough shares');
    }

    // we can guarantee this is available bc we waited for balance above
    const highestIndexYesVote = this.highestIndexYesVote;
    const prop = await this._Members.api.Contract.proposalQueue(highestIndexYesVote.toString());
    if (!prop.processed) {
      throw new Error('must wait for last YES-voted proposal to process');
    }

    const tx = await this._Members.api.Contract.ragequit(
      sharesToBurn.toString(),
      { gasLimit: this._Members.api.gasLimit }
    );
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('failed to process ragequit');
    }

    // trigger update to refresh holdings
    await this.refresh();
    return txReceipt;
  }
}
