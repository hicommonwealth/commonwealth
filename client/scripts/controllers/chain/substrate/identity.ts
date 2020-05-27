import { Identity } from 'models';
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
import { Observable, Unsubscribable } from 'rxjs';
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

export default class SubstrateIdentity extends Identity<SubstrateCoin> {
  // override identity prop
  public readonly account: SubstrateAccount;

  private _judgements: RegistrationJudgement[];
  public get judgements() { return this._judgements; }

  private _deposit: SubstrateCoin;
  public get deposit() { return this._deposit; }

  private _info: IdentityInfo;
  public get info() { return this._info; }

  // set to false if identity was killed or cleared
  private _exists: boolean;
  public get exists() { return this._exists; }

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

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;
  private _Identities: SubstrateIdentities;

  // keeps track of changing registration info
  private _subscribe() {
    this._subscription = this._Chain.query((api: ApiRx) => api.query.identity.identityOf(this.account.address)
      .pipe(
        takeWhile((rOpt: Option<Registration>) => rOpt.isSome, true),
      ))
      .subscribe((rOpt: Option<Registration>) => {
        if (rOpt.isSome) {
          const { judgements, deposit, info } = rOpt.unwrap();
          this._judgements = judgements;
          this._deposit = this._Chain.coins(deposit);
          this._info = info;
        } else {
          this._exists = false;
          this._judgements = [];
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

  constructor(
    ChainInfo: SubstrateChain,
    Accounts: SubstrateAccounts,
    Identities: SubstrateIdentities,
    who: SubstrateAccount,
    registration: Registration
  ) {
    const { judgements, deposit, info } = registration;

    // we use the address of the identity's owner as its identifier
    super(who, who.address, info.display.toString());

    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Identities = Identities;

    this._judgements = judgements;
    this._deposit = this._Chain.coins(deposit);
    this._info = info;
    this._exists = true;

    this._Identities.store.add(this);
    // kick off subscription
    this._subscribe();
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
    // check that maxFee > judgement cost, and that account has enough funds
    const registrar = this._Identities.registrars[regIdx];
    if (!registrar) {
      throw new Error('registrar does not exist');
    }
    const fee = registrar.fee;
    if (fee.gt(maxFee)) {
      throw new Error('registrar fee greater than provided maxFee');
    }
    const previousJudgement = this.judgements.find(([ idx ]) => +idx === regIdx);
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
    const judgement = this.judgements.find(([ idx ]) => +idx === regIdx);
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
