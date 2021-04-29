import { ChainBase, IWebWallet } from 'models';
import MetamaskWebWalletController from './metamask_web_wallet';
import KeplrWebWalletController from './keplr_web_wallet';
import PolkadotWebWalletController from './polkadot_web_wallet';
import NearWebWalletController from './near_web_wallet';

export default class WebWalletController {
  private _wallets: IWebWallet<any>[];
  public get wallets() {
    return this._wallets;
  }

  public get currentWallet(): IWebWallet<any> | undefined {
    // TODO: how to handle chain switching? we need to ensure wallets are deinitialized
    return this._wallets.find((w) => w.enabled);
  }

  public availableWallets(chain?: ChainBase) {
    return this._wallets.filter((w) => w.available && (!chain || w.chain === chain));
  }

  public defaultWallet(chain: ChainBase) {
    const wallets = this.availableWallets(chain);
    return wallets.length > 0 ? wallets[0] : undefined;
  }

  constructor() {
    this._wallets = [
      new PolkadotWebWalletController(),
      new MetamaskWebWalletController(),
      new KeplrWebWalletController(),
      new NearWebWalletController(),
    ];
  }
}
