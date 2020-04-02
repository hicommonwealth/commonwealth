/* eslint-disable consistent-return */
import { Observable, combineLatest, of, Observer, empty } from 'rxjs';
import { map, flatMap, auditTime, switchMap, first } from 'rxjs/operators';

import { ApiRx } from '@polkadot/api';
import { DeriveStakingValidators, DeriveAccountInfo } from '@polkadot/api-derive/types';
import Keyring, { decodeAddress } from '@polkadot/keyring';
import { KeyringPair, KeyringOptions } from '@polkadot/keyring/types';
import {
  AccountData, BalanceOf, BalanceLock, BalanceLockTo212,
  AccountId, Exposure, Conviction, StakingLedger, Registration
} from '@polkadot/types/interfaces';
import { Vec } from '@polkadot/types';
import { mnemonicValidate } from '@polkadot/util-crypto';
import { stringToU8a, u8aToHex, hexToU8a } from '@polkadot/util';

import { IApp } from 'state';
import { formatCoin } from 'adapters/currency';
import { Account, IAccountsModule } from 'models';
import { AccountsStore } from 'stores';
import { Codec } from '@polkadot/types/types';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import BN from 'bn.js';
import { constants } from 'ethers';
import SubstrateChain from './shared';
import { SubstrateIdentity } from './identity';



function addressFromSeed(seed: string, chain: SubstrateChain): string {
  return `${(chain.keyring()).addFromUri(`\/\/${seed}`).address}`;
}

function addressFromMnemonic(mnemonic: string, chain: SubstrateChain): string {
  if (!mnemonicValidate(mnemonic)) throw new Error('Invalid mnemonic');
  return `${(chain.keyring()).addFromMnemonic(mnemonic).address}`;
}

export interface IValidators {
  [address: string]: {
    exposure: Exposure,
    controller: string,
    isElected: boolean,
  };
}

class SubstrateAccounts implements IAccountsModule<SubstrateCoin, SubstrateAccount> {
  private _initialized: boolean = false;

  public get initialized() { return this._initialized; }

  // STORAGE
  private _store: AccountsStore<SubstrateAccount> = new AccountsStore();
  public get store() { return this._store; }

  private _Chain: SubstrateChain;

  public get(address: string, keytype?: string) {
    if (keytype && keytype !== 'ed25519' && keytype !== 'sr25519') {
      throw new Error(`invalid keytype: ${keytype}`);
    }
    return this.fromAddress(address, keytype && keytype === 'ed25519');
  }

  private _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp) {
    this._app = app;
  }

  public isZero(address: string) {
    const decoded = decodeAddress(address);
    return decoded.every((v) => v === 0);
  }

  public fromAddress(address: string, isEd25519 = false): SubstrateAccount {
    try {
      decodeAddress(address); // try to decode address; this will produce an error if the address is invalid
    } catch (e) {
      throw new Error(`invalid address: ${address}`);
    }
    try {
      const acct = this._store.getByAddress(address);
      // update account key type if created with incorrect settings
      if (acct.isEd25519 !== isEd25519) {
        return new SubstrateAccount(this.app, this._Chain, this, address, isEd25519);
      } else {
        return acct;
      }
    } catch (e) {
      return new SubstrateAccount(this.app, this._Chain, this, address, isEd25519);
    }
  }

  public fromSeed(seed: string): SubstrateAccount {
    const address = addressFromSeed(seed, this._Chain);
    const acct = this.fromAddress(address);
    acct.setSeed(seed);
    return acct;
  }

  public fromMnemonic(mnemonic: string): SubstrateAccount {
    const address = addressFromMnemonic(mnemonic, this._Chain);
    const acct = this.fromAddress(address);
    acct.setMnemonic(mnemonic);
    return acct;
  }

  public get validators(): Observable<IValidators> {
    return this._Chain.api.pipe(
      switchMap((api: ApiRx) => combineLatest(
        of(api),
        api.derive.staking.validators(),
      )),

      // fetch balances alongside validators
      flatMap(([api, { nextElected, validators: currentSet }]: [ApiRx, DeriveStakingValidators]) => {
        // set of not yet but future validators
        const toBeElected = nextElected.filter((v) => !currentSet.includes(v));
        console.log(toBeElected);

        // TODO: api.query.staking.stakers should be replaced with erasStakers as part of
        //  Kusama staking API upgrade (which we have not implemented)
        return combineLatest(
          of(currentSet),
          of(toBeElected),
          api.queryMulti(currentSet.map(
            (v) => [ api.query.staking.bonded, v.toString() ]
          )),
          api.queryMulti(currentSet.map(
            (v) => [ api.query.staking.stakers, v.toString() ]
          )),
          api.queryMulti(toBeElected.map(
            (v) => [ api.query.staking.bonded, v.toString() ]
          )),
          api.queryMulti(toBeElected.map(
            (v) => [ api.query.staking.stakers, v.toString() ]
          )),
        );
      }),
      auditTime(100),
      map(([currentSet, toBeElected, controllers, exposures, nextUpControllers, nextUpExposures]:
        [ AccountId[], AccountId[], Vec<AccountId>, Exposure[], Vec<AccountId>, Exposure[] ]) => {
        const result: IValidators = {};
        for (let i = 0; i < currentSet.length; ++i) {
          result[currentSet[i].toString()] = {
            exposure: exposures[i],
            controller: controllers[i].toString(),
            isElected: true,
          };
        }

        // add set of next elected
        for (let i = 0; i < toBeElected.length; ++i) {
          result[toBeElected[i].toString()] = {
            exposure: nextUpExposures[i],
            controller: nextUpControllers[i].toString(),
            isElected: false,
          };
        }
        return result;
      }),
    );
  }

  // TODO: can we remove these functions?
  public deinit() {
    this._initialized = false;
    this.store.clear();
  }

  public init(ChainInfo: SubstrateChain): Promise<void> {
    this._Chain = ChainInfo;
    this._initialized = true;
    return Promise.resolve();
  }
}

