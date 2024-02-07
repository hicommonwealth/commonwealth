import { ChainBase, ChainNetwork, WalletId } from '@hicommonwealth/core';
import type Account from '../../../models/Account';
import type IWebWallet from '../../../models/IWebWallet';

import type { SessionPayload } from '@canvas-js/interfaces';

import app from 'state';

type TerraAddress = {
  address: string;
};

declare global {
  interface Window {
    station?: any;
  }
}

class TerraStationWebWalletController implements IWebWallet<TerraAddress> {
  private _enabled: boolean;
  private _accounts: TerraAddress[] = [];
  private _enabling = false;
  private _terra;
  private _extension;

  public readonly name = WalletId.TerraStation;
  public readonly label = 'Station';
  public readonly chain = ChainBase.CosmosSDK;
  public readonly defaultNetwork = ChainNetwork.Terra;
  public readonly specificChains = ['terra'];

  public get available() {
    return !!window.station;
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
    console.log('Attempting to enable Station');
    this._enabling = true;

    const connectResult = await window.station.connect();
    const accountAddr = connectResult?.address;

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
        new Date(blockInfo.block.header.time).getTime() / 1000,
      ),
    };
  }

  public async signCanvasMessage(
    account: Account,
    canvasSessionPayload: SessionPayload,
  ): Promise<string> {
    // timeout?
    const canvas = await import('@canvas-js/interfaces');
    let result;

    try {
      const signBytesResult = await window.station.signBytes(
        Buffer.from(canvas.serializeSessionPayload(canvasSessionPayload)),
      );

      result = signBytesResult;
    } catch (error) {
      console.error(error);
    }

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
