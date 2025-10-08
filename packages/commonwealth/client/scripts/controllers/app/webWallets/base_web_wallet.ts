import { createBaseAccountSDK } from '@base-org/account';
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

class BaseWebWalletController implements IWebWallet<string> {
  // GETTERS/SETTERS
  private _enabled: boolean;
  private _enabling = false;
  private _accounts: string[];
  private _provider: Web3BaseProvider | undefined;
  private _web3: Web3 | any;
  private _sdk: any;

  public readonly name = WalletId.Base;
  public readonly label = 'Base Wallet';
  public readonly defaultNetwork = ChainNetwork.Ethereum;
  public readonly chain = ChainBase.Ethereum;

  public get available() {
    // base wallet/account is always available as it's a web-based solution
    return true;
  }

  public get provider() {
    return this._provider!;
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
    return app.chain?.meta?.ChainNode?.eth_chain_id?.toString() || '1'; // use community chain or default to mainnet
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
    console.log('Attempting to enable Base wallet');
    this._enabling = true;
    try {
      // initialize base SDK
      this._sdk = createBaseAccountSDK({
        appName: 'Commonwealth',
        // TODO: fix this image
        appLogoUrl: `${window.location.origin}/assets/img/branding/common-logo.svg`,
      });

      const baseProvider = this._sdk.getProvider();

      const Web3 = (await import('web3')).default;
      this._web3 = {
        givenProvider: baseProvider,
      };

      this._accounts = (
        await this._web3.givenProvider.request({
          method: 'eth_requestAccounts',
        })
      ).map((addr: string) => {
        return Web3.utils.toChecksumAddress(addr);
      });

      this._provider = baseProvider;

      if (this._accounts.length === 0) {
        throw new Error('Base wallet fetched no accounts');
      }

      // force the correct chain
      const chainId = forceChainId ?? this.getChainId();
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
        // add chain to wallet if not added already
        if (switchError.code === 4902) {
          const wsRpcUrl = new URL(app.chain?.meta?.ChainNode?.url || '');
          const rpcUrl =
            app.chain?.meta?.ChainNode?.alt_wallet_url ||
            `https://${wsRpcUrl.host}`;

          // add requested chain to wallet
          await this._web3.givenProvider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: app.chain?.meta?.name || 'Custom Chain',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: [rpcUrl],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }

      await this.initAccountsChanged();
      this._enabled = true;
      this._enabling = false;
    } catch (error) {
      let errorMsg = `Failed to enable Base wallet: ${error.message}`;
      if (error.code === 4902) {
        errorMsg = `Failed to enable Base wallet: Please add chain ID ${
          app?.chain?.meta?.ChainNode?.eth_chain_id || 0
        }`;
      }
      console.error(errorMsg);
      this._enabling = false;
      throw new Error(errorMsg);
    }
  }

  public async initAccountsChanged() {
    // base SDK handles account changes internally
    // we only listen for account changes
    if (this._web3?.givenProvider?.on) {
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
  }

  public async switchNetwork(chainId?: string) {
    try {
      const communityChain = chainId ?? this.getChainId();
      const chainIdHex = getChainHex(parseInt(communityChain, 10));

      try {
        await this._web3.givenProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });
      } catch (error) {
        if (error.code === 4902) {
          const rpcUrl =
            app?.chain?.meta?.ChainNode?.alt_wallet_url ||
            app?.chain?.meta?.ChainNode?.url ||
            '';

          await this._web3.givenProvider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: app.chain?.meta?.name || 'Custom Chain',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: [rpcUrl],
              },
            ],
          });
        }
      }
    } catch (error) {
      console.error('Error checking and switching chain:', error);
    }
  }

  public async reset() {
    if (this._sdk) {
      try {
        await this._sdk.getProvider().request({ method: 'wallet_disconnect' });
      } catch (error) {
        console.error('Error disconnecting from Base wallet:', error);
      }
    }
    this._enabled = false;
    this._accounts = [];
    this._provider = undefined;
    this._web3 = null;
    this._sdk = null;
  }
}

export default BaseWebWalletController;
