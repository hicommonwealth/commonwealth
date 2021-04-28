import ethers from 'ethers';

import MetamaskWebWalletController from 'controllers/app/metamask_web_wallet';
import { setActiveAccount } from 'controllers/app/login';
import EthereumChain from 'controllers/chain/ethereum/chain';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import EthereumAccount from 'controllers/chain/ethereum/account';
import { EthereumCoin } from 'adapters/chain/ethereum/types';
import { IChainAdapter, ChainBase, ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';

// TODO: hook up underlyung functionality of this boilerplate
//       (e.g., EthereumChain and EthereumAccount methods, etc.)
class Ethereum extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  public readonly class = ChainClass.Ethereum;
  public chain: EthereumChain;
  public accounts: EthereumAccounts;
  public readonly webWallet: MetamaskWebWalletController;

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.webWallet = app.wallets.defaultWallet(this.base) as MetamaskWebWalletController;
    this.chain = new EthereumChain(this.app);
    this.accounts = new EthereumAccounts(this.app);
  }

  public async initApi() {
    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();
    await this.accounts.init(this.chain);

    if (this.webWallet) {
      await this.webWallet.enable();
    }
    await this.chain.initEventLoop();
    await super.initApi();
  }

  public async deinit() {
    await super.deinit();
    this.accounts.deinit();
    this.chain.deinitMetadata();
    this.chain.deinitEventLoop();
    await this.chain.deinitApi();
  }

  public async getEthersProvider() {
    const provider = new ethers.providers.Web3Provider(this.chain.api.currentProvider as any);
    return provider;
  }
}

export default Ethereum;
