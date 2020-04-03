import app from 'state';

import SubstrateChain from 'controllers/chain/substrate/shared';
import SubstrateAccounts, { SubstrateAccount } from 'controllers/chain/substrate/account';
import SubstrateDemocracy from 'controllers/chain/substrate/democracy';
import SubstrateDemocracyProposals from 'controllers/chain/substrate/democracy_proposals';
import { SubstrateCouncil, SubstrateTechnicalCommittee } from 'controllers/chain/substrate/collective';
import SubstrateTreasury from 'controllers/chain/substrate/treasury';

import { IChainAdapter, ChainBase, ChainClass } from 'models/models';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import WebWalletController from '../../app/web_wallet';
import SubstratePhragmenElections from './phragmen_elections';
import SubstrateIdentities from './identity';

class Substrate extends IChainAdapter<SubstrateCoin, SubstrateAccount> {
  public readonly chain: SubstrateChain = new SubstrateChain(); // kusama chain id
  public readonly accounts: SubstrateAccounts = new SubstrateAccounts();
  public readonly phragmenElections: SubstratePhragmenElections = new SubstratePhragmenElections();
  public readonly council: SubstrateCouncil = new SubstrateCouncil();
  public readonly technicalCommittee: SubstrateTechnicalCommittee = new SubstrateTechnicalCommittee();
  public readonly democracyProposals: SubstrateDemocracyProposals = new SubstrateDemocracyProposals();
  public readonly democracy: SubstrateDemocracy = new SubstrateDemocracy();
  public readonly treasury: SubstrateTreasury = new SubstrateTreasury();
  public readonly identities: SubstrateIdentities = new SubstrateIdentities();
  public readonly webWallet: WebWalletController = new WebWalletController();
  public readonly server = {};

  private _loaded: boolean = false;
  public get loaded() { return this._loaded; }

  private _serverLoaded: boolean = false;
  public get serverLoaded() { return this._serverLoaded; }

  public readonly base = ChainBase.Substrate;
  public readonly class = ChainClass.Kusama;

  public init = async (onServerLoaded?) => {
    console.log(`Starting ${this.meta.chain.id} on node: ${this.meta.url}`);
    await app.threads.refreshAll(this.id, null, true);
    await app.comments.refreshAll(this.id, null, true);
    await app.reactions.refreshAll(this.id, null, true);
    this._serverLoaded = true;
    if (onServerLoaded) await onServerLoaded();

    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();
    await this.accounts.init(this.chain);
    await Promise.all([
      this.phragmenElections.init(this.chain, this.accounts),
      this.council.init(this.chain, this.accounts),
      this.technicalCommittee.init(this.chain, this.accounts),
      this.democracyProposals.init(this.chain, this.accounts),
      this.democracy.init(this.chain, this.accounts, true),
      this.treasury.init(this.chain, this.accounts),
      this.identities.init(this.chain, this.accounts),
    ]);
    await this.chain.initEventLoop();

    this._loaded = true;
  }

  public deinit = async (): Promise<void> => {
    this._loaded = false;
    this._serverLoaded = false;
    app.threads.deinit();
    app.comments.deinit();
    app.reactions.deinit();
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
