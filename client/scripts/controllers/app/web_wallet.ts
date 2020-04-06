import { web3Accounts, web3Enable, web3FromAddress, isWeb3Injected } from '@polkadot/extension-dapp';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { Signer } from '@polkadot/api/types';

import AddressSwapper from 'views/components/addresses/address_swapper';

// TODO: make this a generic controller, and have the polkadot-js extension implementation inherit
class WebWalletController {
  // GETTERS/SETTERS
  private _enabled: boolean;
  private _accounts: InjectedAccountWithMeta[];
  private _injectedAddress: string;

  public get available() {
    return isWeb3Injected;
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

  public async getSigner(who: string): Promise<Signer> {
    // finds an injector for an address
    // web wallet stores addresses in testnet format for now, so we have to re-encode
    const reencodedAddress = AddressSwapper({
      address: who,
      currentPrefix: 42,
    });
    const injector = await web3FromAddress(reencodedAddress);
    return injector.signer;
  }

  // ACTIONS
  public async enable() {
    console.log('Attempting to enable Substrate web wallet');
    if (!this.available) throw new Error('Web wallet not available');

    // returns an array of all the injected sources
    // (this needs to be called first, before other requests)
    const injectedExtensionInfo = await web3Enable('commonwealth');
    this._enabled = true;

    // returns an array of { address, meta: { name, source } }
    // meta.source contains the name of the extension that provides this account
    this._accounts = await web3Accounts();
  }
}

export default WebWalletController;
