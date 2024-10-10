import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import type { IApp } from 'state';
import { z } from 'zod';
import IChainAdapter from '../../../models/IChainAdapter';
import { NearAccounts } from './account';
import NearChain from './chain';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default class Near extends IChainAdapter<any, any> {
  public base = ChainBase.NEAR;
  public chain: NearChain;
  public accounts: NearAccounts;

  constructor(meta: z.infer<typeof ExtendedCommunity>, app: IApp) {
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
