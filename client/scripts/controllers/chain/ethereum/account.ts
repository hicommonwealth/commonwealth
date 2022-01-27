import BN from 'bn.js';
import { IApp } from 'state';
import { Account } from 'models';
import { EthereumCoin } from 'adapters/chain/ethereum/types';
import EthereumChain from './chain';
import EthereumAccounts from './accounts';

export default class EthereumAccount extends Account<EthereumCoin> {
  public get balance(): Promise<EthereumCoin> {
    if (!this._Chain) return; // TODO
    return this._Chain.api.eth.getBalance(this.address).then(
      (v) => new EthereumCoin('ETH', new BN(v), false)
    );
  }

  protected _initialized: Promise<boolean>;
  get initialized(): Promise<boolean> { return this._initialized; }

  private _Chain: EthereumChain;
  private _Accounts: EthereumAccounts;

  // CONSTRUCTORS
  constructor(app: IApp, ChainInfo: EthereumChain, Accounts: EthereumAccounts, address: string) {
    super(app, app.chain.meta.chain, address);
    if (!app.isModuleReady) {
      // defer chain initialization
      app.chainModuleReady.once('ready', () => {
        if (app.chain.chain instanceof EthereumChain) {
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
