import { CosmosToken } from 'adapters/chain/cosmos/types';
import { IChainAdapter, ChainBase, ChainClass } from 'models';
import { CosmosAccount, CosmosAccounts } from './account';
import CosmosChain from './chain';
import CosmosGovernance from './governance';

class Cosmos extends IChainAdapter<CosmosToken, CosmosAccount> {
  public chain: CosmosChain;
  public accounts: CosmosAccounts;
  public governance: CosmosGovernance;
  public readonly server = {};
  public readonly base = ChainBase.CosmosSDK;
  public readonly class = ChainClass.CosmosHub;

  private _loaded: boolean = false;
  public get loaded() { return this._loaded; }

  public async init(onServerLoaded?) {
    console.log(`Starting ${this.meta.chain.id} on node: ${this.meta.url}`);
    this.chain = new CosmosChain(this.app);
    this.accounts = new CosmosAccounts(this.app);
    this.governance = new CosmosGovernance(this.app);

    await super.init(async () => {
      await this.chain.init(this.meta);
    }, onServerLoaded);
    await this.accounts.init(this.chain);
    await this.governance.init(this.chain, this.accounts);
    this._loaded = true;
  }

  public async deinit(): Promise<void> {
    this._loaded = false;
    super.deinit();

    await this.governance.deinit();
    await this.accounts.deinit();
    await this.chain.deinit();
    console.log('Cosmos stopped.');
  }
}

export default Cosmos;