export default SubstrateAccounts;

type Delegation = [ AccountId, Conviction ] & Codec;

export class SubstrateAccount extends Account<SubstrateCoin> {
  // GETTERS AND SETTERS
  // staking
  public get stakedBalance(): Observable<SubstrateCoin> {
    if(!this._Chain?.apiInitialized) return;
    return this.stakingExposure.pipe(
      map((exposure) => this._Chain.coins(exposure ? exposure.total : NaN))
    );
  }

  // The total balance
  public get balance(): Observable<SubstrateCoin> {
    if(!this._Chain?.apiInitialized) return;
    return this._Chain.query((api: ApiRx) => api.derive.balances.all(this.address))
      .pipe(map(({
        freeBalance,
        reservedBalance,
      }) => this._Chain.coins(freeBalance.add(reservedBalance))));
  }

  // The quantity of unlocked balance
  public get freeBalance(): Observable<SubstrateCoin> {
    if(!this._Chain?.apiInitialized) return;
    return this._Chain.query((api: ApiRx) => api.derive.balances.all(this.address))
      .pipe(map(({ freeBalance }) => this._Chain.coins(freeBalance)));
  }

  // The amount of balance locked up in reserve
  public get reservedBalance(): Observable<SubstrateCoin> {
    // TODO: should this return all coins if a votelock is on the account?
    if(!this._Chain?.apiInitialized) return;
    return this._Chain.query((api: ApiRx) => api.derive.balances.all(this.address))
      .pipe(map(({ reservedBalance }) => this._Chain.coins(reservedBalance)));
  }

  public get miscFrozen(): Observable<SubstrateCoin> {
    if(!this._Chain?.apiInitialized) return;
    return this._Chain.query((api: ApiRx) => api.derive.balances.all(this.address))
      .pipe(map(({ frozenMisc }) => this._Chain.coins(frozenMisc)));
  }

  public get feeFrozen(): Observable<SubstrateCoin> {
    if(!this._Chain?.apiInitialized) return;
    return this._Chain.query((api: ApiRx) => api.derive.balances.all(this.address))
      .pipe(map(({ frozenFee }) => this._Chain.coins(frozenFee)));
  }

  public get lockedBalance(): Observable<SubstrateCoin> {
    if(!this._Chain?.apiInitialized) return;
    return this._Chain.query((api: ApiRx) => api.derive.balances.all(this.address))
      .pipe(map(({ lockedBalance }) => this._Chain.coins(lockedBalance)));
  }

