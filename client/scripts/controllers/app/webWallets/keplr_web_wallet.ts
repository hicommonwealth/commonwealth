import app from 'state';

import { SigningStargateClient, StargateClient } from '@cosmjs/stargate';
import { OfflineDirectSigner, AccountData } from '@cosmjs/proto-signing';

import { ChainBase } from 'types';
import { Account, IWebWallet } from 'models';
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
  public readonly label = 'Keplr';
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

    // save and restore default options after setting to no fee/memo for login
    const defaultOptions = window.keplr.defaultOptions;
    window.keplr.defaultOptions = {
      sign: {
        preferNoSetFee: true,
        preferNoSetMemo: true,
        disableBalanceCheck: true,
      }
    };

    const signature = await window.keplr.signAmino(
      this._chainId,
      account.address,
      signDoc
    );

    window.keplr.defaultOptions = defaultOptions;
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
      // fetch chain id from URL using stargate client
      const url = `${window.location.origin}/cosmosAPI/${app.chain.id}`;
      const client = await StargateClient.connect(url);
      const chainId = await client.getChainId();
      this._chainId = chainId;
      client.disconnect();

      try {
        await window.keplr.enable(this._chainId);
      } catch (err) {
        console.log(`Failed to enable chain: ${err.message}. Trying experimentalSuggestChain...`);

        const bech32Prefix = app.chain.meta.chain.bech32Prefix;
        const info: ChainInfo = {
          chainId: this._chainId,
          chainName: app.chain.meta.chain.name,
          rpc: url,
          // Note that altWalletUrl on Cosmos chains should be the REST endpoint -- if not available, we
          // use the RPC url as hack, which will break some querying functionality but not signing.
          rest: app.chain.meta.altWalletUrl || url,
          bip44: {
              coinType: 118,
          },
          bech32Config: {
            bech32PrefixAccAddr: `${bech32Prefix}`,
            bech32PrefixAccPub: `${bech32Prefix}pub`,
            bech32PrefixValAddr: `${bech32Prefix}valoper`,
            bech32PrefixValPub: `${bech32Prefix}valoperpub`,
            bech32PrefixConsAddr: `${bech32Prefix}valcons`,
            bech32PrefixConsPub: `${bech32Prefix}valconspub`,
          },
          currencies: [
            {
              coinDenom: app.chain.meta.chain.symbol,
              coinMinimalDenom: `u${app.chain.meta.chain.symbol.toLowerCase()}`,
              coinDecimals: app.chain.meta.chain.decimals || 6,
            },
          ],
          feeCurrencies: [
            {
              coinDenom: app.chain.meta.chain.symbol,
              coinMinimalDenom: `u${app.chain.meta.chain.symbol.toLowerCase()}`,
              coinDecimals: app.chain.meta.chain.decimals || 6,
            },
          ],
          stakeCurrency: {
            coinDenom: app.chain.meta.chain.symbol,
            coinMinimalDenom: `u${app.chain.meta.chain.symbol.toLowerCase()}`,
            coinDecimals: app.chain.meta.chain.decimals || 6,
          },
          gasPriceStep: {
            low: 0,
            average: 0,
            high: 0.025,
          },
          features: ['stargate'],
        };
        await window.keplr.experimentalSuggestChain(info);
        await window.keplr.enable(this._chainId);
      }
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
