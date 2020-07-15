import * as edgewareDefinitions from '@edgeware/node-types/interfaces/definitions';
import EdgewareChain from 'controllers/chain/edgeware/shared';
import SubstrateAccounts, { SubstrateAccount } from 'controllers/chain/substrate/account';
import SubstrateDemocracy from 'controllers/chain/substrate/democracy';
import SubstrateDemocracyProposals from 'controllers/chain/substrate/democracy_proposals';
import { SubstrateCouncil } from 'controllers/chain/substrate/collective';
import SubstrateTreasury from 'controllers/chain/substrate/treasury';
import ChainEntityController, { EntityRefreshOption } from 'controllers/server/chain_entities';
import SubstratePhragmenElections from 'controllers/chain/substrate/phragmen_elections';
import { ChainClass, IChainAdapter, ChainBase, ChainEntity, ChainEvent } from 'models';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
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

  private _loaded: boolean = false;
  get loaded() { return this._loaded; }

  public handleEntityUpdate(entity: ChainEntity, event: ChainEvent): void {
    handleSubstrateEntityUpdate(this, entity, event);
  }

  public async init(onServerLoaded?) {
    // if set to true, loads chain entity data from the node directly on the client
    // if set to false, chain entity data is loaded from the server
    // in both cases, archived proposals (no longer on chain) are loaded from the server
    const useClientChainEntities = true;
    console.log(`Starting ${this.meta.chain.id} on node: ${this.meta.url}`);
    this.chain = new EdgewareChain(this.app); // edgeware chain this.appid
    this.accounts = new SubstrateAccounts(this.app);
    this.phragmenElections = new SubstratePhragmenElections(this.app);
    this.council = new SubstrateCouncil(this.app);
    this.identities = new SubstrateIdentities(this.app);
    this.democracyProposals = new SubstrateDemocracyProposals(this.app);
    this.democracy = new SubstrateDemocracy(this.app);
    this.treasury = new SubstrateTreasury(this.app);
    this.signaling = new EdgewareSignaling(this.app);

    await super.init(async () => {
      const edgTypes = Object.values(edgewareDefinitions)
        .reduce((res, { types }): object => ({ ...res, ...types }), {});

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
          OpenTip: 'OpenTipTo225',
        },
        // override duplicate type name
        typesAlias: { voting: { Tally: 'VotingTally' } },
      });
      await this.chain.initMetadata();
    }, onServerLoaded, useClientChainEntities
      ? EntityRefreshOption.CompletedEntities
      : EntityRefreshOption.AllEntities);
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
    if (useClientChainEntities) {
      await this.chain.initChainEntities();
    }
    await this._postModuleLoad(!useClientChainEntities);
    await this.chain.initEventLoop();

    this._loaded = true;
  }

  public async deinit(): Promise<void> {
    this._loaded = false;
    super.deinit();
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
