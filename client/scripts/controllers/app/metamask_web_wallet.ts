declare let window: any;

import app from 'state';
import Web3 from 'web3';
import { provider } from 'web3-core';
import { Account, ChainBase, IWebWallet } from 'models';
import Ethereum from 'controllers/chain/ethereum/main';
import { setActiveAccount } from './login';

// TODO: make this a generic controller, it's shared with polkadotJS right now
class MetamaskWebWalletController implements IWebWallet<string> {
  // GETTERS/SETTERS
  private _enabled: boolean;
  private _enabling: boolean = false;
  private _accounts: any[]; // Todo Typecasting...
  private _injectedAddress: string;
  private _provider: provider;
  private _web3: Web3;

  public readonly label = 'Ethereum Wallet (Metamask)';
  public readonly chain = ChainBase.Ethereum;

  public get web3() {
    return this._web3;
  }

  public get available() {
    return !!(window.ethereum);
  }

  public get provider() {
    return this._provider;
  }

  public get enabled() {
    return this.available && this._enabled;
  }

  public get enabling() {
    return this._enabling;
  }

  public get accounts() {
    return this._accounts || [];
  }

  public get injectedAddress() {
    return this._injectedAddress;
  }

  public async signMessage(message: string): Promise<string> {
    const signature = await this._web3.eth.personal.sign(message, this.accounts[0], '');
    return signature;
  }

  public async validateWithAccount(account: Account<any>): Promise<void> {
    // Sign with the method on eth_webwallet, because we don't have access to the private key
    const webWalletSignature = await this.signMessage(account.validationToken);
    return account.validate(webWalletSignature);
  }

  // ACTIONS
  public async enable() {
    console.log('Attempting to enable ETH web wallet');
    this._enabling = true;
    try {
      // (this needs to be called first, before other requests)
      this._web3 = new Web3((window as any).ethereum);
      await this._web3.givenProvider.enable();

      this._accounts = await this._web3.eth.getAccounts();
      this._provider = this._web3.currentProvider;
      const balance = await this._web3.eth.getBalance(this._accounts[0]);
      console.log(balance);

      await this.initAccountsChanged();
      this._enabled = true;
      this._enabling = false;
    } catch (error) {
      console.error('Failed to enable ETH wallet');
      this._enabling = false;
    }
  }

  public async initAccountsChanged() {
    await this.web3.givenProvider.on('accountsChanged', async (accounts: string[]) => {
      const updatedAddress = app.user.activeAccounts.find((addr) => addr.address === accounts[0]);
      if (!updatedAddress) return;
      // TODO: test this against token contract txs
      await setActiveAccount(updatedAddress);
    });
  }
}

export default MetamaskWebWalletController;
