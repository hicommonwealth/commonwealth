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

  public handleEntityUpdate(e): void {
    throw new Error('not implemented');
  }

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.chain = new CosmosChain(this.app);
    this.accounts = new CosmosAccounts(this.app);
    this.governance = new CosmosGovernance(this.app);
  }

  public async init() {
    console.log(`Starting ${this.meta.chain.id} on node: ${this.meta.url}`);
    await this.chain.init(this.meta);
    await this.accounts.init(this.chain);
    await this.governance.init(this.chain, this.accounts);
    await this._postModuleLoad();
    this._loaded = true;
  }

  public async deinit(): Promise<void> {
    this._loaded = false;
    await this.governance.deinit();
    await this.accounts.deinit();
    await this.chain.deinit();
    console.log('Cosmos stopped.');
  }
}

export default Cosmos;