  // public get voteLock(): Observable<number | null> {
  //   if (!this._Chain?.apiInitialized) return; // TODO
  //   return this._Chain.query((api: ApiRx) => api.query.democracy.locks(this.address))
  //     .pipe(map((lockOpt) => lockOpt.isSome ? lockOpt.unwrap().toNumber() : null));
  // }


  // returns true if the funds can be withdrawn
  public async canWithdraw(amount: BN, isTxFee = false): Promise<boolean> {
    // const isLocked = await this.voteLock.pipe(first()).toPromise();
    // if (isLocked > app.chain.block.height) {
    //   return false;
    // }

    const free = await this.freeBalance.pipe(first()).toPromise();
    const minimum = await (isTxFee
      ? this.feeFrozen.pipe(first()).toPromise()
      : this.miscFrozen.pipe(first()).toPromise());
    return free.sub(minimum).gte(amount);
  }

  // The coin locks this account has on them
  public get locks(): Observable<(BalanceLock | BalanceLockTo212)[]> {
    if(!this._Chain?.apiInitialized) return;
    return this._Chain.query((api: ApiRx) => api.derive.balances.all(this.address))
      .pipe(map(({ lockedBreakdown }) => (lockedBreakdown.length > 0 ? lockedBreakdown : [])));
  }

  // True iff this account is on the main substrate council
  // TODO: this only checks the council collective, we may want to include a list of all
  //   collective memberships.
  public get isCouncillor(): Observable<boolean> {
    if(!this._Chain?.apiInitialized) return;
    return this._Chain.query((api: ApiRx) => api.query.council.members())
      .pipe(map((members: Vec<AccountId>) => undefined !== members.find((m) => m.toString() === this.address)));
  }

  // The amount staked by this account & accounts who have nominated it
  public get stakingExposure(): Observable<Exposure> {
    if(!this._Chain?.apiInitialized) return;
    return this._Chain.query((api: ApiRx) => api.query.staking.stakers(this.address)) as Observable<Exposure>;
  }

  public get bonded(): Observable<SubstrateAccount> {
    if(!this._Chain?.apiInitialized) return;
    return this._Chain.query((api: ApiRx) => api.query.staking.bonded(this.address))
      .pipe(map((accountId) => {
        if (accountId && accountId.isSome) {
          return this._Accounts.fromAddress(accountId.unwrap().toString());
        } else {
          return null;
        }
      }));
  }

  public get stakingLedger(): Observable<StakingLedger> {
    if(!this._Chain?.apiInitialized) return;
    return this._Chain.query((api: ApiRx) => api.query.staking.ledger(this.address))
      .pipe(map((ledger) => {
        if (ledger && ledger.isSome) {
          return ledger.unwrap();
        } else {
          return null;
        }
      }));
  }

  // Accounts may set a proxy that can take council and democracy actions on behalf of their account
  public get proxyFor(): Observable<SubstrateAccount> {
    if(!this._Chain?.apiInitialized) return;
    return this._Chain.query((api: ApiRx) => api.query.democracy.proxy(this.address))
      .pipe(map((proxy) => {
        if (proxy && proxy.isSome) {
          return this._Accounts.fromAddress(proxy.unwrap().toString());
        } else {
          return null;
        }
      }));
  }

  // Accounts may delegate their voting power for democracy referenda. This always incurs the maximum locktime
  public get delegation(): Observable<[ SubstrateAccount, number ]> {
    if(!this._Chain?.apiInitialized) return;
    // we have to hack around the type here because of the linked_map wrapper
    return this._Chain.query((api: ApiRx) => api.query.democracy.delegations<Delegation[]>(this.address))
      .pipe(map(([ delegation ]: [ Delegation ]) => {
        const [ delegatedTo, conviction ] = delegation;
        if (delegatedTo.isEmpty || delegatedTo.toString() === this.address) {
          return null;
        } else {
          //console.log('set delegation for acct: ' + this.address);
          return [ this._Accounts.fromAddress(delegatedTo.toString()), conviction.index ];
        }
      }));
  }

  // returns all stash keys of validators that the account has nominated
  public get nominees(): Observable<SubstrateAccount[]> {
    return this._Accounts.validators.pipe(
      map((validators: IValidators) => Object.entries(validators)
        .filter(([ stash, { exposure }]) =>
          exposure.others.findIndex(({ who }) => who.toString() === this.address) !== -1)
        .map(([ stash ]) => this._Accounts.get(stash))
      ),
    );
  }

