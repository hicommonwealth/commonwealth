import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import {
  ConnectedWallet,
  ConnectType,
  getChainOptions,
  WalletController,
} from '@terra-money/wallet-controller';
import { Account, IWebWallet } from 'models';

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
  public readonly label = 'Terra Station WalletConnect';
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

  api: () => any

  public async signWithAccount(account: Account): Promise<string> {
    try {
      const result = await this._wallet.signBytes(Buffer.from(account.validationToken));
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

  public async validateWithAccount(
    account: Account,
    walletSignature: string
  ): Promise<void> {
    return account.validate(walletSignature);
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
