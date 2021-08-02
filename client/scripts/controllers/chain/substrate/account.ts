/* eslint-disable consistent-return */
import { ApiPromise } from '@polkadot/api';
import { decodeAddress } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import {
  Balance, BalanceLock, BalanceLockTo212, EraIndex,
  AccountId, Exposure, Conviction, StakingLedger,
} from '@polkadot/types/interfaces';
import { Vec } from '@polkadot/types';
import { mnemonicValidate } from '@polkadot/util-crypto';
import { stringToU8a, u8aToHex } from '@polkadot/util';

import { IApp } from 'state';
import { formatCoin } from 'adapters/currency';
import { Account, IAccountsModule } from 'models';
import { AccountsStore } from 'stores';
import { Codec } from '@polkadot/types/types';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import BN from 'bn.js';
import SubstrateChain from './shared';

function addressFromSeed(seed: string, chain: SubstrateChain): string {
  return `${(chain.keyring()).addFromUri(`//${seed}`).address}`;
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
    prefs, // TODO
  };
}

type Delegation = [ AccountId, Conviction ] & Codec;

export class SubstrateAccount extends Account<SubstrateCoin> {
  // GETTERS AND SETTERS
  // staking
  public get stakedBalance(): Promise<SubstrateCoin> {
    if (!this._Chain?.apiInitialized) return;
    return this.stakingExposure.then(
      (exposure) => this._Chain.coins(exposure ? exposure.total : NaN)
    );
  }

  // The total balance
  public get balance(): Promise<SubstrateCoin> {
    if (!this._Chain?.apiInitialized) return;
    return this._Chain.api.derive.balances.all(this.address)
      .then(({
        freeBalance,
        reservedBalance,
      }) => this._Chain.coins(freeBalance.add(reservedBalance)));
  }

  // The quantity of unlocked balance
  // TODO: note that this uses `availableBalance` and not `freeBalance` here -- this is because freeBalance
  //   only includes subtracted reserves, and not locks! And we want to see free for usage now.
  public get freeBalance(): Promise<SubstrateCoin> {
    if (!this._Chain?.apiInitialized) return;
    return this._Chain.api.derive.balances.all(this.address)
      .then(({ availableBalance }) => this._Chain.coins(availableBalance));
  }

  public get lockedBalance(): Promise<SubstrateCoin> {
    if (!this._Chain?.apiInitialized) return;
    return this._Chain.api.derive.balances.all(this.address)
      // we compute illiquid balance by doing (total - available), because there's no query
      // or parameter to fetch it
      .then(({ availableBalance, votingBalance }) => this._Chain.coins(votingBalance.sub(availableBalance)));
  }

  // The coin locks this account has on them
  public get locks(): Promise<(BalanceLock | BalanceLockTo212)[]> {
    if (!this._Chain?.apiInitialized) return;
    return this._Chain.api.derive.balances.all(this.address)
      .then(({ lockedBreakdown }) => (lockedBreakdown.length > 0 ? lockedBreakdown : []));
  }

  // True iff this account is on the main substrate council
  // TODO: this only checks the council collective, we may want to include a list of all
  //   collective memberships.
  public get isCouncillor(): Promise<boolean> {
    if (!this._Chain?.apiInitialized) return;
    return this._Chain.api.query.council.members()
      .then((members: Vec<AccountId>) => undefined !== members.find((m) => m.toString() === this.address));
  }

  // The amount staked by this account & accounts who have nominated it
  public get stakingExposure(): Promise<Exposure> {
    if (!this._Chain?.apiInitialized) return;
    return this._Chain.api.query.staking.currentEra<EraIndex>()
      .then((era: EraIndex) => {
        // Different runtimes call for different access to stakers: old vs. new
        const stakersCall = (this._Chain.api.query.staking.stakers)
          ? this._Chain.api.query.staking.stakers
          : this._Chain.api.query.staking.erasStakers;
        // Different staking functions call for different function arguments: old vs. new
        const stakersCallArgs = (account) => (this._Chain.api.query.staking.stakers)
          ? [account]
          : [era.toString(), account];
        return stakersCall(...stakersCallArgs(this.address)) as Promise<Exposure>;
      });
  }

