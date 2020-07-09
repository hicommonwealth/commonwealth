import { IChainAdapter, ChainBase, ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';

import { NearToken } from 'adapters/chain/near/types';
import NearChain from './chain';
import { NearAccounts } from './account';

export default class Near extends IChainAdapter<NearToken, any> {
  public base = ChainBase.NEAR;
  public class = ChainClass.Near;
  public chain: NearChain;
  public accounts: NearAccounts;

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.chain = new NearChain(this.app);
    this.accounts = new NearAccounts(this.app);
  }

  public handleEntityUpdate(e): void {
    throw new Error('not implemented');
  }

  public async init() {
    console.log(`Starting ${this.meta.chain.id} on node: ${this.meta.url}`);

    await this.chain.init(this.meta);
    await this.accounts.init(this.chain);
    await this._postModuleLoad();

    this.app.chainModuleReady.next(true);
    this._loaded = true;
  }

  public async deinit() {
    this._loaded = false;
    await this.accounts.deinit();
    await this.chain.deinit();
    console.log('NEAR stopped.');
  }
}
