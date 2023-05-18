/* eslint-disable no-use-before-define */
/* eslint-disable consistent-return */
import type {
  AccountId,
  Conviction,
} from '@polkadot/types/interfaces';
import type { Codec } from '@polkadot/types/types';
import type { SubstrateCoin } from 'adapters/chain/substrate/types';

import type { IApp } from 'state';
import { AccountsStore } from 'stores';
import Account from '../../../models/Account';
import { IAccountsModule } from '../../../models/interfaces';
import SubstrateChain from './shared';

type Delegation = [AccountId, Conviction] & Codec;

export class SubstrateAccount extends Account {
  private polkadot;

  // GETTERS AND SETTERS

  // The total balance
  public get balance(): Promise<SubstrateCoin> {
    if (!this._Chain?.apiInitialized) return;
    return this._Chain.api.derive.balances
      .all(this.address)
      .then(({ freeBalance, reservedBalance }) =>
        this._Chain.coins(freeBalance.add(reservedBalance))
      );
  }

  // The quantity of unlocked balance
  // TODO: note that this uses `availableBalance` and not `freeBalance` here -- this is because freeBalance
  //   only includes subtracted reserves, and not locks! And we want to see free for usage now.
  public get freeBalance(): Promise<SubstrateCoin> {
    if (!this._Chain?.apiInitialized) return;
    return this._Chain.api.derive.balances
      .all(this.address)
      .then(({ availableBalance }) => this._Chain.coins(availableBalance));
  }

  public get lockedBalance(): Promise<SubstrateCoin> {
    if (!this._Chain?.apiInitialized) return;
    return (
      this._Chain.api.derive.balances
        .all(this.address)
        // we compute illiquid balance by doing (total - available), because there's no query
        // or parameter to fetch it
        .then(({ availableBalance, votingBalance }) =>
          this._Chain.coins(votingBalance.sub(availableBalance))
        )
    );
  }

  public get bonded(): Promise<SubstrateAccount> {
    if (!this._Chain?.apiInitialized) return;
    return this._Chain.api.query.staking
      .bonded(this.address)
      .then((accountId) => {
        if (accountId && accountId.isSome) {
          return this._Accounts.fromAddress(accountId.unwrap().toString());
        } else {
          return null;
        }
      });
  }

  // Accounts may delegate their voting power for democracy referenda. This always incurs the maximum locktime
  public get delegation(): Promise<[SubstrateAccount, number]> {
    if (!this._Chain?.apiInitialized) return;
    // we have to hack around the type here because of the linked_map wrapper
    return this._Chain.api.query.democracy
      .delegations<Delegation[]>(this.address)
      .then(([delegation]: [Delegation]) => {
        const [delegatedTo, conviction] = delegation;
        if (delegatedTo.isEmpty || delegatedTo.toString() === this.address) {
          return null;
        } else {
          // console.log('set delegation for acct: ' + this.address);
          return [
            this._Accounts.fromAddress(delegatedTo.toString()),
            conviction.index,
          ];
        }
      });
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
    isEd25519 = false
  ) {
    if (!app.isModuleReady) {
      // defer chain initialization
      super({ chain: app.chain.meta, address });
      app.chainModuleReady.once('ready', () => {
        if (app.chain.chain instanceof SubstrateChain) {
          this._Chain = app.chain.chain;
        } else {
          console.error('Did not successfully initialize account with chain');
        }
      });
    } else {
      super({ chain: app.chain.meta, address });
      this._Chain = ChainInfo;
    }
    this.isEd25519 = isEd25519;
    this._Accounts = Accounts;
    this._Accounts.store.add(this);
  }
}

class SubstrateAccounts
  implements IAccountsModule<SubstrateCoin, SubstrateAccount>
{
  private _initialized = false;

  public get initialized() {
    return this._initialized;
  }

  // STORAGE
  private _store: AccountsStore<SubstrateAccount> = new AccountsStore();
  public get store() {
    return this._store;
  }

  private _Chain: SubstrateChain;

  private polkadot;

  public get(address: string, keytype?: string) {
    if (keytype && keytype !== 'ed25519' && keytype !== 'sr25519') {
      throw new Error(`invalid keytype: ${keytype}`);
    }
    return this.fromAddress(address, keytype && keytype === 'ed25519');
  }

  private _app: IApp;
  public get app() {
    return this._app;
  }

  constructor(app: IApp) {
    this._app = app;
  }

  public isZero(address: string) {
    const decoded = this.polkadot.decodeAddress(address);
    return decoded.every((v) => v === 0);
  }

  public fromAddress(address: string, isEd25519 = false): SubstrateAccount {
    try {
      this.polkadot.decodeAddress(address); // try to decode address; this will produce an error if the address is invalid
    } catch (e) {
      console.error(`Decoded invalid address: ${address}`);
      return;
    }
    try {
      const acct = this._store.getByAddress(address);
      // update account key type if created with incorrect settings
      if (acct.isEd25519 !== isEd25519) {
        return new SubstrateAccount(
          this.app,
          this._Chain,
          this,
          address,
          isEd25519
        );
      } else {
        return acct;
      }
    } catch (e) {
      return new SubstrateAccount(
        this.app,
        this._Chain,
        this,
        address,
        isEd25519
      );
    }
  }

  // TODO: can we remove these functions?
  public deinit() {
    this._initialized = false;
    this.store.clear();
  }

  public async init(ChainInfo: SubstrateChain): Promise<void> {
    this.polkadot = await import('@polkadot/keyring');
    this._Chain = ChainInfo;
    this._initialized = true;
  }
}

export default SubstrateAccounts;
