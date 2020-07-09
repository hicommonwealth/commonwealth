import * as edgewareDefinitions from 'edgeware-node-types/dist/definitions';

import { SubstrateCoin } from 'adapters/chain/substrate/types';
import EdgewareChain from 'controllers/chain/edgeware/shared';
import SubstrateAccounts, { SubstrateAccount } from 'controllers/chain/substrate/account';
import SubstrateDemocracy from 'controllers/chain/substrate/democracy';
import SubstrateDemocracyProposals from 'controllers/chain/substrate/democracy_proposals';
import { SubstrateCouncil } from 'controllers/chain/substrate/collective';
import SubstrateTreasury from 'controllers/chain/substrate/treasury';
import ChainEntityController from 'controllers/server/chain_entities';
import SubstratePhragmenElections from 'controllers/chain/substrate/phragmen_elections';
import { ChainClass, IChainAdapter, ChainBase, ChainEntity, ChainEvent, NodeInfo } from 'models';
import { IApp } from 'state';

import EdgewareSignaling from './signaling';
import WebWalletController from '../../app/web_wallet';
import SubstrateIdentities from '../substrate/identities';
import { handleSubstrateEntityUpdate } from '../substrate/shared';


class Edgeware extends IChainAdapter<SubstrateCoin, SubstrateAccount> {
  public chain: EdgewareChain;
  public accounts: SubstrateAccounts;
  public phragmenElections: SubstratePhragmenElections;
  public council: SubstrateCouncil;
  public identities: SubstrateIdentities;
  // eslint-disable-next-line max-len
  public democracyProposals: SubstrateDemocracyProposals;
  public democracy: SubstrateDemocracy;
  public treasury: SubstrateTreasury;
  public signaling: EdgewareSignaling;

  public readonly webWallet: WebWalletController = new WebWalletController();
  public readonly chainEntities = new ChainEntityController();
  public readonly base = ChainBase.Substrate;
  public readonly class = ChainClass.Edgeware;

  public handleEntityUpdate(entity: ChainEntity, event: ChainEvent): void {
    handleSubstrateEntityUpdate(this, entity, event);
  }

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.chain = new EdgewareChain(this.app); // edgeware chain this.appid
    this.accounts = new SubstrateAccounts(this.app);
    this.phragmenElections = new SubstratePhragmenElections(this.app);
    this.council = new SubstrateCouncil(this.app);
    this.identities = new SubstrateIdentities(this.app);
    this.democracyProposals = new SubstrateDemocracyProposals(this.app);
    this.democracy = new SubstrateDemocracy(this.app);
    this.treasury = new SubstrateTreasury(this.app);
    this.signaling = new EdgewareSignaling(this.app);
  }

  public async init() {
    console.log(`Starting ${this.meta.chain.id} on node: ${this.meta.url}`);
    const edgTypes = Object.values(edgewareDefinitions)
      .reduce((res, { default: { types } }): object => ({ ...res, ...types }), {});
    await this.chain.resetApi(this.meta, {
      types: {
        ...edgTypes,
        // aliases that don't do well as part of interfaces
        'voting::VoteType': 'VoteType',
        'voting::TallyType': 'TallyType',
        // chain-specific overrides
        Address: 'GenericAddress',
        Keys: 'SessionKeys4',
        StakingLedger: 'StakingLedgerTo223',
        Votes: 'VotesTo230',
        ReferendumInfo: 'ReferendumInfoTo239',
        Weight: 'u32',
      },
      // override duplicate type name
      typesAlias: { voting: { Tally: 'VotingTally' } },
    });
    await this.chain.initMetadata();
    await this.accounts.init(this.chain);
    await Promise.all([
      this.phragmenElections.init(this.chain, this.accounts, 'elections'),
      this.council.init(this.chain, this.accounts),
      this.democracyProposals.init(this.chain, this.accounts),
      this.democracy.init(this.chain, this.accounts, false),
      this.treasury.init(this.chain, this.accounts),
      this.identities.init(this.chain, this.accounts),
      this.signaling.init(this.chain, this.accounts),
    ]);
    if (!this.usingServerChainEntities) {
      await this.chain.initChainEntities();
    }
    await this._postModuleLoad(this.usingServerChainEntities);
    this.chain.initEventLoop();

    this.app.chainModuleReady.next(true);
    this._loaded = true;
  }

  public async deinit(): Promise<void> {
    this._loaded = false;
    // this.server.proposals.deinit();
    this.chain.deinitEventLoop();
    await Promise.all([
      this.phragmenElections.deinit(),
      this.council.deinit(),
      this.democracyProposals.deinit(),
      this.democracy.deinit(),
      this.treasury.deinit(),
      this.identities.deinit(),
      this.signaling.deinit(),
    ]);
    this.accounts.deinit();
    this.chain.deinitMetadata();
    this.chain.deinitApi();
    console.log('Edgeware stopped.');
  }
}

export default Edgeware;