  public get bonded(): Promise<SubstrateAccount> {
    if (!this._Chain?.apiInitialized) return;
    return this._Chain.api.query.staking.bonded(this.address)
      .then((accountId) => {
        if (accountId && accountId.isSome) {
          return this._Accounts.fromAddress(accountId.unwrap().toString());
        } else {
          return null;
        }
      });
  }

  public get stakingLedger(): Promise<StakingLedger> {
    if (!this._Chain?.apiInitialized) return;
    return this._Chain.api.query.staking.ledger(this.address)
      .then((ledger) => {
        if (ledger && ledger.isSome) {
          return ledger.unwrap();
        } else {
          return null;
        }
      });
  }

  /*
  // Accounts may set a proxy that can take council and democracy actions on behalf of their account
  public get proxyFor(): Observable<SubstrateAccount> {
    if (!this._Chain?.apiInitialized) return;
    return this._Chain.api.query.democracy.proxy(this.address)
      .then((proxy) => {
        if (proxy && proxy.isSome) {
          return this._Accounts.fromAddress(proxy.unwrap().toString());
        } else {
          return null;
        }
      });
  }
  */

  // Accounts may delegate their voting power for democracy referenda. This always incurs the maximum locktime
  public get delegation(): Promise<[ SubstrateAccount, number ]> {
    if (!this._Chain?.apiInitialized) return;
    // we have to hack around the type here because of the linked_map wrapper
    return this._Chain.api.query.democracy.delegations<Delegation[]>(this.address)
      .then(([ delegation ]: [ Delegation ]) => {
        const [ delegatedTo, conviction ] = delegation;
        if (delegatedTo.isEmpty || delegatedTo.toString() === this.address) {
          return null;
        } else {
          // console.log('set delegation for acct: ' + this.address);
          return [ this._Accounts.fromAddress(delegatedTo.toString()), conviction.index ];
        }
      });
  }

  // returns all stash keys of validators that the account has nominated
  public get nominees(): Promise<SubstrateAccount[]> {
    return this._Accounts.validators.then(
      (validators: IValidators) => Object.entries(validators)
        .filter(([ stash, { exposure }]) => exposure.others.findIndex(
          ({ who }) => who.toString() === this.address
        ) !== -1)
        .map(([ stash ]) => this._Accounts.get(stash))
    );
  }

  private _Chain: SubstrateChain;

  private _Accounts: SubstrateAccounts;

  public readonly isEd25519: boolean;

