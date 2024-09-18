import { ChainBase, ChainNetwork, WalletId } from '@hicommonwealth/shared';
import type IWebWallet from '../../../models/IWebWallet';

import { toBase64 } from '@cosmjs/encoding';
import { CosmosSignerCW } from '@hicommonwealth/shared';
import app from 'state';
import { SERVER_URL } from 'state/api/config';

declare global {
  interface Window {
    station?: any;
  }
}

class TerraStationWebWalletController implements IWebWallet<string> {
  private _enabled: boolean;
  private _accounts: string[] = [];
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
    const url = `${window.location.origin}${SERVER_URL}/cosmosProxy/${chainIdentifier}`;
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
      bech32Prefix: `${app.chain?.meta.bech32_prefix || 0}`,
      signer: {
        type: 'bytes',
        signBytes: (message) => window.station.signBytes(toBase64(message)),
        getAddress: () => this._accounts[0],
        getChainId: () => this.getChainId(),
      },
    });
  }
}

export default TerraStationWebWalletController;
