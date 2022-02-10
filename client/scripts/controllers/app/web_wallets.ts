import { IWebWallet } from 'models';
import { ChainBase } from 'types';
import app from 'state';
import MetamaskWebWalletController from './webWallets/metamask_web_wallet';
import WalletConnectWebWalletController from './webWallets/walletconnect_web_wallet';
import KeplrWebWalletController from './webWallets/keplr_web_wallet';
import PolkadotWebWalletController from './webWallets/polkadot_web_wallet';
import NearWebWalletController from './webWallets/near_web_wallet';
import PhantomWebWalletController from './webWallets/phantom_web_wallet';

export default class WebWalletController {
  private _wallets: IWebWallet<any>[];
  public get wallets() {
    return this._wallets;
  }

  // TODO filter out wallets that are specific to a chain (and the current page isn't that chain)
  public availableWallets(base?: ChainBase): IWebWallet<any>[] {
    // for id, only return specific supported chains (i.e. injective)
    if (app.chain?.id) {
      const specificWallets = this._wallets.filter((w) => w.available && w.addlChains?.includes(app.chain?.id));
      if (specificWallets?.length > 0) {
        return specificWallets;
      }
    }
    // otherwise, return using base
    return this._wallets.filter((w) => w.available && (!base || w.chain === base))
  }

  public getByName(name: string): IWebWallet<any> | undefined {
    return this._wallets.find((w) => w.name === name);
  }

  public async locateWallet(address: string, base?: ChainBase): Promise<IWebWallet<any>> {
    const availableWallets = this.availableWallets(base);
    if (availableWallets.length === 0) {
      throw new Error('No wallet available');
    }

    for (const wallet of availableWallets) {
      if (!wallet.enabled) {
        await wallet.enable();
      }
      // TODO: ensure that we can find any wallet, even if non-string accounts
      if (wallet.accounts.find((acc) => acc === address)) {
        console.log(`Found wallet: ${wallet.name}`);
        return wallet;
      }
      // disable if not found, otherwise leave enabled
      await wallet.disable();
    }
    throw new Error(`No wallet found for ${address}`);
  }

  constructor() {
    this._wallets = [
      new PolkadotWebWalletController(),
      new MetamaskWebWalletController(),
      new WalletConnectWebWalletController(),
      new KeplrWebWalletController(),
      new NearWebWalletController(),
      new PhantomWebWalletController(),
    ];
  }
}
