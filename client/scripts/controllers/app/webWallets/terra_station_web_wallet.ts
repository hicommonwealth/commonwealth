import { ChainBase, ChainNetwork } from 'types';
import { Account, IWebWallet } from 'models';
import { Extension, CreateTxOptions } from '@terra-money/terra.js';

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
      const res: any = await this._extension.request('connect');
      const accountAddr: string = res.payload.address;
      if (accountAddr && !this._accounts.includes(accountAddr)) {
        this._accounts.push(accountAddr);
      }
      this._enabled = !!accountAddr;
      this._enabling = false;
    } catch (error) {
      console.error(`Failed to enabled Terra Station ${error.message}`);
      this._enabling = false;
    }
  }

  public async sendTx(options: CreateTxOptions) {
    const res: any = await this._extension.request('post', JSON.parse(JSON.stringify(options)));
    console.log(res);
    return res.payload.transactionHash;
  }

  public async validateWithAccount(account: Account<any>): Promise<void> {
    // timeout?
    const bytes = Buffer.from(account.validationToken.trim(), 'hex').toString('base64');
    const res: any = await this._extension.request('sign', { bytes, purgeQueue: true });
    if (res?.payload?.result?.signature) {
      return account.validate(JSON.stringify(res.payload.result));
    } else {
      console.error('Failed to validate: ', res);
      throw new Error('Failed to validate terra account');
    }
  }
}

export default TerraStationWebWalletController;
