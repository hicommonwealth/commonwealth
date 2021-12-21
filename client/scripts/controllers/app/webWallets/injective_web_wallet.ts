import { bech32 } from 'bech32';

declare let window: any;

import Web3 from 'web3';
import { provider } from 'web3-core';
import { ChainBase } from 'types';
import { Account, IWebWallet } from 'models';
import app from 'state';
import { setActiveAccount } from 'controllers/app/login';
import { Address } from 'ethereumjs-util';

function encodeEthAddress(address: string): string {
  return bech32.encode('inj', bech32.toWords(Address.fromString(address).toBuffer()));
}

class InjectiveWebWalletController implements IWebWallet<string> {
  // GETTERS/SETTERS
  private _enabled: boolean;
  private _enabling: boolean = false;
  private _accounts: string[] = [];
  private _ethAccounts: string[];
  private _provider: provider;
  private _web3: Web3;

  public readonly name = 'inj-metamask';
  public readonly label = 'Metamask (Injective)';
  public readonly chain = ChainBase.CosmosSDK;
  public readonly specificChain = 'injective';

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

  public async signMessage(message: string): Promise<string> {
    const signature = await this._web3.eth.personal.sign(message, this._ethAccounts[0], '');
    return signature;
  }

  public async validateWithAccount(account: Account<any>): Promise<void> {
    // Sign with the method on eth_webwallet, because we don't have access to the private key
    const webWalletSignature = await this.signMessage(account.validationToken);
    return account.validate(webWalletSignature);
  }

  // ACTIONS
  public async enable() {
    console.log('Attempting to enable Metamask');
    this._enabling = true;
    try {
      // (this needs to be called first, before other requests)
      this._web3 = new Web3((window as any).ethereum);
      await this._web3.givenProvider.enable();

      this._ethAccounts = await this._web3.eth.getAccounts();
      this._provider = this._web3.currentProvider;
      if (this._ethAccounts.length === 0) {
        throw new Error('Could not fetch accounts from Metamask');
      } else {
        for (const acc of this._ethAccounts) {
          this._accounts.push(encodeEthAddress(acc));
        }
      }

      await this.initAccountsChanged();
      this._enabled = true;
      this._enabling = false;
    } catch (error) {
      console.error(`Failed to enable Metamask: ${error.message}`);
      this._enabling = false;
    }
  }

  public async initAccountsChanged() {
    await this._web3.givenProvider.on('accountsChanged', async (accounts: string[]) => {
      const encodedAccounts = accounts.map((a) => encodeEthAddress(a));
      const updatedAddress = app.user.activeAccounts.find((addr) => addr.address === encodedAccounts[0]);
      if (!updatedAddress) return;
      await setActiveAccount(updatedAddress);
    });
    // TODO: chainChanged, disconnect events
  }

  // TODO: disconnect
}

export default InjectiveWebWalletController;
