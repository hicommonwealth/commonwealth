import type { AccountData, OfflineDirectSigner } from '@cosmjs/proto-signing';
import {
  EthSignType,
  type ChainInfo,
  type Window as KeplrWindow,
} from '@keplr-wallet/types';

import { fromBech32 } from '@cosmjs/encoding';
import { ChainBase, ChainNetwork, WalletId } from '@hicommonwealth/shared';
import { bytesToHex } from '@noble/hashes/utils';
import { CosmosSignerCW } from 'shared/canvas/sessionSigners';
import app from 'state';
import IWebWallet from '../../../models/IWebWallet';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Window extends KeplrWindow {}
}

export const COSMOS_EVM_CHAINS = ['evmos', 'injective', 'evmos-dev'];

class EVMKeplrWebWalletController implements IWebWallet<AccountData> {
  // GETTERS/SETTERS
  private _accounts: readonly AccountData[];
  private _enabled: boolean;
  private _enabling = false;
  private _chainId: string;
  private _offlineSigner: OfflineDirectSigner;

  public readonly name = WalletId.KeplrEthereum;
  public readonly label = 'Keplr';
  public readonly chain = ChainBase.CosmosSDK;
  public readonly defaultNetwork = ChainNetwork.Evmos;
  public readonly specificChains = COSMOS_EVM_CHAINS;

  public get available() {
    return !!window.keplr;
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
    return window.keplr;
  }

  public get offlineSigner() {
    return this._offlineSigner;
  }

  getChainId() {
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
    return new CosmosSignerCW({
      bech32Prefix: app.chain.meta.bech32Prefix,
      signer: {
        type: 'ethereum',
        signEthereum: async (
          chainId: string,
          signerAddress: string,
          message: string,
        ) => {
          const signature = await window.keplr.signEthereum(
            chainId,
            signerAddress,
            message,
            EthSignType.MESSAGE,
          );
          return `0x${Buffer.from(signature).toString('hex')}`;
        },
        getAddress: async () => {
          const { data: addressData } = fromBech32(this.accounts[0].address);
          return `0x${bytesToHex(addressData)}`;
        },
        getChainId: async () => this._chainId,
      },
    });
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
      const url = `${window.location.origin}/cosmosAPI/${app.chain.network}`;
      const cosm = await import('@cosmjs/stargate');
      const client = await cosm.StargateClient.connect(url);
      const chainId = await client.getChainId();
      this._chainId = chainId;
      client.disconnect();

      try {
        await window.keplr.enable(this._chainId);
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
            coinType: 60,
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
              coinMinimalDenom: `a${app.chain.meta.default_symbol.toLowerCase()}`,
              coinDecimals: 18,
            },
          ],
          feeCurrencies: [
            {
              coinDenom: app.chain.meta.default_symbol,
              coinMinimalDenom: `a${app.chain.meta.default_symbol.toLowerCase()}`,
              coinDecimals: 18,
              gasPriceStep: {
                low: 0,
                average: 25000000000,
                high: 40000000000,
              },
            },
          ],
          stakeCurrency: {
            coinDenom: app.chain.meta.default_symbol,
            coinMinimalDenom: `a${app.chain.meta.default_symbol.toLowerCase()}`,
            coinDecimals: 18,
          },
          features: ['eth-address-gen', 'eth-key-sign'],
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

export default EVMKeplrWebWalletController;
