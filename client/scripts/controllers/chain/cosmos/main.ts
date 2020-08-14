import { CosmosToken } from 'adapters/chain/cosmos/types';
import { IChainAdapter, ChainBase, ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import { CosmosAccount, CosmosAccounts } from './account';
import CosmosChain from './chain';
import CosmosGovernance from './governance';

class Cosmos extends IChainAdapter<CosmosToken, CosmosAccount> {
  public chain: CosmosChain;
  public accounts: CosmosAccounts;
  public governance: CosmosGovernance;
  public readonly base = ChainBase.CosmosSDK;
  public readonly class = ChainClass.CosmosHub;

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.chain = new CosmosChain(this.app);
    this.accounts = new CosmosAccounts(this.app);
    this.governance = new CosmosGovernance(this.app);
  }

  public async initApi() {
    await this.chain.init(this.meta);
    await this.accounts.init(this.chain);
    await super.initApi();
  }

  public async initData() {
    await this.governance.init(this.chain, this.accounts);
    await super.initData();
  }

  public async deinit(): Promise<void> {
    await super.deinit();
    await this.governance.deinit();
    await this.accounts.deinit();
    await this.chain.deinit();
    console.log('Cosmos stopped.');
  }
}

export default Cosmos;
