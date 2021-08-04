import app from 'state';

import { SigningStargateClient } from '@cosmjs/stargate';
import { OfflineDirectSigner, AccountData } from '@cosmjs/proto-signing';

import { Account, ChainBase, IWebWallet } from 'models';
import { validationTokenToSignDoc } from 'adapters/chain/cosmos/keys';
import { Window as KeplrWindow } from '@keplr-wallet/types';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Window extends KeplrWindow {}
}

class KeplrWebWalletController implements IWebWallet<AccountData> {
  // GETTERS/SETTERS
  private _accounts: readonly AccountData[];
  private _enabled: boolean;
  private _enabling: boolean = false;
  private _chainId: string;
  private _offlineSigner: OfflineDirectSigner;
  private _client: SigningStargateClient;

  public readonly name = 'keplr';
  public readonly label = 'Cosmos Wallet (Keplr)';
  public readonly chain = ChainBase.CosmosSDK;

  public get available() {
    return window.getOfflineSigner && !!window.keplr;
  }
  public get enabling() {
    return this._enabling;
  }
  public get enabled() {
    return this.available && this._enabled;
  }
  public get accounts() {
    return this._accounts || [];
  }
  public get api() { return window.keplr; }

  public async validateWithAccount(account: Account<any>): Promise<void> {
    if (!this._chainId || !window.keplr?.signAmino) throw new Error('Missing or misconfigured web wallet');

    // Get the verification token & placeholder TX to send
    const signDoc = validationTokenToSignDoc(this._chainId, account.validationToken);
    const signature = await window.keplr.signAmino(this._chainId, account.address, signDoc);
    return account.validate(JSON.stringify(signature));
  }

  // ACTIONS
  public async getClient(url: string, account: string): Promise<SigningStargateClient> {
    if (!this.enabled || app.chain.meta.chain.id !== this._chainId) {
      this._offlineSigner = null;
      this._client = null;
      await this.enable();
      if (!this.enabled) {
        throw new Error(`Failed to enable keplr for ${app.chain.meta.chain.id}.`);
      }
    }
    if (this.accounts[0].address !== account) {
      throw new Error('Incorrect signing account');
    }
    if (!this._client) {
      this._client = await SigningStargateClient.connectWithSigner(url, this._offlineSigner);
    }
    return this._client;
  }

  public async enable() {
    console.log('Attempting to enable Keplr web wallet');

    if (!window.keplr?.experimentalSuggestChain) {
      alert('Please update to a more recent version of Keplr');
      return;
    }

    // enable
    this._enabling = true;
    try {
      // enabling without version (i.e. cosmoshub instead of cosmoshub-4) should work
      this._chainId = app.chain.meta.chain.id;
      await window.keplr.enable(this._chainId);
      console.log(`Enabled web wallet for ${this._chainId}`);
      this._offlineSigner = window.keplr.getOfflineSigner(this._chainId);
      this._accounts = await this._offlineSigner.getAccounts();
      this._enabled = true;
      this._enabling = false;
    } catch (error) {
      console.error('Failed to enable keplr wallet');
      this._enabling = false;
    }
  }
}

export default KeplrWebWalletController;
