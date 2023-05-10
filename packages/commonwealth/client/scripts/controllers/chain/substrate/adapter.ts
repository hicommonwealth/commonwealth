import type { SubstrateCoin } from 'adapters/chain/substrate/types';
import { ChainBase } from 'common-common/src/types';
import type { SubstrateAccount } from 'controllers/chain/substrate/account';
import SubstrateAccounts from 'controllers/chain/substrate/account';
import SubstrateDemocracy from 'controllers/chain/substrate/democracy';
import SubstrateDemocracyProposals from 'controllers/chain/substrate/democracy_proposals';
import SubstrateTreasury from 'controllers/chain/substrate/treasury';
import type { IApp } from 'state';
import type ChainInfo from '../../../models/ChainInfo';
import IChainAdapter from '../../../models/IChainAdapter';
import SubstrateChain from './shared';
import SubstrateTreasuryTips from './treasury_tips';

class Substrate extends IChainAdapter<SubstrateCoin, SubstrateAccount> {
  public chain: SubstrateChain;
  public accounts: SubstrateAccounts;
  public democracyProposals: SubstrateDemocracyProposals;
  public democracy: SubstrateDemocracy;
  public treasury: SubstrateTreasury;
  public tips: SubstrateTreasuryTips;

  public readonly base = ChainBase.Substrate;

  public get timedOut() {
    console.log(this.chain);
    return !!this.chain?.timedOut;
  }

  constructor(meta: ChainInfo, app: IApp) {
    super(meta, app);
    this.chain = new SubstrateChain(this.app);
    this.accounts = new SubstrateAccounts(this.app);
    this.democracyProposals = new SubstrateDemocracyProposals(this.app);
    this.democracy = new SubstrateDemocracy(this.app);
    this.treasury = new SubstrateTreasury(this.app);
    this.tips = new SubstrateTreasuryTips(this.app);
  }

  public async initApi(additionalOptions?) {
    if (this.apiInitialized) return;
    await this.chain.resetApi(
      this.meta,
      additionalOptions || this.meta.substrateSpec
    );
    await this.chain.initMetadata();
    await this.accounts.init(this.chain);
    await super.initApi();
  }

  public async initData() {
    await this.chain.initChainEntities();
    await this.chain.initEventLoop();
    await super.initData();
  }

  public async deinit(): Promise<void> {
    await super.deinit();
    this.chain.deinitEventLoop();
    await Promise.all(
      [this.democracyProposals, this.democracy, this.treasury, this.tips].map(
        (m) => (m.initialized ? m.deinit() : Promise.resolve())
      )
    );
    this.accounts.deinit();
    this.chain.deinitMetadata();
    await this.chain.deinitApi();
    console.log('Substrate stopped.');
  }
}

export default Substrate;
