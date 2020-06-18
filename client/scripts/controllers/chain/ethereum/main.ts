import EthereumChain from 'controllers/chain/ethereum/chain';
import { default as EthereumAccounts, EthereumAccount } from 'controllers/chain/ethereum/account';
import { EthereumCoin } from 'adapters/chain/ethereum/types';
import { IChainAdapter, ChainBase, ChainClass } from 'models';

import EthWebWalletController from 'controllers/app/eth_web_wallet';
import { setActiveAccount } from 'controllers/app/login';

// TODO: hook up underlyung functionality of this boilerplate
//       (e.g., EthereumChain and EthereumAccount methods, etc.)
class Ethereum extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  public readonly class = ChainClass.Ethereum;
  public chain: EthereumChain;
  public accounts: EthereumAccounts;
  public readonly webWallet: EthWebWalletController = new EthWebWalletController();

  private _loaded: boolean = false;
  get loaded() { return this._loaded; }

  public handleEntityUpdate(e): void {
    throw new Error('not implemented');
  }

  public async init(onServerLoaded?) {
    console.log(`Starting ${this.meta.chain.id} on node: ${this.meta.url}`);
    this.chain = new EthereumChain(this.app);
    this.accounts = new EthereumAccounts(this.app);

    await super.init(async () => {
      await this.chain.resetApi(this.meta);
      await this.chain.initMetadata();
    }, onServerLoaded);
    await this.accounts.init(this.chain);
    await this._postModuleLoad();
    await this.chain.initEventLoop();

    if (this.webWallet) {
      await this.webWallet.enable();
      await this.webWallet.web3.givenProvider.on('accountsChanged', (accounts) => {
        const updatedAddress = this.app.user.activeAccounts.find((addr) => addr.address === accounts[0]);
        setActiveAccount(updatedAddress);
      });
    }

    this._loaded = true;
  }

  public async deinit() {
    this._loaded = false;
    super.deinit();
    this.accounts.deinit();
    this.chain.deinitMetadata();
    this.chain.deinitEventLoop();
    this.chain.deinitApi();

    console.log('Ethereum stopped.');

    return Promise.resolve();
  }

  public async getEthersProvider() {
    const provider = new (await import('ethers')).providers.Web3Provider(this.chain.api.currentProvider);
    return provider;
  }
}

export default Ethereum;
