import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import { Account, ChainInfo, IWebWallet } from 'models';
import app from 'state';
import Web3 from 'web3';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { setActiveAccount } from 'controllers/app/login';
import { constructTypedMessage } from 'adapters/chain/ethereum/keys';

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

  public async signMessage(message: string): Promise<string> {
    const signature = await this._web3.eth.sign(message, this.accounts[0]);
    return signature;
  }

  public async signLoginToken(message: string): Promise<string> {
    const msgParams = constructTypedMessage(this._chainInfo.node.ethChainId, message);
    const signature = await this._provider.wc.signTypedData([
      this.accounts[0],
      JSON.stringify(msgParams),
    ]);
    return signature;
  }

  public async validateWithAccount(account: Account): Promise<void> {
    // TODO: test whether signTypedData works on WC
    const webWalletSignature = await this.signLoginToken(account.validationToken);
    return account.validate(webWalletSignature);
  }

    public async reset() {
    console.log('Attempting to reset WalletConnect');
    const ks = await this._provider.wc.killSession();
    this._provider.disconnect();
    this._enabled = false;
  }

  public async enable() {
    console.log('Attempting to enable WalletConnect');
    this._enabling = true;
    try {
      // Create WalletConnect Provider
      this._chainInfo = app.chain?.meta || app.config.chains.getById(this.defaultNetwork);
      const chainId = this._chainInfo.node.ethChainId;

      // use alt wallet url if available
      const rpc = { [chainId]: this._chainInfo.node.altWalletUrl || this._chainInfo.node.url }
      this._provider = new WalletConnectProvider({ rpc, chainId });

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
    } catch (error) {
      this._enabling = false;
      throw new Error(`Failed to enable WalletConnect: ${error.message}`);
    }
  }

  public async initAccountsChanged() {
    await this._provider.on('accountsChanged', async (accounts: string[]) => {
      const updatedAddress = app.user.activeAccounts.find((addr) => addr.address === accounts[0]);
      if (!updatedAddress) return;
      await setActiveAccount(updatedAddress);
    });
    // TODO: chainChanged, disconnect events
  }
}

export default WalletConnectWebWalletController;
