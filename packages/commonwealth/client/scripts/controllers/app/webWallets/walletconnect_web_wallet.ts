import { ChainBase, ChainNetwork, WalletId } from '@hicommonwealth/core';
import { createSiweMessage } from 'adapters/chain/ethereum/keys';
import { setActiveAccount } from 'controllers/app/login';
import * as siwe from 'siwe';
import app from 'state';
import type Web3 from 'web3';

import type { SessionPayload } from '@canvas-js/interfaces';
import { hexToNumber } from 'web3-utils';
import Account from '../../../models/Account';
import BlockInfo from '../../../models/BlockInfo';
import ChainInfo from '../../../models/ChainInfo';
import IWebWallet from '../../../models/IWebWallet';

class WalletConnectWebWalletController implements IWebWallet<string> {
  private _enabled: boolean;
  private _enabling = false;
  private _accounts: string[];
  private _chainInfo: ChainInfo;
  private _provider;
  private _web3: Web3;

  public readonly name = WalletId.WalletConnect;
  public readonly label = 'EVM Wallets';
  public readonly chain = ChainBase.Ethereum;
  public readonly available = true;
  public readonly defaultNetwork = ChainNetwork.Ethereum;

  public get provider() {
    return this._provider;
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

  public get api(): any {
    return this._web3;
  }

  public getChainId() {
    // We need app.chain? because the app might not be on a page with a chain (e.g homepage),
    // and node? because the chain might not have a node provided
    return this._chainInfo.node?.ethChainId?.toString() || '1';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getRecentBlock(chainIdentifier: string): Promise<BlockInfo> {
    const block = await this._provider.request({
      method: 'eth_getBlockByNumber',
      params: ['latest', false],
    });

    return {
      number: hexToNumber(block.number),
      hash: block.hash,
      timestamp: hexToNumber(block.timestamp),
    };
  }

  public async signCanvasMessage(
    account: Account,
    sessionPayload: SessionPayload,
  ): Promise<string> {
    const nonce = siwe.generateNonce();
    // this must be open-ended, because of custom domains
    const domain = document.location.origin;
    const message = createSiweMessage(sessionPayload, domain, nonce);
    const signature = await this._provider.request({
      method: 'personal_sign',
      params: [message, account.address],
      jsonrpc: '2.0',
    });

    // signature format: https://docs.canvas.xyz/docs/formats#ethereum
    return `${domain}/${nonce}/${signature}`;
  }

  public async reset() {
    console.log('Attempting to reset WalletConnect');
    if (!this._provider) {
      // Remove the object that stores the session (needed when refreshed page since initial connection established)
      localStorage.removeItem('walletconnect');
      return;
    }
    await this._provider.wc.killSession();
    this._provider.disconnect();
    this._enabled = false;
  }

  public async enable(modal: any) {
    console.log('Attempting to enable WalletConnect');

    if (modal.getIsConnected()) {
      this._enabling = true;
      // try {
      // Create WalletConnect Provider
      this._chainInfo =
        app.chain?.meta || app.config.chains.getById(this.defaultNetwork);
      const chainId = this._chainInfo.node?.ethChainId || 1;
      this._provider = modal.getWalletProvider();

      const Web3 = (await import('web3')).default;
      this._web3 = new Web3(this._provider as any);
      this._accounts = await this._web3.eth.getAccounts();
      console.log(this._accounts);
      if (this._accounts.length === 0) {
        throw new Error('WalletConnect fetched no accounts.');
      }

      await this.initAccountsChanged();
      this._enabled = true;
      this._enabling = false;
      console.log('WalletConnect enabled');
    }
    // } catch (error) {
    //   this._enabling = false;
    //   throw new Error(`Failed to enable WalletConnect: ${error.message}`);
    // }
  }

  public async initAccountsChanged() {
    await this._provider.on('accountsChanged', async (accounts: string[]) => {
      const updatedAddress = app.user.activeAccounts.find(
        (addr) => addr.address === accounts[0],
      );
      if (!updatedAddress) return;
      await setActiveAccount(updatedAddress);
    });
    // TODO: chainChanged, disconnect events
  }
}

export default WalletConnectWebWalletController;
