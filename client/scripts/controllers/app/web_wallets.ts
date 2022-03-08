import { IWebWallet } from 'models';
import { ChainBase } from 'types';
import app from 'state';
import MetamaskWebWalletController from './webWallets/metamask_web_wallet';
import WalletConnectWebWalletController from './webWallets/walletconnect_web_wallet';
import KeplrWebWalletController from './webWallets/keplr_web_wallet';
import PolkadotWebWalletController from './webWallets/polkadot_web_wallet';
import NearWebWalletController from './webWallets/near_web_wallet';
import TerraStationWebWalletController from './webWallets/terra_station_web_wallet';
import InjectiveWebWalletController from './webWallets/injective_web_wallet';
import PhantomWebWalletController from './webWallets/phantom_web_wallet';

export default class WebWalletController {
  private _wallets: IWebWallet<any>[];
  public get wallets() {
    return this._wallets;
  }

  // TODO filter out wallets that are specific to a chain (and the current page isn't that chain)
  public availableWallets(chain?: ChainBase): IWebWallet<any>[] {
    return this._wallets.filter(
      (w) =>
        w.available &&
        (!chain || w.chain === chain) &&
        // if a specific chain is specified on a wallet AND a current chain is defined (aka not on home page) then load
        // the wallet if the current chain is the same as the specific chain
        (w.specificChain && app.chain?.meta?.chain.id
          ? w.specificChain === app.chain.meta.chain.id
          : true)
    );
  }

  public getByName(name: string): IWebWallet<any> | undefined {
    return this._wallets.find((w) => w.name === name);
  }

  public async locateWallet(
    address: string,
    chain?: ChainBase
  ): Promise<IWebWallet<any>> {
    const availableWallets = this.availableWallets(chain);
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
      // TODO: disable if not found
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
      new TerraStationWebWalletController(),
      new InjectiveWebWalletController(),
      new PhantomWebWalletController(),
    ];
  }
}
