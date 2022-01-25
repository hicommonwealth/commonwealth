import { ChainBase } from 'types';
import { Account, IWebWallet } from 'models';
import { Extension, Msg, MsgStoreCode, StdFee } from '@terra-money/terra.js';

class TerraStationWebWalletController implements IWebWallet<string> {
  private _enabled: boolean;
  private _accounts: string[] = [];
  private _enabling: boolean = false;
  private _extension = new Extension()

  public readonly name = 'terrastation';
  public readonly label = 'TerraStation';
  public readonly chain = ChainBase.CosmosSDK;
  public readonly specificChain = 'terra';

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
        if (accountAddr && !this._accounts.includes(accountAddr)) {
          console.log(accountAddr);
          this._accounts.push(accountAddr);
          console.log('enabled and added');
        }
        this._enabled = this._accounts.length !== 0;
      });
      this._extension.connect();
      this._enabling = false;
    } catch (error) {
      console.error(`Failed to enabled Terra Station ${error.message}`);
      this._enabling = false;
    }
  }

  public async validateWithAccount(account: Account<any>): Promise<void> {
    this._extension.on('onSign', (payload) => {
      console.log(payload);
    });
    const msgs: Msg[] = [
      new MsgStoreCode(this._accounts[0], account.validationToken)
    ];
    try {
      this._extension.sign({
        fee: new StdFee(0, '0ust'),
        msgs
      });
    } catch (error) {
      console.log(error);
    }

    // timeout?
    const result = await new Promise<any>((resolve, reject) => {
      this._extension.on('onSign', (payload) => {
        if (payload.result?.signature) resolve(payload.result);
        else reject();
      });
    });

    const signature = {
      signed: result.stdSignMsgData,
      signature: {
        pub_key: {
          type: 'tendermint/PubKeySecp256k1',
          value: result.public_key
        },
        signature: result.signature
      }
    };
    return account.validate(JSON.stringify(signature));
  }
}

export default TerraStationWebWalletController;
