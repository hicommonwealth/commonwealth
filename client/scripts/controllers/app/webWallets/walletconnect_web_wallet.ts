import { Account, ChainBase, IWebWallet } from 'models';
import app from 'state';
import Web3 from 'web3';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { setActiveAccount } from 'controllers/app/login';

class WalletConnectWebWalletController implements IWebWallet<string> {
  private _enabled: boolean;
  private _enabling: boolean = false;
  private _accounts: string[];
  private _provider: WalletConnectProvider;
  private _web3: Web3;

  public readonly label = 'Ethereum Wallet (WalletConnect)';
  public readonly chain = ChainBase.Ethereum;
  public readonly available = true;

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
    const signature = await this._web3.eth.personal.sign(message, this.accounts[0], '');
    return signature;
  }

  public async validateWithAccount(account: Account<any>): Promise<void> {
    // Sign with the method on eth_webwallet, because we don't have access to the private key
    const webWalletSignature = await this.signMessage(account.validationToken);
    return account.validate(webWalletSignature);
  }

  public async enable() {
    console.log('Attempting to enable WalletConnect');
    this._enabling = true;
    try {
      //  Create WalletConnect Provider
      this._provider = new WalletConnectProvider({
        infuraId: 'b19b8175e688448ead43a0ab5f03438a'
      });

      //  Enable session (triggers QR Code modal)
      await this._provider.enable();
      this._web3 = new Web3(this._provider as any);
      this._accounts = await this._web3.eth.getAccounts();
      const balance = await this._web3.eth.getBalance(this._accounts[0]);
      console.log(balance);

      await this.initAccountsChanged();
      this._enabled = true;
      this._enabling = false;
    } catch (error) {
      console.error(`Failed to enable WalletConnect: ${error.message}`);
      this._enabling = false;
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

  // TODO: disconnect
}

export default WalletConnectWebWalletController;
