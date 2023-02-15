import type { EthereumCoin } from 'adapters/chain/ethereum/types';
import assert from 'assert';
import type { IAccountsModule } from 'models';
import type { IApp } from 'state';
import { AccountsStore } from 'stores';
import type EthereumChain from './chain';
import AddressAccount from "models/AddressAccount";

// NOTE: this is just a boilerplate class; not verified to work yet.
// TODO: hook this up to rest of the application and verify that it works
class EthereumAccounts
  implements IAccountsModule<EthereumCoin, AddressAccount>
{
  private _initialized = false;
  public get initialized() {
    return this._initialized;
  }

  // STORAGE
  protected _store: AccountsStore<AddressAccount> = new AccountsStore();
  public get store() {
    return this._store;
  }

  private _Chain: EthereumChain;

  public get(address: string): AddressAccount {
    return this.fromAddress(address);
  }

  private _app: IApp;
  public get app() {
    return this._app;
  }

  constructor(app: IApp) {
    this._app = app;
  }

  public fromAddress(address: string): AddressAccount {
    if (address.indexOf('0x') !== -1) {
      assert(address.length === 42);
    } else {
      assert(address.length === 40);
      address = `0x${address}`;
    }
    try {
      return this._store.getByAddress(address);
    } catch (e) {
      const addressAccount = new AddressAccount({
        address,
        chain: this.app.config.chains.getById(this.app.activeChainId())
      })
      this._store.add(addressAccount)
      return addressAccount;
    }
  }

  public deinit() {
    this._initialized = false;
    this.store.clear();
  }

  public init(ChainInfo: EthereumChain): Promise<void> {
    this._Chain = ChainInfo;
    this._initialized = true;
    return Promise.resolve();
  }
}

export default EthereumAccounts;
