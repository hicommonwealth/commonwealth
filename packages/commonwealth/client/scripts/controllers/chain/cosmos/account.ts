import BN from 'bn.js';
import CosmosChain from 'controllers/chain/cosmos/chain';
import type { CosmosToken } from 'controllers/chain/cosmos/types';
import _ from 'lodash';
import type { IApp } from 'state';
import Account from '../../../models/Account';
import type CosmosAccounts from './accounts';

export default class CosmosAccount extends Account {
  private _Chain: CosmosChain;
  private _Accounts: CosmosAccounts;

  // TODO: add delegations, validations
  private _balance: CosmosToken;
  // NOTE: this balance query will not work on Terra, as it uses a nonstandard Cosmos interface.
  //   We should either deprecate this query and replace it with TokenBalanceCache, or create a
  //   workaround specific for Terra.
  public get balance() {
    return this.updateBalance().then(() => this._balance);
  }

  constructor(
    app: IApp,
    ChainInfo: CosmosChain,
    Accounts: CosmosAccounts,
    address: string
  ) {
    super({ community: app.chain.meta, address });
    if (!app.isModuleReady) {
      // defer chain initialization
      app.chainModuleReady.once('ready', () => {
        if (app.chain.chain instanceof CosmosChain)
          this._Chain = app.chain.chain;
        else
          console.error('Did not successfully initialize account with chain');
      });
    } else {
      this._Chain = ChainInfo;
    }
    this._Accounts = Accounts;
    this._Accounts.store.add(this);
  }

  public updateBalance = _.throttle(async () => {
    try {
      const bal = await this._Chain.api.bank.balance(
        this.address,
        this._Chain.denom
      );
      this._balance = this._Chain.coins(new BN(bal.amount));
    } catch (e) {
      // if coins is null, they have a zero balance
      console.log(`no balance found: ${e.message}`);
      this._balance = this._Chain.coins(0);
    }
  });
}
