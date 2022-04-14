import { ChainBase, ChainNetwork } from 'types';
import { Account, IWebWallet } from 'models';
import { CreateTxOptions, SimplePublicKey } from '@terra-money/terra.js';
import { WalletInfo, NetworkInfo } from '@terra-money/wallet-types';
import { WalletController, getChainOptions, WalletStatus } from '@terra-money/wallet-controller';
import { reject } from 'lodash';
import { getTerraExtensions } from '@terra-money/wallet-controller/modules/extension-router/multiChannel';
import { bech32 } from 'bech32';
import * as ethUtil from 'ethereumjs-util';

class TerraStationWebWalletController implements IWebWallet<string> {
  private _enabled: boolean;
  private _accounts: string[] = [];
  private _enabling = false;
  private _controller: WalletController;
  private _hexAddr: string;

  public readonly name = 'terrastation';
  public readonly label = 'TerraStation';
  public readonly chain = ChainBase.CosmosSDK;
  public readonly specificNetwork = ChainNetwork.Terra;

  public get available() {
    return getTerraExtensions().length > 0;
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
      const options = await getChainOptions();
      this._controller = new WalletController({ ...options });

      // rxjs observable
      const { wallet, network } = await new Promise<{ wallet: WalletInfo, network: NetworkInfo }>((resolve) => {
        this._controller.states().subscribe((states) => {
          if (states.status === WalletStatus.WALLET_CONNECTED) {
            console.log(states);
            if (!states.supportFeatures.has('post')) {
              reject(new Error('wallet does not support txs'));
            } else {
              resolve({ wallet: states.wallets[0], network: states.network });
            }
          } else {
            // TODO: handle error states
          }
        });
      });

      // TODO: validate network

      this._hexAddr = wallet.terraAddress;
      console.log(this._hexAddr);
      const addrBuf = ethUtil.Address.fromString(wallet.terraAddress).toBuffer();
      const accountAddr = bech32.encode('terra', bech32.toWords(addrBuf));
      console.log(accountAddr);
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
    const res = await this._controller.post(options, this._hexAddr)
    console.log(res);
    return res.result.txhash;
  }

  public async validateWithAccount(account: Account<any>): Promise<void> {
    console.log(account);
    // timeout?
    const bytes = Buffer.from(account.validationToken.trim(), 'hex');
    const res = await this._controller.signBytes(bytes, this._hexAddr);
    if (res?.result?.signature) {
      return account.validate(JSON.stringify({
        public_key: ((res.result.public_key.toData()) as SimplePublicKey.Data).key, // TODO: correct param?
        signature: Buffer.from(res.result.signature).toString('base64'),
        recid: res.result.recid,
      }));
    } else {
      console.error('Failed to validate: ', res);
      throw new Error('Failed to validate terra account');
    }
  }
}

export default TerraStationWebWalletController;
