import app from 'state';

import { default as EthereumChain } from 'controllers/chain/ethereum/chain';
import { default as EthereumAccounts, EthereumAccount } from 'controllers/chain/ethereum/account';
import { EthereumCoin } from 'shared/adapters/chain/ethereum/types';
import { IChainAdapter, ChainBase, ChainClass } from 'models/models';

import EthWebWalletController from '../../app/eth_web_wallet';
import { selectLogin } from '../../app/login';

// TODO: hook up underlyung functionality of this boilerplate
//       (e.g., EthereumChain and EthereumAccount methods, etc.)
class Ethereum extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  public readonly class = ChainClass.Ethereum;
  public chain: EthereumChain;
  public accounts: EthereumAccounts;
  public readonly server = {};
  public readonly webWallet: EthWebWalletController = new EthWebWalletController();

  private _loaded: boolean = false;
  get loaded() { return this._loaded; }

  private _serverLoaded: boolean = false;
  get serverLoaded() { return this._serverLoaded; }

  public init = async (onServerLoaded?) => {
    console.log(`Starting ${this.meta.chain.id} on node: ${this.meta.url}`);
    this.chain = new EthereumChain(this.app);
    this.accounts = new EthereumAccounts(this.app);
    await app.threads.refreshAll(this.id, null, true);
    await app.comments.refreshAll(this.id, null, true);
    await app.reactions.refreshAll(this.id, null, true);

    this._serverLoaded = true;
    if (onServerLoaded) await onServerLoaded();

    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();
    await this.accounts.init(this.chain);
    await this.chain.initEventLoop();

    await this.webWallet.web3.givenProvider.on('accountsChanged', function (accounts) {
      const updatedAddress = app.login.activeAddresses.find((addr) => addr.address === accounts[0])
      selectLogin(updatedAddress);
    });

    this._loaded = true;
  }

  public deinit = async () => {
    this._loaded = false;
    this._serverLoaded = false;
    app.threads.deinit();
    app.comments.deinit();
    app.reactions.deinit();
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
