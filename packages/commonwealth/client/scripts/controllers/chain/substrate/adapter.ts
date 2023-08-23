import type { SubstrateCoin } from 'adapters/chain/substrate/types';
import { ChainBase } from 'common-common/src/types';
import type { SubstrateAccount } from 'controllers/chain/substrate/account';
import SubstrateAccounts from 'controllers/chain/substrate/account';
import type { IApp } from 'state';
import type ChainInfo from '../../../models/ChainInfo';
import IChainAdapter from '../../../models/IChainAdapter';

class Substrate extends IChainAdapter<SubstrateCoin, SubstrateAccount> {
  public accounts: SubstrateAccounts;

  public readonly base = ChainBase.Substrate;

  public get chain(): any {
    throw new Error('Substrate chain not supported');
  }

  constructor(meta: ChainInfo, app: IApp) {
    super(meta, app);
    this.accounts = new SubstrateAccounts(this.app);
  }

  public async initApi(additionalOptions?) {
    if (this.apiInitialized) return;
    await this.accounts.init();
    await super.initApi();
  }

  public async initData() {
    await super.initData();
  }

  public async deinit(): Promise<void> {
    await super.deinit();
    this.accounts.deinit();
    console.log('Substrate stopped.');
  }
}

export default Substrate;
