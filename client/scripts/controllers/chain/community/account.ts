import { IApp } from 'state';
import { Account, IOffchainAccountsModule, Profile, CommunityInfo } from 'models/models';
import { AccountsStore } from 'models/stores';
import { Coin } from 'adapters/currency';

export class OffchainAccount extends Account<Coin> {
  public address: string;
  public community: CommunityInfo;
  public balance: any;

  // CONSTRUCTORS
  constructor(app: IApp, chain: string, address: string) {
    super(app, app.config.chains.getById(chain), address);
    this.address = address;
  }

  public get freeBalance(): any {
    throw new Error('Method not implemented.');
  }
  public sendBalanceTx(recipient: Account<Coin>, amount: Coin): Promise<any> {
    throw new Error('Method not implemented.');
  }
  public async signMessage(message: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
  public async isValidSignature(message: string, signature: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  protected addressFromMnemonic(mnemonic: string): string {
    throw new Error('Method not implemented.');
  }
  protected addressFromSeed(seed: string): string {
    throw new Error('Method not implemented.');
  }
  protected seed?: string;
  protected mnemonic?: string;

  public setSeed(seed: string): void {
    throw new Error('Method not implemented.');
  }
  public setMnemonic(mnemonic: string): void {
    throw new Error('Method not implemented.');
  }
  public setValidationToken(token: string): void {
    throw new Error('Method not implemented.');
  }
  public async validate(signature?: string, txParams?: string) {
    throw new Error('Method not implemented.');
  }
}

// Allow it such that
class OffchainAccounts implements IOffchainAccountsModule<Coin, OffchainAccount> {
  private _initialized: boolean = false;
  public get initialized() { return this._initialized; }

  private _store: AccountsStore<OffchainAccount> = new AccountsStore();

  public get store() { return this._store; }

  private _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp) {
    this._app = app;
  }

  public get(address: string, chain?: string) {
    try {
      return this._store.getByAddress(address);
    } catch (e) {
      return new OffchainAccount(this.app, chain, address);
    }
  }
}

export default OffchainAccounts;
