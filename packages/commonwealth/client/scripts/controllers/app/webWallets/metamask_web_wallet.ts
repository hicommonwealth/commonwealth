import detectEthereumProvider from '@metamask/detect-provider';
import app from 'state';
import Web3 from 'web3';
import $ from 'jquery';
import { provider } from 'web3-core';
import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import { Account, IWebWallet, NodeInfo } from 'models';
import { setActiveAccount } from 'controllers/app/login';
import { constructTypedMessage } from 'adapters/chain/ethereum/keys';

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

  public async signMessage(message: string): Promise<string> {
    const signature = await this._web3.eth.sign(
      this._web3.utils.sha3(message),
      this.accounts[0]
    );
    return signature;
  }

  public async signLoginToken(message: string): Promise<string> {
    const msgParams = constructTypedMessage(
      this._node.ethChainId || 1,
      message
    );
    const signature = await this._web3.givenProvider.request({
      method: 'eth_signTypedData_v4',
      params: [this._accounts[0], JSON.stringify(msgParams)],
    });
    return signature;
  }

  public async validateWithAccount(account: Account): Promise<void> {
    // Sign with the method on eth_webwallet, because we don't have access to the private key
    const webWalletSignature = await this.signLoginToken(
      account.validationToken
    );
    return account.validate(webWalletSignature);
  }

  // ACTIONS
  public async enable(node?: NodeInfo) {
    // TODO: use https://docs.metamask.io/guide/rpc-api.html#other-rpc-methods to switch active
    // chain according to currently active node, if one exists
    this._enabling = true;
    this._node = node || app.chain?.meta.node || app.config.chains.getById(this.defaultNetwork).node;
    console.log('Attempting to enable Metamask');
    try {
      // default to ETH
      const chainId = this._node.ethChainId || 1;

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
    this._web3.givenProvider.on(
      'accountsChanged',
      this._accountsChangedFunc
    );
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
