import _ from 'underscore';
import BN from 'bn.js';
import { Identity } from 'models';
import { IHasId, ISerializable } from 'stores';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import {
  Registration,
  RegistrationJudgement,
  BalanceOf,
  AccountId,
  IdentityInfo,
} from '@polkadot/types/interfaces';
import { Codec } from '@polkadot/types/types';
import { Vec, Option } from '@polkadot/types';
import { Data } from '@polkadot/types/primitive';
import { u8aToString } from '@polkadot/util';
import { Observable, Unsubscribable, BehaviorSubject } from 'rxjs';
import { map, takeWhile, first } from 'rxjs/operators';
import { ApiRx } from '@polkadot/api';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import SubstrateIdentities, { SuperCodec } from './identities';

export interface IIdentitySubs {
  subs: SubstrateAccount[];
  deposit: SubstrateCoin;
}

type SubsCodec = [ BalanceOf, Vec<AccountId> ] & Codec;

export enum IdentityQuality {
  Good = 'good',
  Bad = 'bad',
  Unknown = 'unknown',
}

export interface ISubstrateIdentity extends IHasId {
  address: string;
  username: string;
  quality: IdentityQuality;
  deposit: string;
  exists: boolean;
}

export default class SubstrateIdentity
  extends Identity<SubstrateCoin>
  implements ISerializable<ISubstrateIdentity> {
  // override identity prop
  public readonly account: SubstrateAccount;

  private _judgements: RegistrationJudgement[];
  private _info: IdentityInfo;
  public get info() { return this._info; }

  private _quality: IdentityQuality;
  public get quality() { return this._quality; }

  private _deposit: SubstrateCoin;
  public get deposit() { return this._deposit; }

  // set to false if identity was killed or cleared, null if unresolved
  private _exists: BehaviorSubject<boolean> = new BehaviorSubject(null);
  public get exists() { return this._exists.value; }
  public get exists$() { return this._exists.asObservable(); }

  // fetch all sub-accounts
  // all sub-accounts have names, but we don't currently fetch them, because
  // that requires a backward lookup for each. instead we expose a getter.
  public subs(): Observable<IIdentitySubs> {
    return this._Chain.query((api: ApiRx) => api.query.identity.subsOf(this.account.address)
      .pipe(
        map((subResult: SubsCodec) => ({
          deposit: this._Chain.coins(subResult[0]),
          subs: subResult[1].map((v) => this._Accounts.get(v.toString())),
        }))
      ));
  }

  private _subscription: Unsubscribable;
  public get subscribed() { return !!this._subscription; }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;
  private _Identities: SubstrateIdentities;

  private _update() {
    // update username
    const d2s = (d: Data) => u8aToString(d.toU8a()).replace(/[^\x20-\x7E]/g, '');
    this.username = d2s(this._info.display);

    // update quality based on Polkadot identity judgements. See:
    // https://github.com/polkadot-js/apps/blob/master/packages/react-components/src/AccountName.tsx#L126
    // https://github.com/polkadot-js/apps/blob/master/packages/react-components/src/AccountName.tsx#L182
    const isGood = _.some(this._judgements, (j) => j[1].toString() === 'KnownGood' || j[1].toString() === 'Reasonable');
    const isBad = _.some(this._judgements, (j) => j[1].toString() === 'Erroneous' || j[1].toString() === 'LowQuality');
    if (isGood) {
      this._quality = IdentityQuality.Good;
    } else if (isBad) {
      this._quality = IdentityQuality.Bad;
    } else if (!this._quality) {
      this._quality = IdentityQuality.Unknown;
    }
    if (this._Identities.store.getById(this.id)) {
      this._Identities.store.update(this);
    } else {
      this._Identities.store.add(this);
    }
  }

  // keeps track of changing registration info
  public subscribe() {
    if (this.subscribed) {
      return;
    }
    this._subscription = this._Chain.query((api: ApiRx) => api.query.identity.identityOf(this.account.address)
      // TODO: re-enable this pipe to close identity registration subscriptions immediately, rather than wait for them
      // Leaving it like this means more open subscriptions, but also we can update usernames in real-time.
      //   to potentially load.
      // .pipe(
      //   takeWhile((rOpt: Option<Registration>) => rOpt.isSome, true),
      // )
    ).subscribe((rOpt: Option<Registration>) => {
      if (rOpt.isSome) {
        const { judgements, deposit, info } = rOpt.unwrap();
        this._judgements = judgements;
        this._info = info;
        this._deposit = this._Chain.coins(deposit);
        this._update();
        if (!this.exists) {
          this._exists.next(true);
        }
      } else {
        this._exists.next(false);
        this._judgements = [];
        this._quality = IdentityQuality.Unknown;
        this._deposit = this._Chain.coins(0);
      }
    });
  }

  // unused -- subscription auto-terminated if account is killed
  public unsubscribe() {
    if (this._subscription) {
      this._subscription.unsubscribe();
    }
  }

  public serialize(): ISubstrateIdentity {
    return {
      id: this.id,
      address: this.account.address,
      username: this.username,
      quality: this.quality,
      deposit: this.deposit.toString('hex'),
      exists: this.exists,
    };
  }

  public deserialize(data: ISubstrateIdentity): void {
    // console.log(`Revived identity from localStorage: ${data.username}.`);
    this._deposit = this._Chain.coins(new BN(data.deposit, 'hex'));
    this._quality = data.quality;
    this.username = data.username;
    this._exists.next(data.exists);
    this.subscribe();
  }

  constructor(
    ChainInfo: SubstrateChain,
    Accounts: SubstrateAccounts,
    Identities: SubstrateIdentities,
    who: SubstrateAccount,
  ) {
    // we use the address of the identity's owner as its identifier
    super(who, who.address);

    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Identities = Identities;
  }

  public subName(sub: SubstrateAccount): Observable<string> {
    return this._Chain.query((api: ApiRx) => api.query.identity.superOf(sub.address)
      .pipe(
        map((dataOpt: Option<SuperCodec>) => {
          if (!dataOpt.isSome) {
            throw new Error('provided account is not a sub');
          }
          const [ superAcct, name ] = dataOpt.unwrap();
          if (superAcct.toString() !== this.account.address) {
            throw new Error('provided account is not your sub');
          }
          return name.toString();
        })
      ));
  }

  // TRANSACTIONS

  // arg is mapping from sub address to name
  public async setSubsTx(subs: { [address: string]: string }) {
    const nSubs = Object.keys(subs).length;
    if (nSubs > this._Identities.maxSubAccts) {
      throw new Error('too many sub accounts');
    }

    // compute required deposit, if necessary
    let requiredDeposit = this._Identities.subAcctDeposit.muln(nSubs);
    if (nSubs > 0) {
      const { deposit } = await this.subs().pipe(first()).toPromise();
      if (deposit.lt(requiredDeposit)) {
        requiredDeposit = requiredDeposit.sub(deposit);
      }
    }

    const txFunc = (api: ApiRx) => api.tx.identity.setSubs(Object.entries(subs));
    if (!(await this._Chain.canPayFee(this.account, txFunc, this._Chain.coins(requiredDeposit)))) {
      throw new Error('insufficient funds');
    }
    return this._Chain.createTXModalData(
      this.account,
      txFunc,
      'setSubs',
      `${this.username} updated subs`,
    );
  }

  public clearTx() {
    return this._Chain.createTXModalData(
      this.account,
      (api: ApiRx) => api.tx.identity.clearIdentity(),
      'clearIdentity',
      `${this.account.address} cleared identity`,
    );
  }

  public async requestJudgementTx(regIdx: number, maxFee: SubstrateCoin) {
    if (!this._judgements) throw new Error('judgements not yet loaded');
    // check that maxFee > judgement cost, and that account has enough funds
    const registrar = this._Identities.registrars[regIdx];
    if (!registrar) {
      throw new Error('registrar does not exist');
    }
    const fee = registrar.fee;
    if (fee.gt(maxFee)) {
      throw new Error('registrar fee greater than provided maxFee');
    }
    const previousJudgement = this._judgements.find(([ idx ]) => +idx === regIdx);
    if (previousJudgement && (previousJudgement[1].isErroneous || previousJudgement[1].isFeePaid)) {
      throw new Error('judgement is sticky and cannot be re-requested');
    }
    const txFunc = (api: ApiRx) => api.tx.identity.requestJudgement(regIdx, maxFee);
    if (!(await this._Chain.canPayFee(this.account, txFunc, this._Chain.coins(fee)))) {
      throw new Error('insufficient funds');
    }
    return this._Chain.createTXModalData(
      this.account,
      txFunc,
      'requestjudgement',
      `${this.username} requests judgement from registrar ${regIdx}`,
    );
  }

  public canceljudgementRequestTx(regIdx: number) {
    if (!this._judgements) throw new Error('judgements not yet loaded');
    const judgement = this._judgements.find(([ idx ]) => +idx === regIdx);
    if (!judgement) {
      throw new Error('judgement not found');
    } else {
      if (!judgement[1].isFeePaid) {
        throw new Error('judgement already given');
      }
    }
    return this._Chain.createTXModalData(
      this.account,
      (api: ApiRx) => api.tx.identity.cancelRequest(regIdx),
      'cancelRequest',
      `${this.username} canceled judgement request from registrar ${regIdx}`,
    );
  }
}
