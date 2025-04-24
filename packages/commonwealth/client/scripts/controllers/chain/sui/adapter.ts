import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import type { IApp } from 'state';
import { z } from 'zod';
import IChainAdapter from '../../../models/IChainAdapter';
import type SuiAccount from './account';
import SuiAccounts from './accounts';
import SuiChain from './chain';
import type { SuiCoin } from './types';

class Sui extends IChainAdapter<SuiCoin, SuiAccount> {
  public chain: SuiChain;
  public accounts: SuiAccounts;
  public readonly base = ChainBase.Sui;

  constructor(meta: z.infer<typeof ExtendedCommunity>, app: IApp) {
    super(meta, app);
    this.chain = new SuiChain(this.app);
    this.accounts = new SuiAccounts(this.app);
  }

  public async initApi() {
    await this.chain.init(this.meta);
    await this.accounts.init(this.chain);
    await super.initApi();
  }

  public async initData() {
    await super.initData();
  }

  public async deinit(): Promise<void> {
    await super.deinit();
    await this.accounts.deinit();
    await this.chain.deinit();
    console.log('Sui stopped.');
  }
}

export default Sui;
