import SubstrateAccounts, { SubstrateAccount } from 'controllers/chain/substrate/account';
import SubstrateDemocracy from 'controllers/chain/substrate/democracy';
import SubstrateDemocracyProposals from 'controllers/chain/substrate/democracy_proposals';
import { SubstrateCouncil, SubstrateTechnicalCommittee } from 'controllers/chain/substrate/collective';
import SubstrateTreasury from 'controllers/chain/substrate/treasury';
import ChainEntityController from 'controllers/server/chain_entities';
import { IChainAdapter, ChainBase, ChainClass, ChainEntity, ChainEvent, NodeInfo } from 'models';
import { IApp } from 'state';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import WebWalletController from '../../app/web_wallet';
import SubstratePhragmenElections from './phragmen_elections';
import SubstrateIdentities from './identities';
import SubstrateChain, { handleSubstrateEntityUpdate } from './shared';

class Substrate extends IChainAdapter<SubstrateCoin, SubstrateAccount> {
  public chain: SubstrateChain;
  public accounts: SubstrateAccounts;
  public phragmenElections: SubstratePhragmenElections;
  public council: SubstrateCouncil;
  public technicalCommittee: SubstrateTechnicalCommittee;
  public democracyProposals: SubstrateDemocracyProposals;
  public democracy: SubstrateDemocracy;
  public treasury: SubstrateTreasury;
  public identities: SubstrateIdentities;
  public readonly webWallet: WebWalletController = new WebWalletController();
  public readonly chainEntities = new ChainEntityController();

  public readonly base = ChainBase.Substrate;
  public readonly class: ChainClass;

  constructor(meta: NodeInfo, app: IApp, _class: ChainClass) {
    super(meta, app);
    this.class = _class;
    this.chain = new SubstrateChain(this.app); // kusama chain id
    this.accounts = new SubstrateAccounts(this.app);
    this.phragmenElections = new SubstratePhragmenElections(this.app);
    this.council = new SubstrateCouncil(this.app);
    this.technicalCommittee = new SubstrateTechnicalCommittee(this.app);
    this.democracyProposals = new SubstrateDemocracyProposals(this.app);
    this.democracy = new SubstrateDemocracy(this.app);
    this.treasury = new SubstrateTreasury(this.app);
    this.identities = new SubstrateIdentities(this.app);
  }

  // dispatches event updates to a given entity to the appropriate module
  public handleEntityUpdate(entity: ChainEntity, event: ChainEvent): void {
    handleSubstrateEntityUpdate(this, entity, event);
  }

  public async initApi() {
    if (this.apiInitialized) return;
    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();
    await this.accounts.init(this.chain);
    await super.initApi();
  }

  public async initData() {
    await Promise.all([
      this.phragmenElections.init(this.chain, this.accounts),
      this.council.init(this.chain, this.accounts),
      this.technicalCommittee.init(this.chain, this.accounts),
      this.democracyProposals.init(this.chain, this.accounts),
      this.democracy.init(this.chain, this.accounts),
      this.treasury.init(this.chain, this.accounts),
      this.identities.init(this.chain, this.accounts),
    ]);
    if (!this.usingServerChainEntities) {
      await this.chain.initChainEntities();
    }
    await this.chain.initEventLoop();
    await super.initData(this.usingServerChainEntities);
  }

  public async deinit(): Promise<void> {
    await super.deinit();
    this.chain.deinitEventLoop();
    await Promise.all([
      this.phragmenElections.deinit(),
      this.council.deinit(),
      this.technicalCommittee.deinit(),
      this.democracyProposals.deinit(),
      this.democracy.deinit(),
      this.treasury.deinit(),
      this.identities.deinit(),
    ]);
    this.accounts.deinit();
    this.chain.deinitMetadata();
    this.chain.deinitApi();
    console.log('Substrate stopped.');
  }
}

export default Substrate;
