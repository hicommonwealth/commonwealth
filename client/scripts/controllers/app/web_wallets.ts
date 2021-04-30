import { ChainBase, IWebWallet } from 'models';
import MetamaskWebWalletController from './webWallets/metamask_web_wallet';
import WalletConnectWebWalletController from './webWallets/walletconnect_web_wallet';
import KeplrWebWalletController from './webWallets/keplr_web_wallet';
import PolkadotWebWalletController from './webWallets/polkadot_web_wallet';
import NearWebWalletController from './webWallets/near_web_wallet';

export default class WebWalletController {
  private _wallets: IWebWallet<any>[];
  public get wallets() {
    return this._wallets;
  }

  public availableWallets(chain?: ChainBase) {
    return this._wallets.filter((w) => w.available && (!chain || w.chain === chain));
  }

  constructor() {
    this._wallets = [
      new PolkadotWebWalletController(),
      new MetamaskWebWalletController(),
      new WalletConnectWebWalletController(),
      new KeplrWebWalletController(),
      new NearWebWalletController(),
    ];
  }
}
