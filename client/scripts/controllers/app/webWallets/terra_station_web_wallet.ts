import { Account, ChainBase, IWebWallet } from 'models';
import { Extension } from '@terra-money/terra.js'

class TerraStationWebWalletController implements IWebWallet<string> {
  private _enabled: boolean;
  private _accounts: string[];
  private _enabling: boolean = false;
  private _extension = new Extension()

  public readonly name = 'terrastation';
  public readonly label = 'Terra Wallet (TerraStation)';
  public readonly chain = ChainBase.CosmosSDK;

  public get available() {
    return this._extension.isAvailable
  }

  public get enabled() {
    return this.available && this._enabled
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

    try {
      const result = this._extension.connect()
      console.log(result);

      this._enabled = true;
      this._enabling = false;
    } catch (error) {
      console.error(`Failed to enabled Terra Station ${error.message}`);
      this._enabling = false;
    }
  }

  public async validateWithAccount(account: Account<any>): Promise<void> {
    return Promise.resolve(undefined);
  }
}
