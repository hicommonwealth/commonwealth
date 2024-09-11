import axios from 'axios';

declare let window: any;

import type Web3 from 'web3';
import type BlockInfo from '../../../models/BlockInfo';
import type IWebWallet from '../../../models/IWebWallet';

import { hexToNumber } from 'web3-utils';

import { SIWESigner } from '@canvas-js/chain-ethereum';
import { ChainBase, ChainNetwork, WalletId } from '@hicommonwealth/shared';
import { setActiveAccount } from 'controllers/app/login';
import app from 'state';
import { fetchCachedConfiguration } from 'state/api/configuration';
import { userStore } from 'state/ui/user';
import { Web3BaseProvider } from 'web3';

class MetamaskWebWalletController implements IWebWallet<string> {
  // GETTERS/SETTERS
  private _enabled: boolean;
  private _enabling = false;
  private _accounts: string[];
  private _provider: Web3BaseProvider;
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
    return (app.chain?.meta?.ChainNode?.eth_chain_id || 0)?.toString() || '1';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getRecentBlock(chainIdentifier: string): Promise<BlockInfo> {
    const block = await this._web3.givenProvider.request({
      method: 'eth_getBlockByNumber',
      params: ['latest', false],
    });

    return {
      number: Number(hexToNumber(block.number)),
      hash: block.hash,
      timestamp: Number(hexToNumber(block.timestamp)),
    };
  }

  public getSessionSigner() {
    return new SIWESigner({
      signer: {
        signMessage: (message) =>
          this._web3.givenProvider.request({
            method: 'personal_sign',
            params: [this.accounts[0], message],
          }),
        getAddress: () => this.accounts[0],
      },
      chainId: parseInt(this.getChainId()),
    });
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
        const config = fetchCachedConfiguration();

        if (config?.evmTestEnv !== 'test') {
          await this._web3.givenProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainIdHex }],
          });
        }
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          const wsRpcUrl = app.chain?.meta?.ChainNode?.url ?? '';
          const rpcUrl =
            (app.chain?.meta?.ChainNode?.alt_wallet_url ?? wsRpcUrl)
              ? new URL(wsRpcUrl).host
              : '';

          // TODO: we should cache this data!
          const chains = await axios.get('https://chainid.network/chains.json');
          const baseChain = chains.data.find((c) => c.chainId == chainId);
          const pubRpcUrl = baseChain.rpc.filter((r) => !/\${.*?}/.test(r));
          // remove duplicate https b/c chain list has a bug in their sepolia endpoint
          const url =
            pubRpcUrl.length > 0
              ? pubRpcUrl[0].replace(/(https:\/\/)+/, 'https://')
              : rpcUrl;
          if (url === '') {
            throw new Error('Could not find rpc for new network');
          }
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
        errorMsg = `Failed to enable Metamask: Please add chain ID ${app?.chain?.meta?.ChainNode?.eth_chain_id || 0}`;
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
        const updatedAddress = userStore
          .getState()
          .accounts.find((addr) => addr.address === accounts[0]);
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
      const chainIdHex = `0x${parseInt(communityChain, 10).toString(16)}`;
      try {
        await this._web3.givenProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });
      } catch (error) {
        if (error.code === 4902) {
          const chains = await axios.get('https://chainid.network/chains.json');
          const baseChain = chains.data.find(
            (c) => c.chainId == communityChain,
          );
          // Check if the string contains '${' and '}'
          const rpcUrl = baseChain.rpc.filter((r) => !/\${.*?}/.test(r));
          const url =
            rpcUrl.length > 0
              ? rpcUrl[0].replace(/(https:\/\/)+/, 'https://')
              : app?.chain?.meta?.ChainNode?.alt_wallet_url || '';
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
