import _ from 'lodash';
import BN from 'bn.js';
import { IApp } from 'state';
import CosmosChain from 'controllers/chain/cosmos/chain';
import { CosmosToken } from 'controllers/chain/cosmos/types';
import { Account } from 'models';
import CosmosAccounts from './accounts';

export default class CosmosAccount extends Account<CosmosToken> {
  private _Chain: CosmosChain;
  private _Accounts: CosmosAccounts;

  // TODO: add delegations, validations
  private _balance: CosmosToken;
  public get balance() { return this.updateBalance().then(() => this._balance); }

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

  public updateBalance = _.throttle(async () => {
    try {
      const bal = await this._Chain.api.bank.balance(this.address, this._Chain.denom);
      this._balance = this._Chain.coins(new BN(bal.amount));
    } catch (e) {
      // if coins is null, they have a zero balance
      console.log(`no balance found: ${e.message}`);
      this._balance = this._Chain.coins(0);
    }
  });
}
