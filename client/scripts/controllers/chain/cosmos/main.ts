import { CosmosToken } from 'adapters/chain/cosmos/types';
import { IChainAdapter, ChainBase, NodeInfo } from 'models';
import { IApp } from 'state';
import { CosmosAccount, CosmosAccounts } from './account';
import CosmosChain from './chain';

class Cosmos extends IChainAdapter<CosmosToken, CosmosAccount> {
  public chain: CosmosChain;
  public accounts: CosmosAccounts;
  public readonly base = ChainBase.CosmosSDK;

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.chain = new CosmosChain(this.app, 'cosmos');
    this.accounts = new CosmosAccounts(this.app);
  }

  public async initApi() {
    await this.chain.init(this.meta);
    await this.accounts.init(this.chain);
    await super.initApi();
  }

  public async initData() {
    await super.initData();
  }

  public async deinit(): Promise<void> {
    await super.deinit();
    await this.accounts.deinit();
    await this.chain.deinit();
    console.log('Cosmos stopped.');
  }
}

export default Cosmos;
