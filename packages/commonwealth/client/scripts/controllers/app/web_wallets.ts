import type { ChainBase, WalletId } from 'common-common/src/types';
import $ from 'jquery';
import type { Account, IWebWallet } from 'models';
import app from 'state';
import CosmosEvmMetamaskWalletController from './webWallets/cosmos_evm_metamask_web_wallet';
import KeplrEthereumWalletController from './webWallets/keplr_ethereum_web_wallet';
import KeplrWebWalletController from './webWallets/keplr_web_wallet';
import MetamaskWebWalletController from './webWallets/metamask_web_wallet';
import NearWebWalletController from './webWallets/near_web_wallet';
import PhantomWebWalletController from './webWallets/phantom_web_wallet';
import PolkadotWebWalletController from './webWallets/polkadot_web_wallet';
import RoninWebWalletController from './webWallets/ronin_web_wallet';
import TerraStationWebWalletController from './webWallets/terra_station_web_wallet';
import TerraWalletConnectWebWalletController from './webWallets/terra_walletconnect_web_wallet';
import WalletConnectWebWalletController from './webWallets/walletconnect_web_wallet';

export default class WebWalletController {
  private _wallets: IWebWallet<any>[];
  public get wallets() {
    return this._wallets;
  }

  public availableWallets(chain?: ChainBase): IWebWallet<any>[] {
    // handle case like injective, axie, where we require a specific wallet
    const specificChain = app.chain?.meta?.id;
    if (app.chain?.meta?.id) {
      const specificWallets = this._wallets.filter(
        (w) => !!w.specificChains?.includes(specificChain)
      );
      if (specificWallets.length > 0)
        return specificWallets.filter((w) => w.available);
    }

    // handle general case of wallet by chain base
    return this._wallets.filter(
      (w) =>
        w.available &&
        !w.specificChains && // omit chain-specific wallets unless on correct chain
        (!chain || w.chain === chain)
    );
  }

  public getByName(name: string): IWebWallet<any> | undefined {
    return this._wallets.find((w) => w.name === name);
  }

  // sets a WalletId on the backend for an account whose walletId has not already been set
  private async _setWalletId(
    account: Account,
    wallet: WalletId
  ): Promise<void> {
    if (app.user.activeAccount.address !== account.address) {
      console.error('account must be active to set wallet id');
      return;
    }
    // do nothing on failure
    try {
      await $.post(`${app.serverUrl()}/setAddressWallet`, {
        address: account.address,
        author_chain: account.chain.id,
        wallet_id: wallet,
        jwt: app.user.jwt,
      });
    } catch (e) {
      console.error(`Failed to set wallet for address: ${e.message}`);
    }
  }

  public async locateWallet(
    account: Account,
    chain?: ChainBase
  ): Promise<IWebWallet<any>> {
    if (chain && account.chain.base !== chain) {
      throw new Error('account on wrong chain base');
    }
    if (account.walletId) {
      return this.getByName(account.walletId);
    }
    const availableWallets = this.availableWallets(chain);
    if (availableWallets.length === 0) {
      throw new Error('No wallet available');
    }

    for (const wallet of availableWallets) {
      if (!wallet.enabled) {
        await wallet.enable();
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
      new PolkadotWebWalletController(),
      new MetamaskWebWalletController(),
      new WalletConnectWebWalletController(),
      new KeplrWebWalletController(),
      new NearWebWalletController(),
      new TerraStationWebWalletController(),
      new CosmosEvmMetamaskWalletController(),
      new KeplrEthereumWalletController(),
      new PhantomWebWalletController(),
      new RoninWebWalletController(),
      new TerraWalletConnectWebWalletController(),
    ];
  }
}
