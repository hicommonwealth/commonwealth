import axios from 'axios';

declare let window: any;

import type Web3 from 'web3';
import type BlockInfo from '../../../models/BlockInfo';
import type IWebWallet from '../../../models/IWebWallet';

import { SIWESigner } from '@canvas-js/chain-ethereum';
import { getChainHex } from '@hicommonwealth/evm-protocols';
import { ChainBase, ChainNetwork, WalletId } from '@hicommonwealth/shared';
import { setActiveAccount } from 'controllers/app/login';
import app from 'state';
import { fetchCachedPublicEnvVar } from 'state/api/configuration';
import { userStore } from 'state/ui/user';
import { Web3BaseProvider } from 'web3';
import { hexToNumber } from 'web3-utils';

class CoinbaseWebWalletController implements IWebWallet<string> {
  // GETTERS/SETTERS
  private _enabled: boolean;
  private _enabling = false;
  private _accounts: string[];
  private _provider: Web3BaseProvider;
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
    return app.chain?.meta?.ChainNode?.eth_chain_id?.toString() || '1';
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
            params: [message, this.accounts[0]],
          }),
        getAddress: () => this.accounts[0],
      },
      chainId: parseInt(this.getChainId()),
    });
  }

  // ACTIONS
  public async enable(forceChainId?: string) {
    console.log('Attempting to enable Coinbase');
    this._enabling = true;
    try {
      // default to ETH
      const chainId = forceChainId ?? this.getChainId();

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
      const chainIdHex = getChainHex(parseInt(chainId, 10));
      try {
        const config = fetchCachedPublicEnvVar();

        if (config?.TEST_EVM_ETH_RPC !== 'test') {
          await this._web3.givenProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainIdHex }],
          });
        }
      } catch (switchError) {
        // This error code indicates that the chain has not been added to coinbase.
        if (switchError.code === 4902) {
          const wsRpcUrl = new URL(app.chain?.meta?.ChainNode?.url || '');
          const rpcUrl =
            app.chain?.meta?.ChainNode?.alt_wallet_url ||
            `https://${wsRpcUrl.host}`;

          const chains = await axios.get('https://chainid.network/chains.json');
          const baseChain = chains.data.find((c) => c.chainId === chainId);
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
        errorMsg = `Failed to enable coinbase: Please add chain ID ${app?.chain?.meta?.ChainNode?.eth_chain_id || 0}`;
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
  }

  public async switchNetwork(chainId?: string) {
    try {
      // Get current chain ID
      const communityChain = chainId ?? this.getChainId();
      const chainIdHex = getChainHex(parseInt(communityChain, 10));
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainIdHex}` }],
        });
      } catch (error) {
        if (error.code === 4902) {
          const chains = await axios.get('https://chainid.network/chains.json');
          const baseChain = chains.data.find(
            (c) => c.chainId === communityChain,
          );
          // Check if the string contains '${' and '}'
          const rpcUrl = baseChain.rpc.filter((r) => !/\${.*?}/.test(r));
          const url =
            rpcUrl.length > 0
              ? rpcUrl[0]
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
}

export default CoinbaseWebWalletController;
