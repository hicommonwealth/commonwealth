import type {
  ConnectedWallet,
  WalletController,
} from '@terra-money/wallet-provider';

import {
  ChainBase,
  ChainNetwork,
  CosmosSignerCW,
  WalletId,
} from '@hicommonwealth/shared';
import app from 'state';
import IWebWallet from '../../../models/IWebWallet';

// TODO: ensure this only opens on mobile

type TerraAddress = {
  address: string;
};

class TerraWalletConnectWebWalletController
  implements IWebWallet<TerraAddress>
{
  private _enabled: boolean;
  private _enabling = false;
  private _accounts: TerraAddress[];
  private _controller: WalletController;
  private _wallet: ConnectedWallet;

  public readonly name = WalletId.TerraWalletConnect;
  public readonly label = 'WalletConnect';
  public readonly chain = ChainBase.CosmosSDK;
  public readonly available = true;
  public readonly defaultNetwork = ChainNetwork.Terra;
  public readonly specificChains = ['terra'];

  public get enabled() {
    return this.available && this._enabled;
  }

  public get enabling() {
    return this._enabling;
  }

  public get accounts() {
    return this._accounts || [];
  }

  public getChainId() {
    // Terra mainnet
    return 'phoenix-1';
  }

  public async getRecentBlock(chainIdentifier: string) {
    const url = `${
      window.location.origin
    }${app.serverUrl()}/cosmosProxy/${chainIdentifier}`;
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

  public getSessionSigner() {
    return new CosmosSignerCW({
      bech32Prefix: app.chain?.meta.bech32Prefix,
      signer: {
        type: 'bytes',
        getAddress: () => this._accounts[0].address,
        getChainId: () => this.getChainId(),
        signBytes: async (bytes) => {
          const result = await this._wallet.signBytes(Buffer.from(bytes));
          if (!result.success) {
            throw new Error('SignBytes unsuccessful');
          }
          return {
            // @ts-expect-error <StrictNullChecks>
            public_key: result.result.public_key.toAmino().value as string,
            signature: Buffer.from(result.result.signature).toString('base64'),
          };
        },
      },
    });
  }

  public async reset() {
    console.log('Attempting to reset WalletConnect');
    this._controller.disconnect();
    this._enabled = false;
  }

  public async enable() {
    console.log('Attempting to enable WalletConnect');
    this._enabling = true;
    try {
      const terra = await import('@terra-money/wallet-provider');
      const chainOptions = await terra.getChainOptions();
      this._controller = new terra.WalletController({
        ...chainOptions,
      });

      //  Enable session (triggers QR Code modal)
      await this._controller.connect(terra.ConnectType.WALLETCONNECT);

      let subscription;
      this._wallet = await new Promise((resolve) => {
        subscription = this._controller
          .connectedWallet()
          .subscribe((connectedWallet) => {
            if (connectedWallet) {
              resolve(connectedWallet);
            }
          });
      });
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }

      this._accounts = [{ address: this._wallet.terraAddress }];
      this._enabled = true;
      this._enabling = false;
    } catch (error) {
      this._enabling = false;
      throw new Error(`Failed to enable WalletConnect: ${error.message}`);
    }
  }
}

export default TerraWalletConnectWebWalletController;
