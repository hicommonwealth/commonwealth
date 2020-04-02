import app from 'state';

import { CosmosToken } from 'adapters/chain/cosmos/types';
import { IChainAdapter, ChainBase, ChainClass } from 'models/models';
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

  private _serverLoaded: boolean = false;
  public get serverLoaded() { return this._serverLoaded; }

  public init = async (onServerLoaded?) => {
    console.log(`Starting ${this.meta.chain.id} on node: ${this.meta.url}`);
    this.chain = new CosmosChain(this.app);
    this.accounts = new CosmosAccounts(this.app);
    this.governance = new CosmosGovernance(this.app);
    await app.threads.refreshAll(this.id, null, true);
    await app.comments.refreshAll(this.id, null, true);
    await app.reactions.refreshAll(this.id, null, true);
    this._serverLoaded = true;
    if (onServerLoaded) await onServerLoaded();

    await this.chain.init(this.meta);
    await this.accounts.init(this.chain);
    await this.governance.init(this.chain, this.accounts);
    this._loaded = true;
  }

  public deinit = async (): Promise<void> => {
    this._loaded = false;
    this._serverLoaded = false;
    app.threads.deinit();
    app.comments.deinit();
    app.reactions.deinit();

    await this.governance.deinit();
    await this.accounts.deinit();
    await this.chain.deinit();
    console.log('Cosmos stopped.');
  }
}

export default Cosmos;