  public get identity(): Observable<Registration> {
    if (!this._Chain?.apiInitialized) return;
    return this._Chain.query((api: ApiRx) => api.query.identity.identityOf(this.address))
      .pipe(map((id) => {
        if (id.isSome) {
          return id.unwrap();
        } else {
          return null;
        }
      }));
  }

  private _Chain: SubstrateChain;

  private _Accounts: SubstrateAccounts;

  public readonly isEd25519: boolean;

  // CONSTRUCTORS
  constructor(app: IApp, ChainInfo: SubstrateChain, Accounts: SubstrateAccounts, address: string, isEd25519: boolean = false) {
    if (!ChainInfo) {
      // defer chain initialization
      super(app, app.chain.meta.chain, address, null);
      app.chainReady.pipe(first()).subscribe(() => {
        if (app.chain.chain instanceof SubstrateChain) {
          this._Chain = app.chain.chain;
          this.setEncoding(this._Chain.ss58Format);
        } else {
          console.error('Did not successfully initialize account with chain');
        }
      });
    } else {
      super(app, app.chain.meta.chain, address, ChainInfo.ss58Format);
      this._Chain = ChainInfo;
      this.setEncoding(this._Chain.ss58Format);
    }
    this.isEd25519 = isEd25519;
    this._Accounts = Accounts;
    this._Accounts.store.add(this);
  }

  public async signMessage(message: string): Promise<string> {
    const keyring = this._Chain.keyring(this.isEd25519);
    if (this.seed) {
      keyring.addFromUri(`\/\/${this.seed}`);
    } else if (this.mnemonic) {
      keyring.addFromMnemonic(this.mnemonic);
    } else {
      throw new Error('Account must have seed or mnemonic to sign messages');
    }
    const signature = keyring.getPair(this.address).sign(stringToU8a(message));
    return u8aToHex(signature).slice(2); // remove hex prefix, will be re-added on server
  }

  public async isValidSignature(message: string, signature: string): Promise<boolean> {
    const keyring = this._Chain.keyring(this.isEd25519).addFromAddress(this.address);
    return keyring.verify(stringToU8a(message), hexToU8a(`0x${signature}`));
  }

  // keys
  protected addressFromMnemonic(mnemonic: string) {
    return addressFromMnemonic(mnemonic, this._Chain);
  }

  protected addressFromSeed(seed: string) {
    return addressFromSeed(seed, this._Chain);
  }

  public getKeyringPair(): KeyringPair {
    if (!this.seed && !this.mnemonic) {
      throw new Error('Seed or mnemonic not found!');
    }
    if (this.seed) {
      return (this._Chain.keyring(this.isEd25519)).addFromUri(`\/\/${this.seed}`);
    } else {
      return (this._Chain.keyring(this.isEd25519)).addFromMnemonic(this.mnemonic);
    }
  }

  // TRANSACTIONS
  public async sendBalanceTx(recipient: SubstrateAccount, amount: SubstrateCoin) {
    console.log('send balance tx');
    const fundsAvailable = await this.canWithdraw(amount, false);
    if (!fundsAvailable) {
      throw new Error('not enough liquid funds');
    }
    return this._Chain.createTXModalData(
      this,
      (api: ApiRx) => api.tx.balances.transfer(recipient.address, amount),
      'balanceTransfer',
      `${formatCoin(amount)} to ${recipient.address}`
    );
  }

  public async setProxyTx(proxy: SubstrateAccount) {
    const proxyFor = await proxy.proxyFor.pipe(first()).toPromise();
    if (proxyFor) {
      throw new Error('already a proxy');
    }
    return this._Chain.createTXModalData(
      this,
      (api: ApiRx) => api.tx.democracy.setProxy(proxy.address),
      'setProxy',
      `${this.address} sets proxy to ${proxy.address}`
    );
  }

  public async resignProxyTx() {
    const proxyFor = await this.proxyFor.pipe(first()).toPromise();
    if (proxyFor) {
      throw new Error('not a proxy');
    }
    return this._Chain.createTXModalData(
      this,
      (api: ApiRx) => api.tx.democracy.resignProxy(),
      'resignProxy',
      `${this.address} resigns as proxy`
    );
  }

