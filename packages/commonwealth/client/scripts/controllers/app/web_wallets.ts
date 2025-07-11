import type { ChainBase, WalletId } from '@hicommonwealth/shared';
import axios from 'axios';
import { BASE_API_PATH } from 'client/scripts/utils/trpcClient';
import app from 'state';
import { userStore } from 'state/ui/user';
import Account from '../../models/Account';
import IWebWallet from '../../models/IWebWallet';
import BackpackWebWalletController from './webWallets/backpack_web_wallet';
import BinanceWebWalletController from './webWallets/binance_web_wallet';
import BitgetWebWalletController from './webWallets/bitget_web_wallet';
import CoinbaseWebWalletController from './webWallets/coinbase_web_wallet';
import CosmosEvmMetamaskWalletController from './webWallets/cosmos_evm_metamask_web_wallet';
import KeplrEthereumWalletController from './webWallets/keplr_ethereum_web_wallet';
import KeplrWebWalletController from './webWallets/keplr_web_wallet';
import LeapWebWalletController from './webWallets/leap_web_wallet';
import MetamaskWebWalletController from './webWallets/metamask_web_wallet';
import OkxWebWalletController from './webWallets/okx_web_wallet';
import OkxSuiWebWalletController from './webWallets/okxSui_web_wallet';
import PhantomWebWalletController from './webWallets/phantom_web_wallet';
import PolkadotWebWalletController from './webWallets/polkadot_web_wallet';
import SolflareWebWalletController from './webWallets/solflare_web_wallet';
import SuiWebWalletController from './webWallets/sui_web_wallet';
import SuietWebWalletController from './webWallets/suiet_web_wallet';
import TerraStationWebWalletController from './webWallets/terra_station_web_wallet';
import TerraWalletConnectWebWalletController from './webWallets/terra_walletconnect_web_wallet';
import WalletConnectWebWalletController from './webWallets/walletconnect_web_wallet';

export default class WebWalletController {
  private _wallets: IWebWallet<any>[];
  private static _instance: WebWalletController;

  public static get Instance(): WebWalletController {
    return this._instance || (this._instance = new this());
  }

  public get wallets() {
    return this._wallets;
  }

  public availableWallets(chain?: ChainBase): IWebWallet<any>[] {
    // handle case like injective, where we require a specific wallet
    const specificChain = app.chain?.meta?.id || '';
    if (specificChain) {
      const specificWallets = this._wallets.filter(
        (w) => !!w.specificChains?.includes(specificChain),
      );
      if (specificWallets.length > 0)
        return specificWallets.filter((w) => w.available);
    }

    // handle general case of wallet by chain base
    return this._wallets.filter(
      (w) =>
        w.available &&
        !w.specificChains && // omit chain-specific wallets unless on correct chain
        (!chain || w.chain === chain),
    );
  }

  public getByName(name: string): IWebWallet<any> | undefined {
    return this._wallets.find((w) => w.name === name);
  }

  // sets a WalletId on the backend for an account whose walletId has not already been set
  public async _setWalletId(account: Account, wallet: WalletId): Promise<void> {
    if (userStore.getState().activeAccount?.address !== account.address) {
      console.error('account must be active to set wallet id');
      return;
    }
    // do nothing on failure
    try {
      await axios.post(
        `${BASE_API_PATH}/community.setAddressWallet`,
        {
          community_id: account.community.id,
          wallet_id: wallet,
          jwt: userStore.getState().jwt,
        },
        {
          headers: { address: account.address },
        },
      );
    } catch (e) {
      console.error(`Failed to set wallet for address: ${e.message}`);
    }
  }

  public async locateWallet(
    account: Account,
    chain?: ChainBase,
  ): Promise<IWebWallet<any>> {
    if (chain && account.community.base !== chain) {
      throw new Error('account on wrong chain base');
    }
    if (account.walletId) {
      // @ts-expect-error StrictNullChecks
      return this.getByName(account.walletId);
    }
    const availableWallets = this.availableWallets(chain);
    if (availableWallets.length === 0) {
      throw new Error('No wallet available');
    }

    if (userStore.getState().addresses?.[0]?.walletId === 'magic') {
      throw new Error(
        'On-chain Transactions not currently available for magic',
      );
    }
    for (const wallet of availableWallets) {
      const countEnabled = availableWallets.filter((x) => x.enabled).length;
      if (countEnabled == 0) {
        await wallet.enable();
      } else if (!wallet.enabled) {
        continue;
      }
      // TODO: ensure that we can find any wallet, even if non-string accounts
      if (wallet.accounts.find((acc) => acc === account.address)) {
        await this._setWalletId(account, wallet.name);
        return wallet;
      }
      // TODO: disable if not found
    }
    throw new Error(`No wallet found for ${account.address}`);
  }

  constructor() {
    this._wallets = [
      new OkxWebWalletController(),
      new PolkadotWebWalletController(),
      new MetamaskWebWalletController(),
      new WalletConnectWebWalletController(),
      new KeplrWebWalletController(),
      new LeapWebWalletController(),
      new TerraStationWebWalletController(),
      new CosmosEvmMetamaskWalletController(),
      new KeplrEthereumWalletController(),
      new PhantomWebWalletController(),
      new TerraWalletConnectWebWalletController(),
      new CoinbaseWebWalletController(),
      new BackpackWebWalletController(),
      new SolflareWebWalletController(),
      new SuiWebWalletController(),
      new BinanceWebWalletController(),
      new SuietWebWalletController(),
      new OkxSuiWebWalletController(),
      new BitgetWebWalletController(),
    ];
  }
}
