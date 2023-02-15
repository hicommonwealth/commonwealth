/* eslint-disable no-use-before-define */
/* eslint-disable consistent-return */
import { decodeAddress } from '@polkadot/keyring';
import type {
  AccountId,
  Conviction,
} from '@polkadot/types/interfaces';
import type { Codec } from '@polkadot/types/types';
import type { SubstrateCoin } from 'adapters/chain/substrate/types';
import type { IAccountsModule } from 'models';

import type { IApp } from 'state';
import { AccountsStore } from 'stores';
import SubstrateChain from './shared';
import AddressAccount from "models/AddressAccount";

type Delegation = [AccountId, Conviction] & Codec;

class SubstrateAccounts
  implements IAccountsModule<SubstrateCoin, AddressAccount>
{
  private _initialized = false;

  public get initialized() {
    return this._initialized;
  }

  // STORAGE
  private _store: AccountsStore<AddressAccount> = new AccountsStore();
  public get store() {
    return this._store;
  }

  private _Chain: SubstrateChain;

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
    const decoded = decodeAddress(address);
    return decoded.every((v) => v === 0);
  }

  public fromAddress(address: string, isEd25519 = false): AddressAccount {
    try {
      decodeAddress(address); // try to decode address; this will produce an error if the address is invalid
    } catch (e) {
      console.error(`Decoded invalid address: ${address}`);
      return;
    }

    const keytype = isEd25519 ? 'ed25519': undefined;
    try {
      const acct = this._store.getByAddress(address);
      // update account key type if created with incorrect settings
      if (acct.keytype !== keytype) {
        return new AddressAccount({
          address,
          chain: this.app.config.chains.getById(this.app.activeChainId()),
          keytype
        })
      } else return acct;
    } catch (e) {
      return new AddressAccount({
        address,
        chain: this.app.config.chains.getById(this.app.activeChainId()),
        keytype
      })
    }
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
