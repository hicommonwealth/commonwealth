import { StorageModule, Identity } from 'models/models';
import { ProposalStore } from 'models/stores';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import { Call, Registration, RegistrationJudgement, BalanceOf, AccountId, IdentityInfo, RegistrarInfo, IdentityJudgement } from '@polkadot/types/interfaces';
import { Codec } from '@polkadot/types/types';
import { Vec, Option, Data } from '@polkadot/types';
import { IdentityFields } from '@polkadot/types/interfaces';
import { Observable, Unsubscribable } from 'rxjs';
import { map, takeWhile, first } from 'rxjs/operators';
import { ApiRx } from '@polkadot/api';
import BN from 'bn.js';

export class SubstrateIdentityStore extends ProposalStore<SubstrateIdentity> { }

export type SuperCodec = [ AccountId, Data ] & Codec;
export type IdentityInfoProps = {
  display?: any;
  legal?: any;
  web?: any;
  riot?: any;
  email?: any;
  pgpFingerprint?: any;
  twitter?: any;
  image?: any;
  additional: any[];
};

class SubstrateIdentities implements StorageModule {
  private _initialized: boolean = false;
  public get initialized() { return this._initialized; }

  private _store: SubstrateIdentityStore = new SubstrateIdentityStore();
  public get store() { return this._store; }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;

  private _registrarSubscription: Unsubscribable;
  private _registrars: Array<RegistrarInfo | null>; // with gaps
  public get registrars() { return this._registrars; }

  private _fieldDeposit: SubstrateCoin;
  private _basicDeposit: SubstrateCoin;
  private _subAcctDeposit: SubstrateCoin;
  private _maxSubAccts: number;
  private _maxAddlFields: number;
  public get fieldDeposit() { return this._fieldDeposit; }
  public get basicDeposit() { return this._basicDeposit; }
  public get subAcctDeposit() { return this._subAcctDeposit; }
  public get maxSubAccts() { return this._maxSubAccts; }
  public get maxAddlFields() { return this._maxAddlFields; }

  public deinit() {
    if (this._registrarSubscription) {
      this._registrarSubscription.unsubscribe();
    }
    this._initialized = false;
    this.store.clear();
  }

  // given an account, fetch the corresponding identity (works on sub-accounts)
  public async get(who: SubstrateAccount): Promise<SubstrateIdentity | null> {
    // check immediately if we have the id
    const existingIdentity = this.store.getByIdentifier(who.address);
    if (existingIdentity) {
      return existingIdentity;
    }

    // check for a super-identity (maybe they passed in a sub address)
    let acctToFetch = who;
    const superId = await this._Chain.query(
      (api: ApiRx) => api.query.identity.superOf<Option<SuperCodec>>(who.address).pipe(first())
    ).toPromise();
    if (superId.isSome) {
      const superAcct = this._Accounts.get(superId.unwrap()[0].toString());
      const existingSuperId = this.store.getByIdentifier(superAcct.address);
      if (existingSuperId) {
        return existingSuperId;
      }
      acctToFetch = superAcct;
    }

    // check on chain for registration we haven't seen yet
    // if we have a super address to fetch, grab that instead
    const idData: Option<Registration> = await this._Chain.query(
      (api: ApiRx) => api.query.identity.identityOf<Option<Registration>>(acctToFetch.address).pipe(first())
    ).toPromise();
    if (idData.isSome) {
      return new SubstrateIdentity(this._Chain, this._Accounts, this, acctToFetch, idData.unwrap());
    } else {
      // we tried hard, but it's not found!
      return null;
    }
  }

