import EthereumChain from 'controllers/chain/ethereum/chain';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import EthereumAccount from 'controllers/chain/ethereum/account';
import { EthereumCoin } from 'adapters/chain/ethereum/types';
import { ChainBase } from 'common-common/src/types';
import { ChainInfo, IChainAdapter, NodeInfo } from 'models';
import { IApp } from 'state';

// TODO: hook up underlyung functionality of this boilerplate
//       (e.g., EthereumChain and EthereumAccount methods, etc.)
class Ethereum extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  public chain: EthereumChain;
  public accounts: EthereumAccounts;

  constructor(meta: ChainInfo, app: IApp) {
    super(meta, app);
    this.chain = new EthereumChain(this.app);
    this.accounts = new EthereumAccounts(this.app);
  }

  public async initApi() {
    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();
    await this.accounts.init(this.chain);
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
}

export default Ethereum;
