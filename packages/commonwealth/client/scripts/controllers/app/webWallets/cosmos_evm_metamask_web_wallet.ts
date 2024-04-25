import { ChainBase, ChainNetwork, WalletId } from '@hicommonwealth/shared';
import { bech32 } from 'bech32';
import { setActiveAccount } from 'controllers/app/login';

import app from 'state';
import type Web3 from 'web3';

import { CosmosSignerCW } from 'shared/canvas/sessionSigners';
import { Transaction, Web3BaseProvider } from 'web3';
import IWebWallet from '../../../models/IWebWallet';
import { getCosmosChains } from './utils';

declare let window: any;

function encodeEthAddress(bech32Prefix: string, address: string): string {
  return bech32.encode(
    bech32Prefix,
    bech32.toWords(Buffer.from(address.slice(2), 'hex')),
  );
}

class CosmosEvmWebWalletController implements IWebWallet<string> {
  // GETTERS/SETTERS
  private _enabled: boolean;
  private _enabling = false;
  private _chainId: string;
  private _accounts: string[] = [];
  private _ethAccounts: string[];
  private _provider: Web3BaseProvider;
  private _web3: Web3;

  public readonly name = WalletId.CosmosEvmMetamask;
  public readonly label = 'Metamask';
  public readonly chain = ChainBase.CosmosSDK;
  public readonly defaultNetwork = ChainNetwork.Injective;
  public readonly specificChains = getCosmosChains(true);

  public get available() {
    return !!window.ethereum;
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

  public get api(): any {
    return this._web3;
  }

  public async getRecentBlock(chainIdentifier: string) {
    const url = `${window.location.origin}/cosmosAPI/${chainIdentifier}`;
    const cosm = await import('@cosmjs/stargate');
    const client = await cosm.StargateClient.connect(url);
    const height = await client.getHeight();
    const block = await client.getBlock(height);

    return {
      number: block.header.height,
      hash: block.id,
      // seconds since epoch
      timestamp: Math.floor(new Date(block.header.time).getTime() / 1000),
    };
  }

  public getChainId() {
    return this._chainId;
  }

  public async getSessionSigner() {
    return new CosmosSignerCW({
      bech32Prefix: app.chain?.meta.bech32Prefix || 'inj',
      signer: {
        type: 'ethereum',
        signEthereum: (
          chainId: string,
          signerAddress: string,
          message: string,
        ) => this._web3.eth.personal.sign(message, signerAddress, ''),
        getAddress: async () => this._ethAccounts[0],
        getChainId: async () => this._chainId,
      },
    });
  }

  public async signTransaction(tx: Transaction): Promise<string> {
    const rlpEncodedTx = await this._web3.eth.personal.signTransaction(tx, '');
    return rlpEncodedTx;
  }

  // ACTIONS
  public async enable() {
    console.log('Attempting to enable Metamask');
    this._enabling = true;
    try {
      let ethereum = window.ethereum;
      if (window.ethereum.providers?.length) {
        window.ethereum.providers.forEach(async (p) => {
          if (p.isMetaMask) ethereum = p;
        });
      }

      // (this needs to be called first, before other requests)
      const Web3 = (await import('web3')).default;
      this._web3 = new Web3(ethereum);

      this._ethAccounts = await this._web3.eth.getAccounts();
      this._provider = this._web3.currentProvider;
      if (this._ethAccounts.length === 0) {
        throw new Error('Could not fetch accounts from Metamask');
      } else {
        for (const acc of this._ethAccounts) {
          this._accounts.push(
            encodeEthAddress(app.chain?.meta.bech32Prefix || 'inj', acc),
          );
        }
      }

      // fetch chain id from URL using stargate client
      const url = `${window.location.origin}/cosmosAPI/${
        app.chain?.network || this.defaultNetwork
      }`;
      const cosm = await import('@cosmjs/stargate');
      const client = await cosm.StargateClient.connect(url);
      const chainId = await client.getChainId();
      this._chainId = chainId;

      await this.initAccountsChanged();
      this._enabled = true;
      this._enabling = false;
    } catch (error) {
      console.error(`Failed to enable Metamask: ${error.message}`);
      this._enabling = false;
    }
  }

  public async initAccountsChanged() {
    await (this._web3.givenProvider as Web3BaseProvider).on(
      'accountsChanged',
      async (accounts: string[]) => {
        const encodedAccounts = accounts.map((a) =>
          encodeEthAddress(app.chain?.meta.bech32Prefix || 'inj', a),
        );
        const updatedAddress = app.user.activeAccounts.find(
          (addr) => addr.address === encodedAccounts[0],
        );
        if (!updatedAddress) return;
        await setActiveAccount(updatedAddress);
      },
    );
    // TODO: chainChanged, disconnect events
  }

  // TODO: disconnect
}

export default CosmosEvmWebWalletController;
