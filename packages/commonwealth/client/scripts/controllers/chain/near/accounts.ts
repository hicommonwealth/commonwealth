/* eslint-disable no-use-before-define */
import type { NearToken } from 'adapters/chain/near/types';
import type { IAccountsModule } from 'models';
import {Account, Account as NearJsAccount, keyStores} from 'near-api-js';
import type { AccountView } from 'near-api-js/lib/providers/provider';
import type { IApp } from 'state';
import { AccountsStore } from 'stores';
import type NearChain from './chain';
import AddressAccount from "models/AddressAccount";

// NOTE: this is the actual type of validators in the NodeStatus struct,
//    the library is wrong, it's not just a string.
interface INearValidator {
  account_id: string;
  is_slashed: boolean;
}

export interface INearValidators {
  [accountId: string]: {
    account: AddressAccount;
    isSlashed: boolean;
  };
}

export class NearAccounts implements IAccountsModule<NearToken, AddressAccount> {
  private _Chain: NearChain;
  private _store: AccountsStore<AddressAccount> = new AccountsStore();
  public get store() {
    return this._store;
  }

  private _validators: INearValidators = {};
  public get validators() {
    return this._validators;
  }

  private _app: IApp;
  public get app() {
    return this._app;
  }

  constructor(app: IApp) {
    this._app = app;
  }

  public get(address: string): AddressAccount {
    if (!this._Chain) return null; // We can't construct accounts if the NEAR chain isn't loaded
    return this.fromAddress(address);
  }

  public fromAddress(address: string): AddressAccount {
    let acct;
    try {
      acct = this._store.getByAddress(address);
    } catch (e) {
      acct = new AddressAccount({
        address,
        chain: this.app.config.chains.getById(this.app.activeChainId())
      });
    }
    return acct;
  }

  public async init(ChainInfo: NearChain): Promise<void> {
    this._Chain = ChainInfo;
    const validators = ChainInfo.nodeStatus
      .validators as unknown as INearValidator[];
    for (const validator of validators) {
      if (!this._validators[validator.account_id]) {
        this._validators[validator.account_id] = {
          account: this.get(validator.account_id),
          isSlashed: validator.is_slashed,
        };
      }
    }
  }

  public async deinit() {
    for (const v of Object.keys(this._validators)) {
      delete this._validators[v];
    }
    this.store.clear();
  }
}
