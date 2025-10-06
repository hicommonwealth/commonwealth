import _ from 'lodash';
import type { IApp } from 'state';
import Account from '../../../models/Account';
import type SuiAccounts from './accounts';

import SuiChain from './chain';
import type { SuiToken } from './types';

export default class SuiAccount extends Account {
  private _Chain: SuiChain;
  private _Accounts: SuiAccounts;

  private _balance: SuiToken;
  public get balance() {
    // @ts-expect-error StrictNullChecks
    return this.updateBalance().then(() => this._balance);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  public async publicKey() {
    // For Sui, the address is the public key in string format
    // Just return the address, as Sui SDK doesn't have a specific PublicKey class
    return this.address;
  }

  private updateBalance = _.throttle(async () => {
    try {
      // Get the coin balances for the account
      const { totalBalance } = await this._Chain.client.getBalance({
        owner: this.address,
        coinType: '0x2::sui::SUI',
      });

      console.log(`Fetched Sui balance: ${totalBalance}`);
      this._balance = this._Chain.coins(parseInt(totalBalance));
    } catch (e) {
      // if coins is null, they have a zero balance
      console.log(`No Sui balance found: ${e.message}`);
      this._balance = this._Chain.coins(0);
    }
  });

  constructor(
    app: IApp,
    ChainInfo: SuiChain,
    Accounts: SuiAccounts,
    address: string,
  ) {
    super({
      community: {
        id: app.chain.meta.id || '',
        base: app.chain.meta.base,
        ss58Prefix: app.chain.meta.ss58_prefix || 0,
      },
      address,
    });
    if (!app.isModuleReady) {
      // defer chain initialization
      app.chainModuleReady.once('ready', () => {
        if (app.chain.chain instanceof SuiChain) {
          this._Chain = app.chain.chain;
        } else {
          console.error('Did not successfully initialize account with chain');
        }
      });
    } else {
      this._Chain = ChainInfo;
    }
    this._Accounts = Accounts;
    this._Accounts.store.add(this);
  }
}
