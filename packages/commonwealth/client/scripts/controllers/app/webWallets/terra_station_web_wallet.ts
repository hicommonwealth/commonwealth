import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import { Account } from 'models';
import { Extension, LCDClient } from '@terra-money/terra.js';
import ClientSideWebWalletController from './client_side_web_wallet';
import { CanvasData } from 'shared/adapters/shared';

type TerraAddress = {
  address: string
}

class TerraStationWebWalletController extends ClientSideWebWalletController<TerraAddress> {
  private _enabled: boolean;
  private _accounts: TerraAddress[] = [];
  private _enabling = false;
  private _extension = new Extension();

  public readonly name = WalletId.TerraStation;
  public readonly label = 'Terra Station';
  public readonly chain = ChainBase.CosmosSDK;
  public readonly defaultNetwork = ChainNetwork.Terra;
  public readonly specificChains = ['terra'];

  public get available() {
    return this._extension.isAvailable;
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

  // public async signMessage(message: string): Promise<any> {
  //   return this._extension.sign({ msgs: [message]});
  // }

  public async enable() {
    console.log('Attempting to enable Terra Station');
    this._enabling = true;

    const accountAddr = await new Promise<TerraAddress>((resolve) => {
      this._extension.once('onConnect', resolve);
      this._extension.connect();
    }).catch((error) => {
      console.error(`Failed to enabled Terra Station ${error.message}`);
    });

    if (accountAddr && !this._accounts.includes(accountAddr)) {
      this._accounts.push(accountAddr);
    }

    this._enabled = this._accounts.length !== 0;
    this._enabling = false;
  }

  public async getChainId() {
    // Terra mainnet
    return "phoenix-1";
  }

  public async getRecentBlock() {
    const chainId = await this.getChainId();
    const client = new LCDClient({
      // why doesn't setten.io work?
      URL: "https://phoenix-lcd.terra.dev/",
      chainID: chainId
    });

    const txInfos = await client.tx.txInfosByHeight(undefined);
    const txInfo = txInfos[0];

    return {
      number: txInfo.height,
      hash: txInfo.txhash,
      // seconds since epoch
      timestamp: Math.floor(new Date(txInfo.timestamp).getTime() / 1000)
    };
  }

  public async signCanvasMessage(account: Account, canvasMessage: CanvasData): Promise<string> {
    // timeout?
    const result = await new Promise<any>((resolve, reject) => {
      this._extension.on('onSign', (payload) => {
        if (payload.result?.signature) resolve(payload.result);
        else reject();
      });
      try {
        this._extension.signBytes({
          bytes: Buffer.from(JSON.stringify(canvasMessage)),
        });
      } catch (error) {
        console.error(error);
      }
    });

    const signature = {
      signature: {
        pub_key: {
          type: 'tendermint/PubKeySecp256k1',
          value: result.public_key,
        },
        signature: result.signature,
      },
    };
    return JSON.stringify(signature);
  }

  public async validateWithAccount(
    account: Account,
    walletSignature: string
  ): Promise<void> {
    return account.validate(walletSignature);
  }
}

export default TerraStationWebWalletController;
