declare let window: any;

import app from 'state';
import Web3 from 'web3';
import IWebWallet from 'models/IWebWallet';
import { ChainBase, ISignerApi } from 'client/scripts/models';
import Ethereum from 'controllers/chain/ethereum/main';
import { setActiveAccount } from './login';

// TODO: make this a generic controller, it's shared with polkadotJS right now
class MetamaskWebWalletController implements IWebWallet {
  // GETTERS/SETTERS
  private _enabled: boolean;
  private _accounts: any[]; // Todo Typecasting...
  private _injectedAddress: string;
  private _provider: any;
  private _web3: Web3;

  public readonly label = 'Ethereum Wallet (Metamask)';
  public readonly chain = ChainBase.Ethereum;

  public get web3() {
    return this._web3;
  }

  public get available() {
    return !!(window.ethereum);
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
    const signature = await this._web3.eth.sign(message, this.accounts[0]);
    return signature;
  }

  // ACTIONS
  public async enable(api?: ISignerApi) {
    console.log('Attempting to enable ETH web wallet');
    // (this needs to be called first, before other requests)
    this._web3 = (app.chain.id === 'ethereum-local')
      ? new (window as any).Web3((window as any).ethereum)
      : (app.chain as Ethereum).chain.api;
    await this._web3.givenProvider.enable();

    this._accounts = await this._web3.eth.getAccounts();
    this._provider = this._web3.currentProvider;
    const balance = await this._web3.eth.getBalance(this._accounts[0]);

    await this.initAccountsChanged(api);
    this._enabled = true;
  }

  public async initAccountsChanged(api?: ISignerApi) {
    await this.web3.givenProvider.on('accountsChanged', async (accounts: string[]) => {
      const updatedAddress = app.user.activeAccounts.find((addr) => addr.address === accounts[0]);
      if (!updatedAddress) return;
      await setActiveAccount(updatedAddress);
      if (api) {
        api.updateSigner(accounts[0]);
      }
    });
  }
}

export default MetamaskWebWalletController;
