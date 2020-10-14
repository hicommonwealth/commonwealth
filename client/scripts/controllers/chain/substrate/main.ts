import SubstrateAccounts, { SubstrateAccount } from 'controllers/chain/substrate/account';
import SubstrateDemocracy from 'controllers/chain/substrate/democracy';
import SubstrateDemocracyProposals from 'controllers/chain/substrate/democracy_proposals';
import { SubstrateCouncil, SubstrateTechnicalCommittee } from 'controllers/chain/substrate/collective';
import SubstrateTreasury from 'controllers/chain/substrate/treasury';
import ChainEntityController from 'controllers/server/chain_entities';
import { IChainAdapter, ChainBase, ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import WebWalletController from '../../app/web_wallet';
import SubstratePhragmenElections from './phragmen_elections';
import SubstrateIdentities from './identities';
import SubstrateChain from './shared';
import EdgewareSignaling from '../edgeware/signaling';

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
  public signaling: EdgewareSignaling;
  public readonly webWallet: WebWalletController = new WebWalletController();
  public readonly chainEntities = new ChainEntityController();

  public readonly base = ChainBase.Substrate;
  public readonly class: ChainClass;

  public get timedOut() {
    console.log(this.chain);
    return !!this.chain?.timedOut;
  }

  constructor(
    meta: NodeInfo,
    app: IApp,
    _class: ChainClass,
  ) {
    super(meta, app);
    this.class = _class;
    this.chain = new SubstrateChain(this.app);
    this.accounts = new SubstrateAccounts(this.app);
    this.phragmenElections = new SubstratePhragmenElections(this.app);
    this.council = new SubstrateCouncil(this.app);
    this.technicalCommittee = new SubstrateTechnicalCommittee(this.app);
    this.democracyProposals = new SubstrateDemocracyProposals(this.app);
    this.democracy = new SubstrateDemocracy(this.app);
    this.treasury = new SubstrateTreasury(this.app);
    this.identities = new SubstrateIdentities(this.app);
    this.signaling = new EdgewareSignaling(this.app);
  }

  public async initApi(additionalOptions?) {
    if (this.apiInitialized) return;
    await this.chain.resetApi(this.meta, additionalOptions);
    await this.chain.initMetadata();
    await this.accounts.init(this.chain);
    if (this.class !== ChainClass.Plasm) {
      await this.identities.init(this.chain, this.accounts);
    }
    await super.initApi();
  }

  public async initData() {
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
      this.phragmenElections,
      this.council,
      this.technicalCommittee,
      this.democracyProposals,
      this.democracy,
      this.treasury,
      this.identities,
    ].map((m) => m.initialized ? m.deinit() : Promise.resolve()));
    this.accounts.deinit();
    this.chain.deinitMetadata();
    this.chain.deinitApi();
    console.log('Substrate stopped.');
  }
}

export default Substrate;
