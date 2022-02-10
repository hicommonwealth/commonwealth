import { Account } from 'models';
import { IApp } from 'state';
import _ from 'lodash';
import * as solw3 from '@solana/web3.js';

import SolanaChain from './chain';
import SolanaAccounts from './accounts';
import { SolanaToken } from './types';

export default class SolanaAccount extends Account<SolanaToken> {
  private _Chain: SolanaChain;
  private _Accounts: SolanaAccounts;

  private _balance: SolanaToken;
  public get balance() { return this.updateBalance().then(() => this._balance); }

  public get publicKey() {
    return new solw3.PublicKey(this.address);
  }

  private updateBalance = _.throttle(async () => {
    try {
      const bal = await this._Chain.connection.getBalance(this.publicKey);
      console.log(`Fetched balance: ${bal}`);
      this._balance = this._Chain.coins(bal);
    } catch (e) {
      // if coins is null, they have a zero balance
      console.log(`no balance found: ${e.message}`);
      this._balance = this._Chain.coins(0);
    }
  });

  constructor(app: IApp, ChainInfo: SolanaChain, Accounts: SolanaAccounts, address: string) {
    super(app, app.chain.meta.chain, address);
    if (!app.isModuleReady) {
      // defer chain initialization
      app.chainModuleReady.once('ready', () => {
        if (app.chain.chain instanceof SolanaChain) {
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
