import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import type Account from '../../../models/Account';
import type IWebWallet from '../../../models/IWebWallet';

import type { SessionPayload } from '@canvas-js/interfaces';

import app from 'state';

type TerraAddress = {
  address: string;
};

class TerraStationWebWalletController implements IWebWallet<TerraAddress> {
  private _enabled: boolean;
  private _accounts: TerraAddress[] = [];
  private _enabling = false;
  private _terra;
  private _extension;

  public readonly name = WalletId.TerraStation;
  public readonly label = 'Terra Station';
  public readonly chain = ChainBase.CosmosSDK;
  public readonly defaultNetwork = ChainNetwork.Terra;
  public readonly specificChains = ['terra'];

  public get available() {
    return !!window.isTerraExtensionAvailable;
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
    this._terra = await import('@terra-money/terra.js');
    this._extension = new this._terra.Extension();
    console.log('Attempting to enable Terra Station');
    this._enabling = true;

    // use a promise so that this function returns *after* the wallet has connected
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

  public getChainId() {
    // Terra mainnet
    return 'phoenix-1';
  }

  public async getRecentBlock(chainIdentifier: string) {
    const client = new this._terra.LCDClient({
      URL: app.chain.meta.ChainNode.url,
      chainID: chainIdentifier,
    });
    const tmClient = new this._terra.TendermintAPI(client);
    const blockInfo = await tmClient.blockInfo();

    return {
      number: parseInt(blockInfo.block.header.height),
      // TODO: is this the hash we should use? the terra.js API has no documentation
      hash: blockInfo.block.header.data_hash,
      // seconds since epoch
      timestamp: Math.floor(
        new Date(blockInfo.block.header.time).getTime() / 1000
      ),
    };
  }

  public async signCanvasMessage(
    account: Account,
    canvasMessage: SessionPayload
  ): Promise<string> {
    // timeout?
    const canvas = await import('@canvas-js/interfaces');
    const result = await new Promise<any>((resolve, reject) => {
      this._extension.on('onSign', (payload) => {
        if (payload.result?.signature) resolve(payload.result);
        else reject();
      });
      try {
        this._extension.signBytes({
          bytes: Buffer.from(canvas.serializeSessionPayload(canvasMessage)),
        });
      } catch (error) {
        console.error(error);
      }
    });

    return JSON.stringify({
      pub_key: {
        type: 'tendermint/PubKeySecp256k1',
        value: result.public_key,
      },
      signature: result.signature,
    });
  }
}

export default TerraStationWebWalletController;
