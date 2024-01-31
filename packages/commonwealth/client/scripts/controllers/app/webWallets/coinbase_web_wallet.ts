declare let window: any;

import $ from 'jquery';

import type Web3 from 'web3';
import type Account from '../../../models/Account';
import type BlockInfo from '../../../models/BlockInfo';
import type IWebWallet from '../../../models/IWebWallet';

import * as siwe from 'siwe';
import type { provider } from 'web3-core';
import { hexToNumber } from 'web3-utils';

import type { SessionPayload } from '@canvas-js/interfaces';

import { ChainBase, ChainNetwork, WalletId } from '@hicommonwealth/core';
import { createSiweMessage } from 'adapters/chain/ethereum/keys';
import { setActiveAccount } from 'controllers/app/login';
import app from 'state';

class CoinbaseWebWalletController implements IWebWallet<string> {
  // GETTERS/SETTERS
  private _enabled: boolean;
  private _enabling = false;
  private _accounts: string[];
  private _provider: provider;
  private _web3: Web3 | any;

  public readonly name = WalletId.Coinbase;
  public readonly label = 'Coinbase Wallet';
  public readonly defaultNetwork = ChainNetwork.Ethereum;
  public readonly chain = ChainBase.Ethereum;

  public get available() {
    return !!window.CoinbaseWalletSDK;
  }

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

  public get api() {
    return this._web3;
  }

  public getChainId() {
    // We need app.chain? because the app might not be on a page with a chain (e.g homepage),
    // and node? because the chain might not have a node provided
    return app.chain?.meta.node?.ethChainId?.toString() || '1';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getRecentBlock(chainIdentifier: string): Promise<BlockInfo> {
    const block = await this._web3.givenProvider.request({
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

    const signature = await this._web3.givenProvider.request({
      method: 'personal_sign',
      params: [message, account.address],
    });

    // signature format: https://docs.canvas.xyz/docs/formats#ethereum
    return `${domain}/${nonce}/${signature}`;
  }

  // ACTIONS
  public async enable() {
    console.log('Attempting to enable Coinbase');
    this._enabling = true;
    try {
      // default to ETH
      const chainId = this.getChainId();

      // ensure we're on the correct chain

      const Web3 = (await import('web3')).default;
      let ethereum = window.ethereum.isCoinbaseWallet ? window.ethereum : null;

      if (window.ethereum.providers?.length) {
        window.ethereum.providers.forEach(async (p) => {
          if (p.isCoinbaseWallet) ethereum = p;
        });
      }
      //Phantom case or other nested cases
      if (!ethereum) {
        window.ethereum.providers.forEach(async (p) => {
          if (p.overrideIsMetaMask) {
            ethereum = p.selectedProvider;
          }
        });
      }

      this._web3 = {
        givenProvider: ethereum,
      };
      await this._web3.givenProvider.request({
        method: 'eth_requestAccounts',
      });
      const chainIdHex = `0x${parseInt(chainId, 10).toString(16)}`;
      try {
        if (app.config.evmTestEnv !== 'test') {
          await this._web3.givenProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainIdHex }],
          });
        }
      } catch (switchError) {
        // This error code indicates that the chain has not been added to coinbase.
        if (switchError.code === 4902) {
          const wsRpcUrl = new URL(app.chain.meta.node.url);
          const rpcUrl =
            app.chain.meta.node.altWalletUrl || `https://${wsRpcUrl.host}`;

          const chains = await $.getJSON('https://chainid.network/chains.json');
          const baseChain = chains.find((c) => c.chainId === chainId);
          await this._web3.givenProvider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: baseChain.name,
                nativeCurrency: baseChain.nativeCurrency,
                rpcUrls: [rpcUrl],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }
      // fetch active accounts
      this._accounts = (
        await this._web3.givenProvider.request({
          method: 'eth_requestAccounts',
        })
      ).map((addr) => {
        return Web3.utils.toChecksumAddress(addr);
      });

      this._provider = this._web3.currentProvider;
      if (this._accounts.length === 0) {
        throw new Error('coinbase fetched no accounts');
      }

      await this.initAccountsChanged();
      this._enabled = true;
      this._enabling = false;
    } catch (error) {
      let errorMsg = `Failed to enable coinbase: ${error.message}`;
      if (error.code === 4902) {
        errorMsg = `Failed to enable coinbase: Please add chain ID ${app.chain.meta.node.ethChainId}`;
      }
      console.error(errorMsg);
      this._enabling = false;
      throw new Error(errorMsg);
    }
  }

  public async initAccountsChanged() {
    await this._web3.givenProvider.on(
      'accountsChanged',
      async (accounts: string[]) => {
        const updatedAddress = app.user.activeAccounts.find(
          (addr) => addr.address === accounts[0],
        );
        if (!updatedAddress) return;
        await setActiveAccount(updatedAddress);
      },
    );
  }

  public async switchNetwork() {
    try {
        // Get current chain ID
        const currentChainId = await this._web3.eth.getChainId();
        const communityChain = this.getChainId();
        const chainIdHex = `0x${parseInt(communityChain, 10).toString(16)}`;
        if (currentChainId !== communityChain) {
            try {
              await window.ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: `0x${chainIdHex}` }],
              });
          } catch(error) {
            if (error.code === 4902) {
              const chains = await $.getJSON('https://chainid.network/chains.json');
              const baseChain = chains.find((c) => c.chainId === communityChain);
              // Check if the string contains '${' and '}'
              const rpcUrl = baseChain.rpc.filter(r => !/\${.*?}/.test(r))
              const url = rpcUrl.length > 0 ? rpcUrl[0] : app.chain.meta.node.altWalletUrl;
              await this._web3.givenProvider.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: chainIdHex,
                    chainName: baseChain.name,
                    nativeCurrency: baseChain.nativeCurrency,
                    rpcUrls: [rpcUrl],
                  },
                ],
              });
            }
          }
        } else {
            console.log('Metamask is already connected to the desired chain.');
        }
    } catch (error) {
        console.error('Error checking and switching chain:', error);
    }
}

export default CoinbaseWebWalletController;
