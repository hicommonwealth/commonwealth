import { ChainBase, ChainNetwork } from 'types';
import { Account, IWebWallet } from 'models';
import { Extension } from '@terra-money/terra.js';

class TerraStationWebWalletController implements IWebWallet<string> {
  private _enabled: boolean;
  private _accounts: string[] = [];
  private _enabling = false;
  private _extension = new Extension()

  public readonly name = 'terrastation';
  public readonly label = 'TerraStation';
  public readonly chain = ChainBase.CosmosSDK;
  public readonly specificNetwork = ChainNetwork.Terra;

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

    try {
      this._extension.once('onConnect', (accountAddr) => {
        console.log(this._extension);
        if (accountAddr && !this._accounts.includes(accountAddr)) {
          console.log(accountAddr);
          this._accounts.push(accountAddr);
          console.log('enabled and added');
        }
        this._enabled = !!accountAddr;
        this._enabling = false;
      });
      this._extension.connect();
    } catch (error) {
      console.error(`Failed to enabled Terra Station ${error.message}`);
      this._enabling = false;
    }
  }

  public async validateWithAccount(account: Account<any>): Promise<void> {
    // timeout?
    const result = await new Promise<{ public_key: string, signature: string, recid: number }>((resolve, reject) => {
      this._extension.on('onSign', (payload) => {
        if (payload.result?.signature) resolve(payload.result);
        else reject();
      });

      try {
        this._extension.signBytes({
          purgeQueue: true,
          bytes: Buffer.from(account.validationToken.trim(), 'hex'),
        });
      } catch (error) {
        console.error(error);
        // TODO: handling?
      }
    });
    return account.validate(JSON.stringify(result));
  }
}

export default TerraStationWebWalletController;
