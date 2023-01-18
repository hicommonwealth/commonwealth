import WalletConnectProvider from '@walletconnect/web3-provider';
import { constructTypedCanvasMessage } from 'adapters/chain/ethereum/keys';
import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import { setActiveAccount } from 'controllers/app/login';
import type { Account, BlockInfo, ChainInfo, IWebWallet } from 'models';
import type { CanvasData } from 'shared/adapters/shared';
import app from 'state';
import Web3 from 'web3';
import { hexToNumber } from 'web3-utils';

class WalletConnectWebWalletController implements IWebWallet<string> {
  private _enabled: boolean;
  private _enabling = false;
  private _accounts: string[];
  private _chainInfo: ChainInfo;
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

  public get api(): any {
    return this._web3;
  }

  public getChainId() {
    // We need app.chain? because the app might not be on a page with a chain (e.g homepage),
    // and node? because the chain might not have a node provided
    return this._chainInfo.node?.ethChainId || 1;
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
    const typedCanvasMessage = constructTypedCanvasMessage(canvasMessage);
    const signature = await this._provider.wc.signTypedData([
      account.address,
      JSON.stringify(typedCanvasMessage),
    ]);
    return signature;
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

  public async enable() {
    console.log('Attempting to enable WalletConnect');
    this._enabling = true;
    // try {
    // Create WalletConnect Provider
    this._chainInfo =
      app.chain?.meta || app.config.chains.getById(this.defaultNetwork);
    const chainId = this._chainInfo.node?.ethChainId || 1;

    // use alt wallet url if available
    const chainUrl =
      this._chainInfo.node?.altWalletUrl || this._chainInfo.node?.url;
    const rpc = chainUrl ? { [chainId]: chainUrl } : {};

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
