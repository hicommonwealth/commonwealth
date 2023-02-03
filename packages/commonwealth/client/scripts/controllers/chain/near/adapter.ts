import type { NearToken } from 'adapters/chain/near/types';
import { ChainBase } from 'common-common/src/types';
import type { ChainInfo } from 'models';
import { IChainAdapter } from 'models';
import type { IApp } from 'state';
import { NearAccounts } from './account';
import NearChain from './chain';

export default class Near extends IChainAdapter<NearToken, any> {
  public base = ChainBase.NEAR;
  public chain: NearChain;
  public accounts: NearAccounts;

  constructor(meta: ChainInfo, app: IApp) {
    super(meta, app);
    this.chain = new NearChain(this.app);
    this.accounts = new NearAccounts(this.app);
  }

  public async initApi() {
    await this.chain.init(this.meta, this.accounts);
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
