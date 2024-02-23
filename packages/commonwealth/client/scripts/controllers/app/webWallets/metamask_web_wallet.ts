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

class MetamaskWebWalletController implements IWebWallet<string> {
  // GETTERS/SETTERS
  private _enabled: boolean;
  private _enabling = false;
  private _accounts: string[];
  private _provider: provider;
  private _web3: Web3 | any;

  public readonly name = WalletId.Metamask;
  public readonly label = 'Metamask';
  public readonly defaultNetwork = ChainNetwork.Ethereum;
  public readonly chain = ChainBase.Ethereum;

  public get available() {
    return !!window.ethereum;
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
      params: [account.address, message],
    });

    // signature format: https://docs.canvas.xyz/docs/formats#ethereum
    return `${domain}/${nonce}/${signature}`;
  }

  // ACTIONS
  public async enable(forceChainId?: string) {
    // TODO: use https://docs.metamask.io/guide/rpc-api.html#other-rpc-methods to switch active
    // chain according to currently active node, if one exists
    console.log('Attempting to enable Metamask');
    this._enabling = true;
    try {
      // default to ETH
      const chainId = forceChainId ?? this.getChainId();

      // ensure we're on the correct chain

      const Web3 = (await import('web3')).default;

      let ethereum = window.ethereum;

      if (window.ethereum.providers?.length) {
        window.ethereum.providers.forEach(async (p) => {
          if (p.isMetaMask) ethereum = p;
        });
      }

      this._web3 =
        process.env.ETH_RPC !== 'e2e-test'
          ? {
              givenProvider: ethereum,
            }
          : {
              givenProvider: window.ethereum,
              eth: {
                getAccounts: async () => {
                  return await this._web3.givenProvider.request({
                    method: 'eth_requestAccounts',
                  });
                },
              },
            };

      // TODO: does this come after?
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
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          const wsRpcUrl = new URL(app.chain.meta.node.url);
          const rpcUrl =
            app.chain.meta.node.altWalletUrl || `https://${wsRpcUrl.host}`;

          // TODO: we should cache this data!
          const chains = await $.getJSON('https://chainid.network/chains.json');
          const baseChain = chains.find((c) => c.chainId == chainId);
          const pubRpcUrl = baseChain.rpc.filter((r) => !/\${.*?}/.test(r));
          const url = rpcUrl.length > 0 ? pubRpcUrl[0] : rpcUrl;
          await this._web3.givenProvider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: baseChain.name,
                nativeCurrency: baseChain.nativeCurrency,
                rpcUrls: [url],
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
        throw new Error('Metamask fetched no accounts');
      }

      await this.initAccountsChanged();
      this._enabled = true;
      this._enabling = false;
    } catch (error) {
      let errorMsg = `Failed to enable Metamask: ${error.message}`;
      if (error.code === 4902) {
        errorMsg = `Failed to enable Metamask: Please add chain ID ${app.chain.meta.node.ethChainId}`;
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
    // TODO: chainChanged, disconnect events
  }

  public async switchNetwork(chainId?: string) {
    try {
      // Get current chain ID
      const communityChain = chainId ?? this.getChainId();
      const chainIdHex = parseInt(communityChain, 10).toString(16);
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainIdHex}` }],
        });
      } catch (error) {
        if (error.code === 4902) {
          const chains = await $.getJSON('https://chainid.network/chains.json');
          const baseChain = chains.find((c) => c.chainId == communityChain);
          // Check if the string contains '${' and '}'
          const rpcUrl = baseChain.rpc.filter((r) => !/\${.*?}/.test(r));
          const url =
            rpcUrl.length > 0 ? rpcUrl[0] : app.chain.meta.node.altWalletUrl;
          await this._web3.givenProvider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: baseChain.name,
                nativeCurrency: baseChain.nativeCurrency,
                rpcUrls: [url],
              },
            ],
          });
        }
      }
    } catch (error) {
      console.error('Error checking and switching chain:', error);
    }
  }

  // TODO: disconnect
}

export default MetamaskWebWalletController;
