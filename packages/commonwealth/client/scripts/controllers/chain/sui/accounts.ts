import { SUI_MAINNET_CHAIN_ID } from '@hicommonwealth/shared';
import { IAccountsModule } from 'models/interfaces';
import type { IApp } from 'state';
import SuiAccount from './account';
import SuiChain from './chain';

class SuiAccounts implements IAccountsModule<SuiAccount> {
  private _accounts: SuiAccount[] = [];
  private _chain: SuiChain;
  private _app: IApp;

  constructor(app: IApp) {
    this._app = app;
  }

  public get accounts() {
    return this._accounts;
  }

  public init(chain: SuiChain): Promise<void> {
    this._chain = chain;
    return Promise.resolve();
  }

  public async deinit(): Promise<void> {
    this._accounts = [];
  }

  public createAccount(
    address: string,
    chainId = SUI_MAINNET_CHAIN_ID,
  ): SuiAccount {
    // Validate the address format
    const isAddressValid = this.validateAddress(address);

    // create a new account
    const account = new SuiAccount(
      address,
      this._app.chain?.meta,
      chainId,
      isAddressValid,
    );

    // Add to the list of accounts
    this._accounts.push(account);
    return account;
  }

  public getAccount(address: string): SuiAccount {
    const existing = this._accounts.find(
      (account) => account.address === address,
    );
    if (existing) return existing;
    return this.createAccount(address);
  }

  public validateAddress(address: string): boolean {
    // Basic validation for Sui addresses (starts with '0x' and is 66 characters long)
    return address.startsWith('0x') && address.length === 66;
  }

  // Method to update account balances
  public updateBalance(
    address: string,
    coins: Array<{
      type: string;
      balance: string;
      decimals: number;
      name: string;
      symbol: string;
    }>,
  ) {
    const account = this.getAccount(address);
    account.coins.length = 0;
    coins.forEach((coin) => {
      account.coins.push({
        ...coin,
        denom: coin.type,
      });
    });
  }
}

export default SuiAccounts;
