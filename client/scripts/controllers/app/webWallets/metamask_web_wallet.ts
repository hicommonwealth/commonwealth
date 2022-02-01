declare let window: any;

import app from 'state';
import Web3 from 'web3';
import $ from 'jquery';
import { provider } from 'web3-core';
import { ChainBase } from 'types';
import { Account, IWebWallet } from 'models';
import { setActiveAccount } from 'controllers/app/login';
import { constructTypedMessage } from 'adapters/chain/ethereum/keys';

class MetamaskWebWalletController implements IWebWallet<string> {
  // GETTERS/SETTERS
  private _enabled: boolean;
  private _enabling = false;
  private _accounts: string[];
  private _provider: provider;
  private _web3: Web3;

  public readonly name = 'metamask';
  public readonly label = 'Metamask';
  public readonly chain = ChainBase.Ethereum;

  public get available() {
    return !!(window.ethereum);
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

  public async signMessage(message: string): Promise<string> {
    const signature = await this._web3.eth.sign(message, this.accounts[0]);
    return signature;
  }

  public async signLoginToken(message: string): Promise<string> {
    const msgParams = constructTypedMessage(app.chain.meta.ethChainId || 1, message);
    const signature = await this._web3.givenProvider.request({
      method: 'eth_signTypedData_v4',
      params: [this._accounts[0], JSON.stringify(msgParams)],
    })
    return signature;
  }

  public async validateWithAccount(account: Account<any>): Promise<void> {
    // Sign with the method on eth_webwallet, because we don't have access to the private key
    const webWalletSignature = await this.signLoginToken(account.validationToken);
    return account.validate(webWalletSignature);
  }

  // ACTIONS
  public async enable() {
    // TODO: use https://docs.metamask.io/guide/rpc-api.html#other-rpc-methods to switch active
    // chain according to currently active node, if one exists
    console.log('Attempting to enable Metamask');
    this._enabling = true;
    try {
      // default to ETH
      const chainId = app.chain?.meta.ethChainId || 1;

      // ensure we're on the correct chain
      this._web3 = new Web3((window as any).ethereum);
      // TODO: does this come after?
      await this._web3.givenProvider.request({
        method: 'eth_requestAccounts'
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
          const wsRpcUrl = new URL(app.chain.meta.url);
          const rpcUrl = app.chain.meta.altWalletUrl || `https://${wsRpcUrl.host}`;

          // TODO: we should cache this data!
          const chains = await $.getJSON('https://chainid.network/chains.json');
          const baseChain = chains.find((c) => c.chainId === chainId);
          await this._web3.givenProvider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainIdHex,
              chainName: baseChain.name,
              nativeCurrency: baseChain.nativeCurrency,
              rpcUrls: [rpcUrl]
            }]
          });
        } else {
          throw switchError;
        }
      }

      // fetch active accounts
      this._accounts = await this._web3.eth.getAccounts();
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
        errorMsg = `Failed to enable Metamask: Please add chain ID ${app.chain.meta.ethChainId}`;
      }
      console.error(errorMsg);
      this._enabling = false;
      throw new Error(errorMsg);
    }
  }

  public async initAccountsChanged() {
    await this._web3.givenProvider.on('accountsChanged', async (accounts: string[]) => {
      const updatedAddress = app.user.activeAccounts.find((addr) => addr.address === accounts[0]);
      if (!updatedAddress) return;
      await setActiveAccount(updatedAddress);
    });
    // TODO: chainChanged, disconnect events
  }

  // TODO: disconnect
}

export default MetamaskWebWalletController;
