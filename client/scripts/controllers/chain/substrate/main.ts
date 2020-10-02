import { SubstrateTypes } from '@commonwealth/chain-events';
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
import EdgewareSignaling from '../edgeware/signaling';

export enum SubstrateModule {
  Democracy = 'democracy',
  Council = 'council',
  TechnicalCommittee = 'technical-committee',
  Treasury = 'treasury',
  Identity = 'identity',
  Signaling = 'signaling',
}

function moduleToEntityKinds(m: SubstrateModule): SubstrateTypes.EntityKind[] {
  switch (m) {
    case SubstrateModule.Democracy: {
      return [
        SubstrateTypes.EntityKind.DemocracyPreimage,
        SubstrateTypes.EntityKind.DemocracyProposal,
        SubstrateTypes.EntityKind.DemocracyReferendum,
      ];
    }
    case SubstrateModule.Council: {
      return [
        SubstrateTypes.EntityKind.CollectiveProposal,
        SubstrateTypes.EntityKind.DemocracyPreimage,
      ];
    }
    case SubstrateModule.TechnicalCommittee: {
      return [ SubstrateTypes.EntityKind.CollectiveProposal ];
    }
    case SubstrateModule.Identity: {
      return [];
    }
    case SubstrateModule.Treasury: {
      return [ SubstrateTypes.EntityKind.TreasuryProposal ];
    }
    case SubstrateModule.Signaling: {
      return [ SubstrateTypes.EntityKind.SignalingProposal ];
    }
    default: {
      const _dummy: never = m;
    }
  }
}

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
  public activeModules: SubstrateModule[] = [];

  constructor(
    meta: NodeInfo,
    app: IApp,
    _class: ChainClass,
    // default module set is everything but signaling
    private _disabledModules: SubstrateModule[] = [ SubstrateModule.Signaling ]
  ) {
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
    this.signaling = new EdgewareSignaling(this.app);
  }

  // dispatches event updates to a given entity to the appropriate module
  public handleEntityUpdate(entity: ChainEntity, event: ChainEvent): void {
    const activeEntities = this.activeModules.map((m) => moduleToEntityKinds(m))
      .reduce((prev, curr) => prev.concat(...curr), []); // flatten
    handleSubstrateEntityUpdate(this, activeEntities, entity, event);
  }

  public async initApi(additionalOptions?) {
    if (this.apiInitialized) return;
    await this.chain.resetApi(this.meta, additionalOptions);
    await this.chain.initMetadata();
    await this.accounts.init(this.chain);
    await super.initApi();
  }

  public async initModule(m: SubstrateModule) {
    if (this._disabledModules.includes(m)) return;
    if (this.activeModules.includes(m)) return;
    // TODO: there is a potential race condition here. Page loads are triggered on
    //  this activeModules array, and entity updates are switched on it in handleEntityUpdate.
    //  the issue is that, if we place this .push() call after we load chain entities,
    //  then we wont "keep" the entity, but if we place it before, then the page might try
    //  to render before we've completed processing.
    this.activeModules.push(m);

    // TODO: replace this with a module-specific call
    const fetchCmd = this.chain.fetcher.fetch;
    await this.chainEntities.fetchEntities(
      this,
      fetchCmd,
      // ensure Preimages come LAST
      (e1, e2) => {
        if (e1.data.kind === SubstrateTypes.EventKind.PreimageNoted) return 1;
        if (e2.data.kind === SubstrateTypes.EventKind.PreimageNoted) return -1;
        return 0;
      },
    );
    switch (m) {
      case SubstrateModule.Democracy: {
        await this.democracyProposals.init(this.chain, this.accounts);
        await this.democracy.init(this.chain, this.accounts);
        break;
      }
      case SubstrateModule.Council: {
        await this.council.init(this.chain, this.accounts);
        await this.phragmenElections.init(this.chain, this.accounts);
        break;
      }
      case SubstrateModule.TechnicalCommittee: {
        await this.technicalCommittee.init(this.chain, this.accounts);
        break;
      }
      case SubstrateModule.Identity: {
        await this.identities.init(this.chain, this.accounts);
        break;
      }
      case SubstrateModule.Treasury: {
        await this.treasury.init(this.chain, this.accounts);
        break;
      }
      case SubstrateModule.Signaling: {
        await this.signaling.init(this.chain, this.accounts);
        break;
      }
      default: {
        const _dummy: never = m;
      }
    }
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
