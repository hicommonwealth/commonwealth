import app from 'state';

import { SigningStargateClient } from '@cosmjs/stargate';
import { OfflineDirectSigner, AccountData } from '@cosmjs/proto-signing';

import { Account, ChainBase, IWebWallet } from 'models';
import { validationTokenToSignDoc } from 'adapters/chain/cosmos/keys';
import { Window as KeplrWindow, ChainInfo } from '@keplr-wallet/types';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Window extends KeplrWindow {}
}

class KeplrWebWalletController implements IWebWallet<AccountData> {
  // GETTERS/SETTERS
  private _accounts: readonly AccountData[];
  private _enabled: boolean;
  private _enabling = false;
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
  public get offlineSigner() { return this._offlineSigner; }

  public async validateWithAccount(account: Account<any>): Promise<void> {
    if (!this._chainId || !window.keplr?.signAmino)
      throw new Error('Missing or misconfigured web wallet');

    // Get the verification token & placeholder TX to send
    const signDoc = validationTokenToSignDoc(
      this._chainId,
      account.validationToken
    );
    const signature = await window.keplr.signAmino(
      this._chainId,
      account.address,
      signDoc
    );
    return account.validate(JSON.stringify(signature));
  }

  // ACTIONS
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
      if (this._chainId === 'osmosis-local') {
        this._chainId = 'osmosis-local-1';
        // TODO: for testing
        const info: ChainInfo = {
          rpc: 'http://localhost:26657',
          rest: 'http://localhost:1317',
          chainId: 'osmosis-local-1',
          chainName: 'Osmosis Local',
          stakeCurrency: {
            coinDenom: 'OSMO',
            coinMinimalDenom: 'uosmo',
            coinDecimals: 6,
            coinGeckoId: 'osmosis',
          },
          walletUrl: 'https://app.osmosis.zone',
          walletUrlForStaking: 'http://localhost:8080/#/osmosis/stake',
          bip44: { coinType: 118 },
          bech32Config: {
            bech32PrefixAccAddr: 'osmo',
            bech32PrefixAccPub: 'osmopub',
            bech32PrefixValAddr: 'osmovaloper',
            bech32PrefixValPub: 'osmovaloperpub',
            bech32PrefixConsAddr: 'osmovalcons',
            bech32PrefixConsPub: 'osmovalconspub',
          },
          currencies: [
            {
              coinDenom: 'OSMO',
              coinMinimalDenom: 'uosmo',
              coinDecimals: 6,
              coinGeckoId: 'osmosis',
            },
          ],
          feeCurrencies: [
            {
              coinDenom: 'OSMO',
              coinMinimalDenom: 'uosmo',
              coinDecimals: 6,
              coinGeckoId: 'osmosis',
            },
          ],
          gasPriceStep: {
            low: 0,
            average: 0,
            high: 0.025,
          },
          features: ['stargate'],
        };
        await window.keplr.experimentalSuggestChain(info);
      }
      await window.keplr.enable(this._chainId);
      console.log(`Enabled web wallet for ${this._chainId}`);
      this._offlineSigner = window.keplr.getOfflineSigner(this._chainId);
      this._accounts = await this._offlineSigner.getAccounts();
      this._enabled = true;
      this._enabling = false;
    } catch (error) {
      console.error(`Failed to enable keplr wallet: ${error.message}`);
      this._enabling = false;
    }
  }
}

export default KeplrWebWalletController;
