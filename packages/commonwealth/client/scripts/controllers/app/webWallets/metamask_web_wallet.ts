import detectEthereumProvider from '@metamask/detect-provider';
declare let window: any;

import { constructTypedCanvasMessage } from 'adapters/chain/ethereum/keys';
import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import { setActiveAccount } from 'controllers/app/login';
import $ from 'jquery';
import type { Account, BlockInfo, IWebWallet, NodeInfo } from 'models';
import type { CanvasData } from 'shared/adapters/shared';
import app from 'state';
import Web3 from 'web3';
import type { provider } from 'web3-core';
import { hexToNumber } from 'web3-utils';

class MetamaskWebWalletController implements IWebWallet<string> {
  // GETTERS/SETTERS
  private _enabled: boolean;
  private _enabling = false;
  private _accounts: string[];
  private _node: NodeInfo;
  private _provider: provider;
  private _web3: Web3;

  public readonly name = WalletId.Metamask;
  public readonly label = 'Metamask';
  public readonly defaultNetwork = ChainNetwork.Ethereum;
  public readonly chain = ChainBase.Ethereum;

  public get available() {
    return !!(window as any).ethereum;
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

  public get node() {
    return this._node;
  }

  public getChainId() {
    // We need app.chain? because the app might not be on a page with a chain (e.g homepage),
    // and node? because the chain might not have a node provided
    return app.chain?.meta.node?.ethChainId || 1;
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
    canvasMessage: CanvasData
  ): Promise<string> {
    const typedCanvasMessage = await constructTypedCanvasMessage(canvasMessage);
    const signature = await this._web3.givenProvider.request({
      method: 'eth_signTypedData_v4',
      params: [account.address, JSON.stringify(typedCanvasMessage)],
    });
    return signature;
  }

  // ACTIONS
  public async enable(node?: NodeInfo) {
    // TODO: use https://docs.metamask.io/guide/rpc-api.html#other-rpc-methods to switch active
    // chain according to currently active node, if one exists
    this._enabling = true;
    this._node =
      node ||
      app.chain?.meta.node ||
      app.config.chains.getById(this.defaultNetwork).node;
    console.log('Attempting to enable Metamask');
    try {
      // default to ETH
      const chainId = await this.getChainId();

      // ensure we're on the correct chain
      this._provider = await detectEthereumProvider({ mustBeMetaMask: true });
      this._web3 = new Web3(this._provider);
      // TODO: does this come after?
      await this._web3.givenProvider.request({
        method: 'eth_requestAccounts',
      });
      const chainIdHex = `0x${chainId.toString(16)}`;
      try {
        await this._web3.givenProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          const wsRpcUrl = new URL(this._node.url);
          const rpcUrl = this._node.altWalletUrl || `https://${wsRpcUrl.host}`;

          // TODO: we should cache this data!
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
      this._accounts = await this._web3.eth.getAccounts();
      if (this._accounts.length === 0) {
        throw new Error('Metamask fetched no accounts');
      }

      await this.initAccountsChanged();
      this._enabled = true;
      this._enabling = false;
    } catch (error) {
      let errorMsg = `Failed to enable Metamask: ${error.message}`;
      if (error.code === 4902) {
        errorMsg = `Failed to enable Metamask: Please add chain ID ${this._node.ethChainId}`;
      }
      console.error(errorMsg);
      this._enabling = false;
      throw new Error(errorMsg);
    }
  }

  private _accountsChangedFunc = async (accounts: string[]) => {
    const updatedAddress = app.user.activeAccounts.find(
      (addr) => addr.address === accounts[0]
    );
    if (!updatedAddress) return;
    await setActiveAccount(updatedAddress);
  };

  public async initAccountsChanged() {
    this._web3.givenProvider.on('accountsChanged', this._accountsChangedFunc);
    // TODO: chainChanged, disconnect events
  }

  public async reset() {
    console.log('Attempting to reset Metamask');
    this._web3.givenProvider.removeListener(
      'accountsChanged',
      this._accountsChangedFunc
    );
    this._enabled = false;
  }
}

export default MetamaskWebWalletController;
