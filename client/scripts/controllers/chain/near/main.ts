import app from 'state';

import { IChainAdapter, ChainBase, ChainClass } from 'models/models';

import { NearToken } from 'adapters/chain/near/types';
import { NearChain } from './chain';
import { NearAccounts } from './account';

export default class Near extends IChainAdapter<NearToken, any> {
  public base = ChainBase.NEAR;
  public class = ChainClass.Near;
  public readonly chain: NearChain = new NearChain();
  public readonly accounts: NearAccounts = new NearAccounts();
  public readonly server = {};

  private _loaded: boolean = false;
  get loaded() { return this._loaded; }

  private _serverLoaded: boolean = false;
  get serverLoaded() { return this._serverLoaded; }

  public init = async (onServerLoaded?) => {
    console.log(`Starting ${this.meta.chain.id} on node: ${this.meta.url}`);
    await app.threads.refreshAll(this.id, null, true);
    await app.comments.refreshAll(this.id, null, true);
    await app.reactions.refreshAll(this.id, null, true);
    this._serverLoaded = true;
    if (onServerLoaded) await onServerLoaded();

    await this.chain.init(this.meta);
    await this.accounts.init(this.chain);

    this._loaded = true;
  }
  public deinit = async () => {
    this._loaded = false;
    this._serverLoaded = false;
    app.threads.deinit();
    app.comments.deinit();
    app.reactions.deinit();

    await this.accounts.deinit();
    await this.chain.deinit();
    console.log('NEAR stopped.');
  }
}
