import { Account, ChainBase, IWebWallet } from 'models';
import { Coins, Extension, Msg, MsgSend } from '@terra-money/terra.js';

class TerraStationWebWalletController implements IWebWallet<string> {
  private _enabled: boolean;
  private _accounts: string[] = [];
  private _enabling: boolean = false;
  private _extension = new Extension()
  private _signature: string;

  public readonly name = 'terrastation';
  public readonly label = 'Terra Wallet (TerraStation)';
  public readonly chain = ChainBase.CosmosSDK;

  constructor() {
    this._extension.on('onConnect', (accountAddr) => {
      console.log(accountAddr)
      this._accounts.push(accountAddr);
    })
  }

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
      this._extension.connect()
      this._enabled = true;
      this._enabling = false;
    } catch (error) {
      console.error(`Failed to enabled Terra Station ${error.message}`);
      this._enabling = false;
    }
  }

  public async validateWithAccount(account: Account<any>): Promise<void> {
    // TODO: sign arbitrary transaction?
    const msgs: Msg[] = [
      new MsgSend(this._accounts[0], this._accounts[0], new Coins('1'))
    ]
    try {
      // this._extension.send('sign', account.validationToken)
      this._extension.sign({ msgs })
    } catch (error) {
      console.log(error)
    }

    // timeout?
    const signature = await new Promise<string>((resolve, reject) => {
      this._extension.on('onSign', (payload) => {
        if (payload.result.signature) resolve(payload.result.signature);
        else reject();
      })
    })

    return account.validate(signature);
  }
}

export default TerraStationWebWalletController;