  // CONSTRUCTORS
  constructor(
    app: IApp,
    ChainInfo: SubstrateChain,
    Accounts: SubstrateAccounts,
    address: string,
    isEd25519: boolean = false
  ) {
    if (!app.isModuleReady) {
      // defer chain initialization
      super(app, app.chain.meta.chain, address, null);
      app.chainModuleReady.once('ready', () => {
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
      keyring.addFromUri(`//${this.seed}`);
    } else if (this.mnemonic) {
      keyring.addFromMnemonic(this.mnemonic);
    } else {
      throw new Error('Account must have seed or mnemonic to sign messages');
    }
    const signature = keyring.getPair(this.address).sign(stringToU8a(message));
    return u8aToHex(signature).slice(2); // remove hex prefix, will be re-added on server
  }

  // keys
  protected async addressFromMnemonic(mnemonic: string) {
    return addressFromMnemonic(mnemonic, this._Chain);
  }

  protected async addressFromSeed(seed: string) {
    return addressFromSeed(seed, this._Chain);
  }

  public getKeyringPair(): KeyringPair {
    if (!this.seed && !this.mnemonic) {
      throw new Error('Seed or mnemonic not found!');
    }
    if (this.seed) {
      return (this._Chain.keyring(this.isEd25519)).addFromUri(`//${this.seed}`);
    } else {
      return (this._Chain.keyring(this.isEd25519)).addFromMnemonic(this.mnemonic);
    }
  }

  // TRANSACTIONS
  public get balanceTransferFee(): Promise<SubstrateCoin> {
    const txFee = this._Chain.api.consts.balances.transferFee as Balance;
    if (txFee) return Promise.resolve(this._Chain.coins(txFee));
    const dummyTxFunc = (api: ApiPromise) => api.tx.balances.transfer(this.address, '0');
    return this._Chain.computeFees(this.address, dummyTxFunc);
  }

  public async sendBalanceTx(recipient: SubstrateAccount, amount: SubstrateCoin) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiPromise) => api.tx.balances.transfer(recipient.address, amount),
      'balanceTransfer',
      `${formatCoin(amount)} to ${recipient.address}`
    );
  }

  public nominateTx(nominees: SubstrateAccount[]) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiPromise) => api.tx.staking.nominate(nominees.map((n) => n.address)),
      'nominate',
      `${this.address} updates nominations`,
    );
  }

  public chillTx() {
    return this._Chain.createTXModalData(
      this,
      (api: ApiPromise) => api.tx.staking.chill(),
      'chill',
      `${this.address} is chilling`
    );
  }

  public bondTx(controller: SubstrateAccount, amount: SubstrateCoin, rewardDestination: number | string) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiPromise) => api.tx.staking.bond(
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
      (api: ApiPromise) => api.tx.staking.bondExtra(amount),
      'bondExtra',
      `${this.address} bonds additional ${amount.toString()}`,
    );
  }

  public unbond(amount: SubstrateCoin) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiPromise) => api.tx.staking.unbond(amount),
      'unbond',
      `${this.address} unbonds ${amount.toString()}`,
    );
  }

  public setController(controller: SubstrateAccount) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiPromise) => api.tx.staking.setController(controller.address),
      'setController',
      `${this.address} sets controller ${controller.address}`,
    );
  }

  public setPayee(rewardDestination: number | string) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiPromise) => api.tx.staking.setPayee(this._Chain.createType('RewardDestination', rewardDestination)),
      'setPayee',
      `${this.address} sets reward destination ${rewardDestination}`,
    );
  }

  public setKeys(sessionKeys: string) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiPromise) => api.tx.session.setKeys(this._Chain.createType('Keys', sessionKeys), '0x'),
      'setKeys',
      `${this.address} sets session keys ${sessionKeys}`,
    );
  }

  public validateTx(validatorPrefs: number) {
    if (validatorPrefs < 0 || validatorPrefs > 100) return;
    const commission = Math.round(1000000000 * ((validatorPrefs * 1.0) / 100));
    return this._Chain.createTXModalData(
      this,
      (api: ApiPromise) => api.tx.staking.validate({
        commission: new BN(commission),
      }),
      'setKeys',
      `${this.address} sets validation commission ${this.validate}`,
    );
  }

  public unlockTx() {
    return this._Chain.createTXModalData(
      this,
      (api: ApiPromise) => api.tx.democracy.unlock(this.address),
      'unlock',
      `${this.address} attempts to unlock from democracy`,
    );
  }

  public claimNominatorPayoutTx(era, validators) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiPromise) => api.tx.staking.payoutNominator(era, validators),
      'unlock',
      `${this.address} attempts to unlock from democracy`,
    );
  }

  public claimValidatorPayoutTx(era) {
    return this._Chain.createTXModalData(
      this,
      (api: ApiPromise) => api.tx.staking.payoutValidator(era),
      'unlock',
      `${this.address} attempts to unlock from democracy`,
    );
  }
}
class SubstrateAccounts implements IAccountsModule<SubstrateCoin, SubstrateAccount> {
  private _initialized: boolean = false;
  private cachedValidators;

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
      console.error(`Decoded invalid address: ${address}`);
      return;
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

