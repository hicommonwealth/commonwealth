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
import RoninWebWalletController from './webWallets/ronin_web_wallet';

export default class WebWalletController {
  private _wallets: IWebWallet<any>[];
  public get wallets() {
    return this._wallets;
  }

  public availableWallets(chain?: ChainBase): IWebWallet<any>[] {
    // handle case like injective, axie, where we require a specific wallet
    const specificChain = app.chain?.meta?.chain?.id;
    if (app.chain?.meta?.chain?.id) {
      const specificWallet = this._wallets.find((w) => w.specificChain === specificChain);
      if (specificWallet) return [ specificWallet ];
    }

    // handle general case of wallet by chain base
    return this._wallets.filter((w) => w.available
      && !w.specificChain // omit chain-specific wallets unless on correct chain
      && (!chain || w.chain === chain));
  }

  public getByName(name: string): IWebWallet<any> | undefined {
    return this._wallets.find((w) => w.name === name);
  }

  public async locateWallet(address: string, chain?: ChainBase): Promise<IWebWallet<any>> {
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
      new RoninWebWalletController(),
    ];
  }
}
