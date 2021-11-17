import { Account, ITXModalData } from 'models';
import { IApp } from 'state';

import SolanaChain from './chain';
import SolanaAccounts from './accounts';
import { SolanaToken } from './types';

export default class SolanaAccount extends Account<SolanaToken> {
  private _Chain: SolanaChain;
  private _Accounts: SolanaAccounts;

  private _balance: SolanaToken;
  // TODO: ensure this is fetched
  public get balance() { return Promise.resolve(this._balance); }

  constructor(app: IApp, ChainInfo: SolanaChain, Accounts: SolanaAccounts, address: string) {
    super(app, app.chain.meta.chain, address);
    if (!app.isModuleReady) {
      // defer chain initialization
      app.chainModuleReady.once('ready', () => {
        if (app.chain.chain instanceof SolanaChain) this._Chain = app.chain.chain;
        else console.error('Did not successfully initialize account with chain');
      });
    } else {
      this._Chain = ChainInfo;
    }
    this._Accounts = Accounts;
    this._Accounts.store.add(this);
  }

  protected async addressFromMnemonic(mnemonic: string): Promise<string> {
    throw new Error('unsupported');
  }

  protected async addressFromSeed(seed: string): Promise<string> {
    throw new Error('unsupported');
  }

  public async signMessage(message: string): Promise<string> {
    throw new Error('unsupported');
  }

  public sendBalanceTx(recipient: Account<SolanaToken>, amount: SolanaToken):
    ITXModalData | Promise<ITXModalData> {
    throw new Error('Method not implemented.');
  }
}
