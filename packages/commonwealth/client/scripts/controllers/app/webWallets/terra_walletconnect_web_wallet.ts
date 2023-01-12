import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import {
  ConnectedWallet,
  ConnectType,
  getChainOptions,
  WalletController,
} from '@terra-money/wallet-controller';
import { LCDClient, TendermintAPI } from '@terra-money/terra.js';
import { Account, BlockInfo, IWebWallet } from 'models';
import { CanvasData } from 'shared/adapters/shared';
import app from 'state';

// TODO: ensure this only opens on mobile

type TerraAddress = {
  address: string
}

class TerraWalletConnectWebWalletController implements IWebWallet<TerraAddress> {
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
    return "phoenix-1";
  }

  public async getRecentBlock(chainIdentifier: string) {
    const client = new LCDClient({
      URL: app.chain.meta.ChainNode.url,
      chainID: chainIdentifier
    });
    const tmClient = new TendermintAPI(client);
    const blockInfo = await tmClient.blockInfo();

    return {
      number: parseInt(blockInfo.block.header.height),
      // TODO: is this the hash we should use? the terra.js API has no documentation
      hash: blockInfo.block.header.data_hash,
      // seconds since epoch
      timestamp: Math.floor(new Date(blockInfo.block.header.time).getTime() / 1000)
    };
  }

  public async signCanvasMessage(account: Account, canvasMessage: CanvasData): Promise<string> {
    try {
      const result = await this._wallet.signBytes(Buffer.from(JSON.stringify(canvasMessage)));
      if (!result.success) {
        throw new Error('SignBytes unsuccessful');
      }
      const signature = {
        signature: {
          pub_key: {
            type: 'tendermint/PubKeySecp256k1',
            // TODO: ensure single signature
            value: result.result.public_key.toAmino().value,
          },
          signature: Buffer.from(result.result.signature).toString('base64'),
        },
      };
      return JSON.stringify(signature);
    } catch (error) {
      console.error(error);
      throw new Error(`Failed to sign with account: ${error.message}`);
    }
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
      // Create WalletConnect Provider
      const chainOptions = await getChainOptions();
      this._controller = new WalletController({
        ...chainOptions,
      });

      //  Enable session (triggers QR Code modal)
      await this._controller.connect(ConnectType.WALLETCONNECT);

      let subscription;
      this._wallet = await new Promise((resolve, reject) => {
        subscription = this._controller.connectedWallet().subscribe((connectedWallet) => {
          if (connectedWallet) {
            resolve(connectedWallet)
          }
        })
      });
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }

      this._accounts = [ { address: this._wallet.terraAddress } ];
      this._enabled = true;
      this._enabling = false;
    } catch (error) {
      this._enabling = false;
      throw new Error(`Failed to enable WalletConnect: ${error.message}`);
    }
  }
}

export default TerraWalletConnectWebWalletController;
