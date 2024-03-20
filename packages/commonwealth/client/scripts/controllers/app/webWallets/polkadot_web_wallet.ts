import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
} from '@polkadot/extension-dapp';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

import type { SessionSigner } from '@canvas-js/interfaces';

import { ChainBase, ChainNetwork, WalletId } from '@hicommonwealth/core';

import { constructSubstrateSignerCWClass } from 'shared/canvas/sessionSigners';
import { addressSwapper } from 'shared/utils';
import app from 'state';
import IWebWallet from '../../../models/IWebWallet';

declare let window: any;

class PolkadotWebWalletController
  implements IWebWallet<InjectedAccountWithMeta>
{
  // GETTERS/SETTERS
  private polkadot;
  private _enabled: boolean;
  private _accounts: InjectedAccountWithMeta[];
  private _enabling = false;

  public readonly name = WalletId.Polkadot;
  public readonly label = 'polkadot.js';
  public readonly defaultNetwork = ChainNetwork.Edgeware;
  public readonly chain = ChainBase.Substrate;

  public get available() {
    return window?.injectedWeb3?.['polkadot-js'];
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

  public async getSessionSigner(): Promise<SessionSigner> {
    const accounts = await web3Accounts();
    const address = accounts[0].address;

    const reencodedAddress = addressSwapper({
      address,
      currentPrefix: 42,
    });

    const extension = await web3FromAddress(reencodedAddress);
    const SubstrateSignerCW = await constructSubstrateSignerCWClass();
    // @ts-ignore
    return new SubstrateSignerCW({ extension });
  }

  public getChainId() {
    return app.chain?.id || this.defaultNetwork;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getRecentBlock(chainIdentifier: string) {
    return null;
  }

  // ACTIONS
  public async enable() {
    console.log('Attempting to enable Substrate web wallet');

    // returns an array of all the injected sources
    // (this needs to be called first, before other requests)
    this._enabling = true;
    try {
      await web3Enable('commonwealth');

      // returns an array of { address, meta: { name, source } }
      // meta.source contains the name of the extension that provides this account
      this._accounts = await web3Accounts();

      this._enabled = true;
      this._enabling = false;
    } catch (error) {
      console.error('Failed to enable polkadot wallet');
      this._enabling = false;
    }
  }
}

export default PolkadotWebWalletController;
