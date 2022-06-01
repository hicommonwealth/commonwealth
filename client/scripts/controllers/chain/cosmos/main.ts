import { ChainBase } from 'types';
import { ChainInfo, IChainAdapter } from 'models';
import { IApp } from 'state';
import { CosmosToken } from './types';
import CosmosAccount from './account';
import CosmosAccounts from './accounts';
import CosmosChain from './chain';
import CosmosGovernance from './governance';

class Cosmos extends IChainAdapter<CosmosToken, CosmosAccount> {
  public chain: CosmosChain;
  public accounts: CosmosAccounts;
  public governance: CosmosGovernance;
  public readonly base = ChainBase.CosmosSDK;

  constructor(
    meta: ChainInfo,
    app: IApp,
  ) {
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
