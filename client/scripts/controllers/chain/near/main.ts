import { IChainAdapter, ChainBase, ChainClass } from 'models';

import { NearToken } from 'adapters/chain/near/types';
import NearChain from './chain';
import { NearAccounts } from './account';

export default class Near extends IChainAdapter<NearToken, any> {
  public base = ChainBase.NEAR;
  public class = ChainClass.Near;
  public chain: NearChain;
  public accounts: NearAccounts;

  private _loaded: boolean = false;
  get loaded() { return this._loaded; }

  public handleEntityUpdate(e): void {
    throw new Error('not implemented');
  }

  public async init() {
    console.log(`Starting ${this.meta.chain.id} on node: ${this.meta.url}`);
    this.chain = new NearChain(this.app);
    this.accounts = new NearAccounts(this.app);

    await this.chain.init(this.meta);
    await this.accounts.init(this.chain);
    await this._postModuleLoad();

    this._loaded = true;
  }
  public async deinit() {
    this._loaded = false;
    await this.accounts.deinit();
    await this.chain.deinit();
    console.log('NEAR stopped.');
  }
}
