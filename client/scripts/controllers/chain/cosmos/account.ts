import _ from 'lodash';
import { IApp } from 'state';
import { CosmosToken } from 'adapters/chain/cosmos/types';
import CosmosChain from 'controllers/chain/cosmos/chain';
import { Account, IAccountsModule, ITXModalData } from 'models';
import { AccountsStore } from 'stores';

export class CosmosAccount extends Account<CosmosToken> {
  private _Chain: CosmosChain;
  private _Accounts: CosmosAccounts;

  // TODO
  private _balance: CosmosToken;
  public get balance(): Promise<CosmosToken> { return Promise.resolve(this._balance); }

  constructor(app: IApp, ChainInfo: CosmosChain, Accounts: CosmosAccounts, address: string) {
    super(app, app.chain.meta.chain, address);
    if (!app.isModuleReady) {
      // defer chain initialization
      app.chainModuleReady.once('ready', () => {
        if (app.chain.chain instanceof CosmosChain) this._Chain = app.chain.chain;
        else console.error('Did not successfully initialize account with chain');
      });
    } else {
      this._Chain = ChainInfo;
    }
    this._Accounts = Accounts;
    this._Accounts.store.add(this);
  }

  protected addressFromMnemonic(mnemonic: string): string {
    throw new Error('not valid on Cosmos');
  }

  protected addressFromSeed(seed: string): string {
    throw new Error('not valid on Cosmos');
  }

  public async signMessage(message: string): Promise<string> {
    throw new Error('not valid on Cosmos');
  }

  public sendBalanceTx(recipient: Account<CosmosToken>, amount: CosmosToken): ITXModalData | Promise<ITXModalData> {
    throw new Error('not valid on Cosmos');
  }
}

export class CosmosAccounts implements IAccountsModule<CosmosToken, CosmosAccount> {
  private _initialized: boolean = false;
  public get initialized() { return this._initialized; }

  // STORAGE
  private _store: AccountsStore<CosmosAccount> = new AccountsStore();
  public get store() { return this._store; }

  private _Chain: CosmosChain;

  public get(address: string) {
    return this.fromAddress(address);
  }

  private _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp) {
    this._app = app;
  }

  public fromAddress(address: string): CosmosAccount {
    // accepts bech32 encoded cosmosxxxxx addresses and not cosmospubxxx
    let acct;
    try {
      acct = this._store.getByAddress(address);
    } catch (e) {
      acct = new CosmosAccount(this.app, this._Chain, this, address);
    }
    return acct;
  }

  public fromAddressIfExists(address: string): CosmosAccount | null {
    try {
      return this._store.getByAddress(address);
    } catch (e) {
      return null;
    }
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