  public init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts): Promise<void> {
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    return new Promise((resolve) => {
      this._Chain.api.pipe(first()).subscribe((api: ApiRx) => {
        // init consts
        // XXX: for now, these aren't exposed in the Rust code. Which means the module isn't
        //   ready for use. Since the module isn't ready, the module is disabled on Substrate
        //   and Edgeware.
        //
        // pub const BasicDeposit: Balance = 10 * DOLLARS;       // 258 bytes on-chain
        // pub const FieldDeposit: Balance = 250 * CENTS;        // 66 bytes on-chain
        // pub const SubAccountDeposit: Balance = 2 * DOLLARS;   // 53 bytes on-chain
        // pub const MaxSubAccounts: u32 = 100;
        // pub const MaxAdditionalFields: u32 = 100;

        // this._basicDeposit = this._Chain.coins(api.consts.identity.basicDeposit as BalanceOf);
        // this._fieldDeposit = this._Chain.coins(api.consts.identity.fieldDeposit as BalanceOf);
        // this._subAcctDeposit = this._Chain.coins(api.consts.identity.subAccountDeposit as BalanceOf);
        // this._maxSubAccts = +api.consts.identity.maxSubAccounts;
        // this._maxAddlFields = +api.consts.identity.maxAdditionalFields;
        if (!this._basicDeposit) this._basicDeposit = this._Chain.coins(10, true);
        if (!this._fieldDeposit) this._fieldDeposit = this._Chain.coins(2.5, true);
        if (!this._subAcctDeposit) this._subAcctDeposit = this._Chain.coins(2, true);
        if (!this._maxSubAccts) this._maxSubAccts = 100;
        if (!this._maxAddlFields) this._maxAddlFields = 100;

        // kick off long-running subscription to registrars
        this._registrarSubscription = this._Chain.query(
          (apiRx: ApiRx) => apiRx.query.identity.registrars()
        ).subscribe((rs: Vec<Option<RegistrarInfo>>) => {
          this._registrars = rs.map((r) => r.unwrapOr(null));
          if (!this._initialized) {
            this._initialized = true;
            resolve();
          }
        });
      });
    });
  }

  // TRANSACTIONS
  // TODO: add helper for mashalling substrate Data fields
  public async setIdentityTx(who: SubstrateAccount, data: IdentityInfoProps) {
    const info = this._Chain.createType('IdentityInfo', data);
    if (info.additional.length > this.maxAddlFields) {
      throw new Error('too many additional fields');
    }

    // compute the basic required balance for the registration
    let requiredBalance = this.basicDeposit.add(this.fieldDeposit.muln(info.additional.length));

    // compare with preexisting deposit from old registration, if exists
    const oldId = this.store.getByIdentifier(who.address);
    if (oldId && oldId.deposit.lt(requiredBalance)) {
      requiredBalance = requiredBalance.sub(oldId.deposit);
    } else if (oldId && oldId.deposit.gte(requiredBalance)) {
      requiredBalance = new BN(0);
    }

    // verify the account has sufficient funds based on above computation
    if (requiredBalance.gtn(0)) {
      const canWithdraw = await who.canWithdraw(requiredBalance);
      if (!canWithdraw) {
        throw new Error('not enough funds to set identity');
      }
    }
    return this._Chain.createTXModalData(
      who,
      (api: ApiRx) => api.tx.identity.setIdentity(info),
      'setIdentity',
      `${who.address} registers identity ${info.display.toString()}`
    );
  }

  public setRegistrarFeeTx(who: SubstrateAccount, regIdx: number, fee: SubstrateCoin) {
    if (!this.registrars[regIdx] || !this.registrars[regIdx].account) {
      throw new Error('invalid registrar');
    }
    if (this.registrars[regIdx].account.toString() !== who.address) {
      throw new Error('invalid account');
    }
    return this._Chain.createTXModalData(
      who,
      (api: ApiRx) => api.tx.identity.setFee(regIdx, fee),
      'setFee',
      `registrar ${regIdx} updates fee to ${fee.format(true)}`,
    );
  }

  public setRegistrarAccountTx(who: SubstrateAccount, regIdx: number, newAcct: SubstrateAccount) {
    if (!this.registrars[regIdx] || !this.registrars[regIdx].account) {
      throw new Error('invalid registrar');
    }
    if (this.registrars[regIdx].account.toString() !== who.address) {
      throw new Error('invalid account');
    }
    return this._Chain.createTXModalData(
      who,
      (api: ApiRx) => api.tx.identity.setAccountId(regIdx, newAcct.address),
      'setAccountId',
      `registrar ${regIdx} updates account to ${newAcct.address}`,
    );
  }

  public setRegistrarFieldsTx(who: SubstrateAccount, regIdx: number, fields: IdentityFields) {
    if (!this.registrars[regIdx] || !this.registrars[regIdx].account) {
      throw new Error('invalid registrar');
    }
    if (this.registrars[regIdx].account.toString() !== who.address) {
      throw new Error('invalid account');
    }
    return this._Chain.createTXModalData(
      who,
      (api: ApiRx) => api.tx.identity.setFields(regIdx, fields),
      'setFee',
      `registrar ${regIdx} updates fields`,
    );
  }

  public providejudgementTx(who: SubstrateAccount, regIdx: number, target: SubstrateIdentity, judgement: IdentityJudgement) {
    if (!this.registrars[regIdx] || !this.registrars[regIdx].account) {
      throw new Error('invalid registrar');
    }
    if (this.registrars[regIdx].account.toString() !== who.address) {
      throw new Error('invalid account');
    }
    if (!target.exists) {
      throw new Error('target identity does not exist');
    }
    if (judgement.isFeePaid) {
      throw new Error('invalid judgement');
    }
    return this._Chain.createTXModalData(
      who,
      (api: ApiRx) => api.tx.identity.provideJudgement(regIdx, target.account.address, judgement),
      'providejudgement',
      `registrar ${regIdx} provides judgement for identity ${target.username}`,
    );
  }

  // requires RegistrarOrigin or Root!
  public addRegistrarMethod(account: SubstrateAccount): Call {
    const func = this._Chain.getTxMethod('identity', 'addRegistrar');
    return func(account.address).method;
  }

  // requires ForceOrigin or Root!
  public killIdentityMethod(target: SubstrateIdentity): Call {
    if (!target.exists) {
      throw new Error('target identity does not exist');
    }
    const func = this._Chain.getTxMethod('identity', 'killIdentity');
    return func(target.account.address).method;
  }
}

