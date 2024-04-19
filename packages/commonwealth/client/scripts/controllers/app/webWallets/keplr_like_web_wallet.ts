import type {
  AccountData,
  OfflineDirectSigner,
  OfflineSigner,
} from '@cosmjs/proto-signing';
import type { ChainInfo } from '@keplr-wallet/types';

import { ChainBase, ChainNetwork, WalletId } from '@hicommonwealth/shared';
import { constructCosmosSignerCWClass } from 'shared/canvas/sessionSigners';
import app from 'state';
import IWebWallet from '../../../models/IWebWallet';
import { getCosmosChains } from './utils';

declare global {
  interface Window {
    wallet?: any; // this will get set to window.keplr or window.leap
  }
}

/**
 * This class is a wrapper for Keplr-like web wallets, such as Keplr and Leap,
 * which share the same API.
 * Ethermint chains should still use KeplrEthereumWebWalletController.
 */
class KeplrLikeWebWalletController implements IWebWallet<AccountData> {
  // GETTERS/SETTERS
  private _accounts: readonly AccountData[];
  private _enabled: boolean;
  private _enabling = false;
  private _chainId: string;
  private _chain: string;
  private _offlineSigner: OfflineDirectSigner | OfflineSigner;

  public readonly name;
  public readonly label;
  public readonly defaultNetwork = ChainNetwork.Osmosis;
  public readonly chain = ChainBase.CosmosSDK;
  public readonly specificChains = getCosmosChains();

  constructor(walletName: WalletId, label: string) {
    this.name = walletName;
    this.label = label;
  }

  public get available(): boolean {
    return !!window[this.name]; // window.keplr or window.leap
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

  public get api() {
    return window.wallet;
  }

  public get offlineSigner() {
    return this._offlineSigner;
  }

  public getChainId() {
    return this._chainId;
  }

  public async getRecentBlock(chainIdentifier: string) {
    const url = `${window.location.origin}/cosmosAPI/${chainIdentifier}`;
    const cosm = await import('@cosmjs/stargate');
    const client = await cosm.StargateClient.connect(url);
    const height = await client.getHeight();
    const block = await client.getBlock(height - 2); // validator pool may be out of sync

    return {
      number: block.header.height,
      hash: block.id,
      // seconds since epoch
      timestamp: Math.floor(new Date(block.header.time).getTime() / 1000),
    };
  }

  public async getSessionSigner() {
    const CosmosSignerCW = await constructCosmosSignerCWClass();
    return new CosmosSignerCW({
      bech32Prefix: app.chain?.meta.bech32Prefix,
      signer: {
        type: 'amino',
        signAmino: window.wallet.signAmino,
        getAddress: async () => this.accounts[0].address,
        getChainId: async () => this.getChainId(),
      },
    });
  }

  // ACTIONS
  public async enable() {
    console.log(`Attempting to enable ${this.label} web wallet`);

    window.wallet = window[this.name];

    if (!window.wallet?.experimentalSuggestChain) {
      alert(`Please update to a more recent version of ${this.label}`);
      return;
    }

    // enable
    this._enabling = true;
    try {
      // fetch chain id from URL using stargate client
      const url = `${window.location.origin}/cosmosAPI/${
        app.chain?.network || this.defaultNetwork
      }`;
      const cosm = await import('@cosmjs/stargate');
      const client = await cosm.StargateClient.connect(url);
      const chainId = await client.getChainId();
      this._chainId = chainId;
      client.disconnect();

      try {
        await window.wallet.enable(this._chainId);
      } catch (err) {
        console.log(
          `Failed to enable chain: ${err.message}. Trying experimentalSuggestChain...`,
        );

        const bech32Prefix = app.chain.meta.bech32Prefix?.toLowerCase();
        const info: ChainInfo = {
          chainId: this._chainId,
          chainName: app.chain.meta.name,
          rpc: url,
          // Note that altWalletUrl on Cosmos chains should be the REST endpoint -- if not available, we
          // use the RPC url as hack, which will break some querying functionality but not signing.
          rest: app.chain.meta.node.altWalletUrl || url,
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
              coinDenom: app.chain.meta.default_symbol,
              coinMinimalDenom: `u${app.chain.meta.default_symbol.toLowerCase()}`,
              coinDecimals: app.chain.meta.decimals || 6,
            },
          ],
          feeCurrencies: [
            {
              coinDenom: app.chain.meta.default_symbol,
              coinMinimalDenom: `u${app.chain.meta.default_symbol.toLowerCase()}`,
              coinDecimals: app.chain.meta.decimals || 6,
              gasPriceStep: { low: 0, average: 0.025, high: 0.03 },
            },
          ],
          stakeCurrency: {
            coinDenom: app.chain.meta.default_symbol,
            coinMinimalDenom: `u${app.chain.meta.default_symbol.toLowerCase()}`,
            coinDecimals: app.chain.meta.decimals || 6,
          },
          features: [],
        };
        await window.wallet.experimentalSuggestChain(info);
        await window.wallet.enable(this._chainId);
        this._chain = app.chain.id;
      }
      console.log(`Enabled web wallet for ${this._chainId}`);

      this._offlineSigner = await window.wallet.getOfflineSignerAuto(
        this._chainId,
      );
      this._accounts = await this._offlineSigner.getAccounts();
      this._enabled = true;
      this._enabling = false;
    } catch (error) {
      console.error(`Failed to enable ${this.label} wallet: ${error.message}`);
      this._enabling = false;
    }
  }
}

export default KeplrLikeWebWalletController;
