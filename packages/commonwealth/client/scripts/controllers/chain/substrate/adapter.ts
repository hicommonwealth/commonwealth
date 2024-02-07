import { ChainBase } from '@hicommonwealth/core';
import type { SubstrateAccount } from 'controllers/chain/substrate/account';
import SubstrateAccounts from 'controllers/chain/substrate/account';
import type { IApp } from 'state';
import type ChainInfo from '../../../models/ChainInfo';
import IChainAdapter from '../../../models/IChainAdapter';

// The 'any' type here is only used as type for the Coin on the chain property in IChainAdapter.
// The chain controller for Substrate does not exist so there is no need to provide a type for Coin.
class Substrate extends IChainAdapter<any, SubstrateAccount> {
  public accounts: SubstrateAccounts;

  public readonly base = ChainBase.Substrate;

  public get chain(): any {
    throw new Error('Substrate chain not supported');
  }

  constructor(meta: ChainInfo, app: IApp) {
    super(meta, app);
    this.accounts = new SubstrateAccounts(this.app);
  }

  public async initApi() {
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
