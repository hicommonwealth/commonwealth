import { ChainBase, ChainNetwork, WalletId } from '@hicommonwealth/shared';
import { setActiveAccount } from 'controllers/app/login';
import app from 'state';
import type Web3 from 'web3';

import { SIWESigner } from '@canvas-js/chain-ethereum';
import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { fetchCachedNodes } from 'client/scripts/state/api/nodes';
import { getCommunityByIdQuery } from 'state/api/communities/getCommuityById';
import { userStore } from 'state/ui/user';
import { hexToNumber } from 'web3-utils';
import { z } from 'zod';
import BlockInfo from '../../../models/BlockInfo';
import IWebWallet from '../../../models/IWebWallet';

class WalletConnectWebWalletController implements IWebWallet<string> {
  private _enabled: boolean;
  private _enabling = false;
  private _accounts: string[];
  private _chainInfo: z.infer<typeof ExtendedCommunity>;
  private _provider;
  private _web3: Web3;

  public readonly name = WalletId.WalletConnect;
  public readonly label = 'WalletConnect';
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
    return this._chainInfo?.ChainNode?.eth_chain_id?.toString() || '1';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getRecentBlock(chainIdentifier: string): Promise<BlockInfo> {
    const block = await this._provider.request({
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
        getAddress: () => this._accounts[0],
        signMessage: (message) =>
          this._provider.request({
            method: 'personal_sign',
            params: [message, this._accounts[0]],
          }),
      },
      chainId: parseInt(this.getChainId()),
    });
  }

  public async reset() {
    console.log('Attempting to reset WalletConnect');
    if (!this._provider) {
      // Remove the object that stores the session (needed when refreshed page since initial connection established)
      localStorage.removeItem('walletconnect');
      return;
    }
    try {
      await this._provider.wc.killSession();
    } catch (err) {
      // api may not be available
    }
    this._provider.disconnect();
    this._enabled = false;
  }

  public async enable(forceChainId?: string) {
    console.log('Attempting to enable WalletConnect');
    this._enabling = true;
    this._chainInfo = app?.chain?.meta;

    if (!this._chainInfo && app.activeChainId()) {
      const communityInfo = await getCommunityByIdQuery(
        app.activeChainId() || '',
        true,
      );

      this._chainInfo = communityInfo as unknown as z.infer<
        typeof ExtendedCommunity
      >;
    }

    const MAINNET_ID = 1;
    const BASE_ID = 8453;
    const optionalChains = [MAINNET_ID, BASE_ID];
    const chainId =
      forceChainId || this._chainInfo?.ChainNode?.eth_chain_id || MAINNET_ID;
    const chainIdNumber = parseInt(`${chainId}`, 10);
    if (!optionalChains.includes(chainIdNumber))
      optionalChains.push(chainIdNumber);

    const EthereumProvider = (await import('@walletconnect/ethereum-provider'))
      .default;
    this._provider = await EthereumProvider.init({
      projectId: '927f4643b1e10ad3dbdbdbdaf9c5fbbe',
      chains: [chainIdNumber],
      optionalMethods: ['eth_getBlockByNumber', 'eth_sendTransaction'],
      showQrModal: true,
    });

    await this._provider.connect({
      chains: [chainIdNumber],
    });
    // destroy pre-existing session if exists
    if (this._provider.wc?.connected) {
      await this._provider.wc.killSession();
    }

    const Web3 = (await import('web3')).default;
    this._web3 = new Web3(this._provider as any);
    this._accounts = await this._web3.eth.getAccounts();
    if (this._accounts.length === 0) {
      throw new Error('WalletConnect fetched no accounts.');
    }

    await this.initAccountsChanged();
    this._enabled = true;
    this._enabling = false;
    console.log('WalletConnect enabled');
    // } catch (error) {
    //   this._enabling = false;
    //   throw new Error(`Failed to enable WalletConnect: ${error.message}`);
    // }
  }

  public async initAccountsChanged() {
    await this._provider.on('accountsChanged', async (accounts: string[]) => {
      const updatedAddress = userStore
        .getState()
        .accounts.find((addr) => addr.address === accounts[0]);
      if (!updatedAddress) return;
      await setActiveAccount(updatedAddress);
    });
    // TODO: chainChanged, disconnect events
  }

  public async switchNetwork(chainId?: string) {
    if (!this._provider) {
      throw new Error('WalletConnect provider not initialized');
    }

    const communityChain = chainId ?? this.getChainId();
    const chainIdHex = `0x${parseInt(communityChain, 10).toString(16)}`;

    try {
      await this._provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (switchError: any) {
      // add chain/network to wallet if not added yet
      if (switchError.code === 4902) {
        const nodes = await fetchCachedNodes();
        const chainInfo = nodes?.find(
          (n) => n.ethChainId === parseInt(communityChain, 10),
        );
        if (!chainInfo) {
          throw new Error('Missing chain info to add network');
        }

        await this._provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: chainIdHex,
              chainName: chainInfo.name || `Chain ${chainId}`,
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: [chainInfo.url],
              blockExplorerUrls:
                chainInfo.block_explorer || ''
                  ? [chainInfo.block_explorer || '']
                  : [],
            },
          ],
        });
      } else {
        const nodes = await fetchCachedNodes();
        const chainInfo = nodes?.find(
          (n) => n.ethChainId === parseInt(communityChain, 10),
        );
        throw new Error(
          // eslint-disable-next-line max-len
          `Failed to switch network to ${chainInfo?.name} (${chainId}), please ensure the network is enabled in your wallet.`,
        );
      }
    }

    const Web3 = (await import('web3')).default;
    this._web3 = new Web3(this._provider as any);
    this._accounts = await this._web3.eth.getAccounts();
  }
}

export default WalletConnectWebWalletController;
