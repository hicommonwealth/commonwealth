import { IChainAdapter, ChainBase, ChainClass } from 'models';

import { NearToken } from 'adapters/chain/near/types';
import NearChain from './chain';
import { NearAccounts } from './account';

export default class Near extends IChainAdapter<NearToken, any> {
  public base = ChainBase.NEAR;
  public class = ChainClass.Near;
  public chain: NearChain;
  public accounts: NearAccounts;
  public readonly server = {};

  private _loaded: boolean = false;
  get loaded() { return this._loaded; }

  public async init(onServerLoaded?) {
    console.log(`Starting ${this.meta.chain.id} on node: ${this.meta.url}`);
    this.chain = new NearChain(this.app);
    this.accounts = new NearAccounts(this.app);

    await super.init(async () => {
      await this.chain.init(this.meta);
    }, onServerLoaded);
    await this.accounts.init(this.chain);

    this._loaded = true;
  }
  public deinit = async () => {
    this._loaded = false;
    super.deinit();

    await this.accounts.deinit();
    await this.chain.deinit();
    console.log('NEAR stopped.');
  }
}