  public async fromSeed(seed: string): Promise<SubstrateAccount> {
    const address = addressFromSeed(seed, this._Chain);
    const acct = this.fromAddress(address);
    await acct.setSeed(seed);
    return acct;
  }

  public async fromMnemonic(mnemonic: string): Promise<SubstrateAccount> {
    const address = addressFromMnemonic(mnemonic, this._Chain);
    const acct = this.fromAddress(address);
    await acct.setMnemonic(mnemonic);
    return acct;
  }

  public getValidators() {
    return new Promise(async (resolve) => {
      if (this.cachedValidators) {
        resolve(this.cachedValidators);
      }

      this.validators.then((results) => {
        console.log(results);
        this.cachedValidators = Object.entries(results).map(([address, info]) => ({
          chain: this._Chain.app.chain?.meta?.id,
          stash: address,
          controller: info.controller,
          isElected: info.isElected,
          total: this._Chain.coins(info.exposure.total.toBn()),
          own: this._Chain.coins(info.exposure.own.toBn()),
          commission: info.prefs.commission?.toHuman(),
          nominators: info.exposure.others.length,
        }));
        resolve(this.cachedValidators);
      });
    });
  }

  public get validators(): Promise<IValidators> {
    return new Promise(async (resolve) => {
      const res = await this._Chain.api.derive.staking.validators();
      const { nextElected, validators: currentSet } = res;
      const era = await this._Chain.api.query.staking.currentEra<EraIndex>();

      // set of not yet but future validators
      const toBeElected = nextElected.filter((v) => !currentSet.includes(v));
      // Different runtimes call for different access to stakers: old vs. new
      const stakersCall = (this._Chain.api.query.staking.stakers)
        ? this._Chain.api.query.staking.stakers
        : this._Chain.api.query.staking.erasStakers;

      // Different staking functions call for different function arguments: old vs. new
      const stakersCallArgs = (account) => (this._Chain.api.query.staking.stakers)
        ? account
        : [era.toString(), account];
      const controllers = await this._Chain.api.query.staking.bonded
        .multi(currentSet.map((elt) => elt.toString()));
      const exposures: Exposure[] = await stakersCall
        .multi(currentSet.map((elt) => stakersCallArgs(elt.toString())));
      const validatorPrefs = await this._Chain.api.query.staking.erasValidatorPrefs
        .multi(currentSet.map((elt) => stakersCallArgs(elt.toString())));

      const nextUpControllers = await this._Chain.api.query.staking.bonded
        .multi(toBeElected.map((elt) => elt.toString()));
      const nextUpExposures: Exposure[] = await stakersCall
        .multi(toBeElected.map((elt) => stakersCallArgs(elt.toString())));
      const nextUpValidatorPrefs = await this._Chain.api.query.staking.erasValidatorPrefs
        .multi(toBeElected.map((elt) => stakersCallArgs(elt.toString())));

      const result: IValidators = {};
      for (let i = 0; i < currentSet.length; ++i) {
        result[currentSet[i].toString()] = {
          exposure: exposures[i],
          controller: controllers[i].toString(),
          prefs: validatorPrefs[i],
          isElected: true,
        };
      }

      // add set of next elected
      for (let i = 0; i < toBeElected.length; ++i) {
        result[toBeElected[i].toString()] = {
          exposure: nextUpExposures[i],
          controller: nextUpControllers[i].toString(),
          prefs: nextUpValidatorPrefs[i],
          isElected: false,
        };
      }
      resolve(result);
    });
  }

  // TODO: can we remove these functions?
  public deinit() {
    this._initialized = false;
    this.store.clear();
  }

  public async init(ChainInfo: SubstrateChain): Promise<void> {
    this._Chain = ChainInfo;
    this._initialized = true;
  }
}

export default SubstrateAccounts;
