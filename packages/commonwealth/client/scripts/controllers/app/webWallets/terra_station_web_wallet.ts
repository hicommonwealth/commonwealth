import { ChainBase, ChainNetwork, WalletId } from '@hicommonwealth/core';
import type IWebWallet from '../../../models/IWebWallet';

import type { SessionSigner } from '@canvas-js/interfaces';
import { constructCosmosSignerCWClass } from 'shared/canvas/sessionSigners';

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

  public async getSessionSigner(): Promise<SessionSigner> {
    const { toBase64 } = await import('@cosmjs/encoding');
    const CosmosSignerCW = await constructCosmosSignerCWClass();
    return new CosmosSignerCW({
      signer: {
        type: 'bytes',
        signBytes: (message) => window.station.signBytes(toBase64(message)),
        getAddress: async () => this._accounts[0].address,
        getChainId: async () => this.getChainId(),
      },
    });
  }
}

export default TerraStationWebWalletController;