  public async removeProxyTx(proxy: SubstrateAccount) {
    const proxyFor = await proxy.proxyFor.pipe(first()).toPromise();
    if (!proxyFor) {
      throw new Error('not a proxy');
    }
    return this._Chain.createTXModalData(
      this,
      (api: ApiRx) => api.tx.democracy.removeProxy(proxy.address),
      'removeProxy',
      `${this.address} removes proxy ${proxy.address}`
    );
  }

  public delegateTx(toAccount: SubstrateAccount, conviction: Conviction) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiRx) => api.tx.democracy.delegate(toAccount.address, conviction),
      'delegate',
      `${this.address} delegates to ${toAccount.address}`
    );
  }

  public undelegateTx() {
    if (!this.delegation) {
      throw new Error('Account not delegated');
    }
    return this._Chain.createTXModalData(
      this,
      (api: ApiRx) => api.tx.democracy.undelegate(),
      'undelegate',
      `undelegating ${this.address}`
    );
  }

  public nominateTx(nominees: SubstrateAccount[]) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiRx) => api.tx.staking.nominate(nominees.map((n) => n.address)),
      'nominate',
      `${this.address} updates nominations`,
    );
  }

  public chillTx() {
    return this._Chain.createTXModalData(
      this,
      (api: ApiRx) => api.tx.staking.chill(),
      'chill',
      `${this.address} is chilling`
    );
  }

  public bondTx(controller: SubstrateAccount, amount: SubstrateCoin, rewardDestination: number | string) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiRx) => api.tx.staking.bond(
        controller.address,
        amount,
        this._Chain.createType('RewardDestination', rewardDestination),
      ),
      'bond',
      `${this.address} bonds ${amount.toString()} to controller ${controller.address}`,
    );
  }

  public bondExtraTx(amount: SubstrateCoin) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiRx) => api.tx.staking.bondExtra(amount),
      'bondExtra',
      `${this.address} bonds additional ${amount.toString()}`,
    );
  }

  public unbond(amount: SubstrateCoin) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiRx) => api.tx.staking.unbond(amount),
      'unbond',
      `${this.address} unbonds ${amount.toString()}`,
    );
  }

  public setController(controller: SubstrateAccount) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiRx) => api.tx.staking.setController(controller.address),
      'setController',
      `${this.address} sets controller ${controller.address}`,
    );
  }

  public setPayee(rewardDestination: number | string) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiRx) => api.tx.staking.setPayee(this._Chain.createType('RewardDestination', rewardDestination)),
      'setPayee',
      `${this.address} sets reward destination ${rewardDestination}`,
    );
  }

  public setKeys(sessionKeys: string) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiRx) => api.tx.session.setKeys(this._Chain.createType('Keys', sessionKeys), '0x'),
      'setKeys',
      `${this.address} sets session keys ${sessionKeys}`,
    );
  }

  public validateTx(validatorPrefs: number) {
    if (validatorPrefs < 0 || validatorPrefs > 100) return;
    const commission = Math.round(1000000000 * (validatorPrefs * 1.0 / 100));
    return this._Chain.createTXModalData(
      this,
      (api: ApiRx) => api.tx.staking.validate({
        commission: new BN(commission),
      }),
      'setKeys',
      `${this.address} sets validation commission ${this.validate}`,
    );
  }

  // Nickname module is not used by chains we are supporting now
  //
  // public get nickname(): Observable<string> {
  //   if (!this._Chain?.apiInitialized) return;
  //   return this._Chain.query((api: ApiRx) => api.derive.accounts.info(this.address))
  //     .pipe(map((id: DeriveAccountInfo) => {
  //       return id.nickname;
  //     }));
  // }

  // public async setNickname(name: string): Promise<any> {
  //   if (!this._Chain?.apiInitialized) return Promise.resolve();
  //   // check if user has enough funds to register a nickname
  //   const fundsAvailable = await this.canWithdraw(this._Chain.reservationFee, false);
  //   if (!fundsAvailable) {
  //     throw new Error('not enough liquid funds');
  //   }

  //   return this._Chain.createTXModalData(
  //     this,
  //     (api: ApiRx) => api.tx.nicks.setName(name),
  //     'setName',
  //     `set nickname to ${name}`
  //   );
  // }
}
