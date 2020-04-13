declare let window: any;

import app from 'state';
import Ethereum from '../chain/ethereum/main';

// tslint:disable-next-line
const ethUtil = require('ethereumjs-util');

// TODO: make this a generic controller, it's shared with polkadotJS right now
class EthWebWalletController {
  // GETTERS/SETTERS
  private _enabled: boolean;
  private _accounts: any[]; // Todo Typecasting...
  private _injectedAddress: string;
  private _provider: any;
  private _web3: any;

  public get web3() {
    return this._web3;
  }

  public get available() {
    return (window.ethereum) ? true : false;
  }
  public get enabled() {
    return this.available && this._enabled;
  }
  public get accounts() {
    return this._accounts || [];
  }
  public get injectedAddress() {
    return this._injectedAddress;
  }

  public async signMessage(message: string): Promise<string> {
    const signature = await this._web3.eth.personal.sign(message, this.accounts[0]);
    return signature;
  }

  // ACTIONS
  public async enable() {
    console.log('Attempting to enable ETH web wallet');
    // (this needs to be called first, before other requests)
    this._web3 = (app.chain.id === 'ethereum-local')
      ? new (window as any).Web3((window as any).ethereum)
      : (app.chain as Ethereum).chain.api;
    await this._web3.givenProvider.enable();

    this._accounts = await this._web3.eth.getAccounts();
    this._provider = this._web3.currentProvider;
    const balance = await this._web3.eth.getBalance(this._accounts[0]);

    this._enabled = true;
  }
}

export default EthWebWalletController;
