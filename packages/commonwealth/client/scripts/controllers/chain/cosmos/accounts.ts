import type CosmosChain from 'controllers/chain/cosmos/chain';
import type { CosmosToken } from 'controllers/chain/cosmos/types';
import type { IAccountsModule } from 'models';
import type { IApp } from 'state';
import { AccountsStore } from 'stores';
import AddressAccount from 'models/AddressAccount';

export default class CosmosAccounts
  implements IAccountsModule<CosmosToken, AddressAccount>
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

  private _Chain: CosmosChain;

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
    // accepts bech32 encoded cosmosxxxxx addresses and not cosmospubxxx
    let acct;
    try {
      acct = this._store.getByAddress(address);
    } catch (e) {
      acct = new AddressAccount({
        address,
        chain: this.app.config.chains.getById(this.app.activeChainId()),
      });
    }
    return acct;
  }

  public deinit() {
    this._initialized = false;
    this.store.clear();
  }

  public async init(ChainInfo: CosmosChain): Promise<void> {
    this._Chain = ChainInfo;
    this._initialized = true;
  }
}