export default SubstrateIdentities;

export interface IIdentitySubs {
  subs: SubstrateAccount[];
  deposit: SubstrateCoin;
}

type SubsCodec = [ BalanceOf, Vec<AccountId> ] & Codec;

export class SubstrateIdentity extends Identity<SubstrateCoin> {
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
    return this._Chain.query((api: ApiRx) =>
      api.query.identity.subsOf(this.account.address).pipe(
        map((subResult: SubsCodec) => ({
          deposit: this._Chain.coins(subResult[0]),
          subs: subResult[1].map((v) => this._Accounts.get(v.toString())),
        }))
      )
    );
  }

  private _subscription: Unsubscribable;

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;
  private _Identities: SubstrateIdentities;

  // keeps track of changing registration info
  private _subscribe() {
    this._subscription = this._Chain.query((api: ApiRx) =>
      api.query.identity.identityOf(this.account.address).pipe(
        takeWhile((rOpt: Option<Registration>) => rOpt.isSome, true),
      )
    ).subscribe((rOpt: Option<Registration>) => {
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
    return this._Chain.query((api: ApiRx) =>
      api.query.identity.superOf(sub.address).pipe(
        map((dataOpt: Option<SuperCodec>) => {
          if (!dataOpt.isSome) {
            throw { msg: 'provided account is not a sub' };
          }
          const [ superAcct, name ] = dataOpt.unwrap();
          if (superAcct.toString() !== this.account.address) {
            throw { msg: 'provided account is not your sub' };
          }
          return name.toString();
        })
      )
    );
  }

  // TRANSACTIONS

  // arg is mapping from sub address to name
  public async setSubsTx(subs: { [address: string]: string }) {
    const nSubs = Object.keys(subs).length;
    if (nSubs > this._Identities.maxSubAccts) {
      throw new Error('too many sub accounts');
    }

    // compute required deposit, if necessary
    if (nSubs > 0) {
      let requiredDeposit = this._Identities.subAcctDeposit.muln(nSubs);
      const { deposit } = await this.subs().pipe(first()).toPromise();
      if (deposit.lt(requiredDeposit)) {
        requiredDeposit = requiredDeposit.sub(deposit);
        const canWithdraw = await this.account.canWithdraw(requiredDeposit);
        if (!canWithdraw) {
          throw new Error('not enough funds to set subs');
        }
      }
    }
    return this._Chain.createTXModalData(
      this.account,
      (api: ApiRx) => api.tx.identity.setSubs(Object.entries(subs)),
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
    const canWithdraw = await this.account.canWithdraw(fee);
    if (!canWithdraw) {
      throw new Error('not enough funds to request judgement');
    }
    const previousJudgement = this.judgements.find(([ idx ]) => +idx === regIdx);
    if (previousJudgement && (previousJudgement[1].isErroneous || previousJudgement[1].isFeePaid)) {
      throw new Error('judgement is sticky and cannot be re-requested');
    }
    return this._Chain.createTXModalData(
      this.account,
      (api: ApiRx) => api.tx.identity.requestJudgement(regIdx, maxFee),
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
