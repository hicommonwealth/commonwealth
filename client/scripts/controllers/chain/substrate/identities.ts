import { IApp } from 'state';
import { StorageModule } from 'models';
import { PersistentStore } from 'stores';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import {
  Call,
  AccountId,
  RegistrarInfo,
  IdentityJudgement,
  IdentityFields
} from '@polkadot/types/interfaces';
import { Codec } from '@polkadot/types/types';
import { Vec, Option, Data } from '@polkadot/types';
import { Unsubscribable, Observable, of, never } from 'rxjs';
import { first, takeWhile, flatMap, filter } from 'rxjs/operators';
import { ApiRx } from '@polkadot/api';
import BN from 'bn.js';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import SubstrateIdentity, { ISubstrateIdentity } from './identity';

class SubstrateIdentityStore extends PersistentStore<ISubstrateIdentity, SubstrateIdentity> { }

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
  private _initializing: boolean = false;
  public get initializing() { return this._initializing; }

  protected _disabled: boolean = false;
  public get disabled() { return this._disabled; }
  public disable() { this._disabled = true; }

  private _store: SubstrateIdentityStore;
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

  private _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp) {
    this._app = app;
  }

  public deinit() {
    if (this._registrarSubscription) {
      this._registrarSubscription.unsubscribe();
    }
    this._initialized = false;
    if (!this.store) return; // TODO: why is the store sometimes missing? (#363)
    this.store.clear();
  }

  // cache for identity queries that haven't yet resolved conclusively as existing
  private _identityQueriesInProgress: { [address: string]: SubstrateIdentity } = {};

  // given an account, fetch the corresponding identity (works on sub-accounts)
  public get(who: SubstrateAccount): Observable<SubstrateIdentity> {
    // check immediately if we have the id
    const existingIdentity = this.store.getById(who.address);
    if (existingIdentity) {
      return of(existingIdentity);
    }

    // NOTE: the block of code below is commented out, because we do not necessarily want to
    //   resolve sub-addresses to their super-identities -- this is a decision requiring discussion.
    // check for a super-identity (maybe they passed in a sub address)
    // let acctToFetch = who;
    // const superId = await this._Chain.query(
    //   (api: ApiRx) => api.query.identity.superOf<Option<SuperCodec>>(who.address).pipe(first())
    // ).toPromise();
    // if (superId.isSome) {
    //   const superAcct = this._Accounts.get(superId.unwrap()[0].toString());
    //   const existingSuperId = this.store.getByIdentifier(superAcct.address);
    //   if (existingSuperId) {
    //     return of(existingSuperId);
    //   }
    //   acctToFetch = superAcct;
    // }

    // check on chain for registration we haven't seen yet & wait for it to appear
    let id = this._identityQueriesInProgress[who.address];
    let identityExists$: Observable<boolean>;
    if (!id) {
      // Create a new "empty" identity and wait to see if it exists
      id = new SubstrateIdentity(this._Chain, this._Accounts, this, who);
      id.subscribe();
      this._identityQueriesInProgress[who.address] = id;
      identityExists$ = id.exists$;
    } else {
      // we've already created the identity and are waiting to see if it exists
      identityExists$ = id.exists$;
    }
    return identityExists$.pipe(
      filter((v) => typeof v === 'boolean'),
      takeWhile((v) => !v, true),
      flatMap((v) => {
        // if true, then it should be in the store, and we can remove it from this cache.
        // the takeWhile above means the observable closes immediately after the identity exists.
        if (v === true) {
          delete this._identityQueriesInProgress[who.address];
          return of(id);
        }

        // if false, we keep it in the cache, and it will replay this "nonexistent" identity
        // value indefinitely (until it is registered)
        if (v === false) return of(id);

        // should never be null/undefined
        return never();
      })
    );
  }

  public init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts): Promise<void> {
    if (this._initializing || this._initialized || this.disabled) return;
    this._initializing = true;

    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._store = new SubstrateIdentityStore(
      this._app.chain.id,
      'identity',
      (s: ISubstrateIdentity) => {
        const id = new SubstrateIdentity(ChainInfo, Accounts, this, Accounts.fromAddress(s.address));
        id.deserialize(s);
        return id;
      }
    );
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
            this._initializing = false;
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

    // compute the basic required balance for the registration
    let requiredBalance = this.basicDeposit.add(this.fieldDeposit.muln(info.additional.length));

    // compare with preexisting deposit from old registration, if exists
    const oldId = this.store.getById(who.address);
    if (oldId && oldId.deposit.lt(requiredBalance)) {
      requiredBalance = requiredBalance.sub(oldId.deposit);
    } else if (oldId && oldId.deposit.gte(requiredBalance)) {
      requiredBalance = new BN(0);
    }

    // verify the account has sufficient funds based on above computation
    const txFunc = (api: ApiRx) => api.tx.identity.setIdentity(info);
    return this._Chain.createTXModalData(
      who,
      txFunc,
      'setIdentity',
      `${who.address} registers identity ${info.display.toString()}`
    );
  }

  public setRegistrarFeeTx(who: SubstrateAccount, regIdx: number, fee: SubstrateCoin) {
    return this._Chain.createTXModalData(
      who,
      (api: ApiRx) => api.tx.identity.setFee(regIdx, fee),
      'setFee',
      `registrar ${regIdx} updates fee to ${fee.format(true)}`,
    );
  }

  public setRegistrarAccountTx(who: SubstrateAccount, regIdx: number, newAcct: SubstrateAccount) {
    return this._Chain.createTXModalData(
      who,
      (api: ApiRx) => api.tx.identity.setAccountId(regIdx, newAcct.address),
      'setAccountId',
      `registrar ${regIdx} updates account to ${newAcct.address}`,
    );
  }

  public setRegistrarFieldsTx(who: SubstrateAccount, regIdx: number, fields: IdentityFields) {
    return this._Chain.createTXModalData(
      who,
      (api: ApiRx) => api.tx.identity.setFields(regIdx, fields),
      'setFee',
      `registrar ${regIdx} updates fields`,
    );
  }

  public providejudgementTx(
    who: SubstrateAccount,
    regIdx: number,
    target: SubstrateIdentity,
    judgement: IdentityJudgement
  ) {
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
