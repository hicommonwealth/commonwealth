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

  public async initApi() {
    await this.chain.init(this.meta);
    await this.accounts.init(this.chain);
    await super.initApi();
  }

  public async initData() {
    await super.initData();
  }

  public async deinit() {
    await super.deinit();
    await this.accounts.deinit();
    await this.chain.deinit();
    console.log('NEAR stopped.');
  }
}
