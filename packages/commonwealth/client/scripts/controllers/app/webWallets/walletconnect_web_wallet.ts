import app from 'state';
import Web3 from 'web3';
import { hexToNumber } from 'web3-utils';
import WalletConnectProvider from '@walletconnect/web3-provider';

import { Account, ChainInfo, IWebWallet, NodeInfo, BlockInfo } from 'models';
import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import { setActiveAccount } from 'controllers/app/login';
import { constructTypedMessage } from 'adapters/chain/ethereum/keys';

class WalletConnectWebWalletController implements IWebWallet<string> {
  private _enabled: boolean;
  private _enabling = false;
  private _accounts: string[];
  private _node: NodeInfo;
  private _provider: WalletConnectProvider;
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

  public get node() {
    return this._node;
  }

  public async getRecentBlock(): Promise<BlockInfo> {
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

  public async signMessage(message: string): Promise<string> {
    const signature = await this._web3.eth.sign(message, this.accounts[0]);
    return signature;
  }

  public async signLoginToken(validationBlockInfo: string): Promise<string> {
    const sessionPublicAddress = app.sessions.getOrCreateAddress(
      this.node.ethChainId
    );
    const msgParams = await constructTypedMessage(
      this.accounts[0],
      app.chain?.meta.node.ethChainId || 1,
      sessionPublicAddress,
      validationBlockInfo
    );
    const signature = await this._provider.wc.signTypedData([
      this.accounts[0],
      JSON.stringify(msgParams),
    ]);
    return signature;
  }

  public async signWithAccount(account: Account): Promise<string> {
    const webWalletSignature = await this.signLoginToken(
      account.validationBlockInfo
    );
    return webWalletSignature;
  }

  public async validateWithAccount(
    account: Account,
    walletSignature: string
  ): Promise<void> {
    return account.validate(walletSignature);
  }

  public async reset() {
    console.log('Attempting to reset WalletConnect');
    if (!this._provider) {
      return;
    }
    await this._provider.wc.killSession();
    this._provider.disconnect();
    this._enabled = false;
  }

  public async enable(node?: NodeInfo) {
    console.log('Attempting to enable WalletConnect');
    this._enabling = true;
    // try {
    // Create WalletConnect Provider
    this._node =
      node ||
      app.chain?.meta.node ||
      app.config.chains.getById(this.defaultNetwork).node;
    const chainId = this._node.ethChainId;

    // use alt wallet url if available
    const rpc = { [chainId]: this._node.altWalletUrl || this._node.url };
    this._provider = new WalletConnectProvider({ rpc, chainId });

    // destroy pre-existing session if exists
    if (this._provider.wc?.connected) {
      await this._provider.wc.killSession();
    }

    //  Enable session (triggers QR Code modal)
    await this._provider.enable();
    this._web3 = new Web3(this._provider as any);
    this._accounts = await this._web3.eth.getAccounts();
    if (this._accounts.length === 0) {
      throw new Error('WalletConnect fetched no accounts.');
    }

    await this.initAccountsChanged();
    this._enabled = true;
    this._enabling = false;
    // } catch (error) {
    //   this._enabling = false;
    //   throw new Error(`Failed to enable WalletConnect: ${error.message}`);
    // }
  }

  public async initAccountsChanged() {
    await this._provider.on('accountsChanged', async (accounts: string[]) => {
      const updatedAddress = app.user.activeAccounts.find(
        (addr) => addr.address === accounts[0]
      );
      if (!updatedAddress) return;
      await setActiveAccount(updatedAddress);
    });
    // TODO: chainChanged, disconnect events
  }
}

export default WalletConnectWebWalletController;
