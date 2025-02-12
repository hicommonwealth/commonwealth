import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
} from '@polkadot/extension-dapp';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

import {
  addressSwapper,
  ChainBase,
  ChainNetwork,
  WalletId,
} from '@hicommonwealth/shared';

import { SubstrateSignerCW } from '@hicommonwealth/shared';
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

  public async getSessionSigner() {
    const accounts = await web3Accounts();
    const address = accounts[0].address;
    const communityPrefix = app.chain?.meta?.ss58_prefix || 42;

    console.log('PolkadotWallet - Original address:', address);
    console.log('PolkadotWallet - Community prefix:', communityPrefix);

    // Use original address for extension lookup
    const extension = await web3FromAddress(address);

    // Pass the community prefix to the signer
    return new SubstrateSignerCW({
      extension,
      prefix: communityPrefix,
    });
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
    this._enabling = true;

    try {
      await web3Enable('commonwealth');
      const accounts = await web3Accounts();
      console.log(
        'PolkadotWallet - Found accounts:',
        accounts.map((a) => a.address),
      );

      // Convert addresses to community prefix
      const communityPrefix = app.chain?.meta?.ss58_prefix || 42;
      this._accounts = accounts.map((account) => {
        const converted = addressSwapper({
          address: account.address,
          currentPrefix: 42,
          targetPrefix: communityPrefix,
        });
        console.log(
          `PolkadotWallet - Converting ${account.address} to ${converted}`,
        );
        return {
          ...account,
          address: converted,
        };
      });

      this._enabled = true;
    } catch (error) {
      console.error('Failed to enable polkadot wallet:', error);
    } finally {
      this._enabling = false;
    }
  }
}

export default PolkadotWebWalletController;
