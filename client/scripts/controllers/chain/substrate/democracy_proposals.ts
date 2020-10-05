import { Unsubscribable } from 'rxjs';
import { first } from 'rxjs/operators';
import { Codec } from '@polkadot/types/types';
import { BlockNumber, Call, Balance, VoteThreshold, Hash } from '@polkadot/types/interfaces';
import { bool, Option } from '@polkadot/types';
import { ApiRx } from '@polkadot/api';
import { ISubstrateDemocracyProposal, SubstrateCoin } from 'adapters/chain/substrate/types';
import { SubstrateTypes } from '@commonwealth/chain-events';
import { ProposalModule } from 'models';
import { IApp } from 'state';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import SubstrateDemocracyProposal from './democracy_proposal';

type NextExternal = [Hash, VoteThreshold] & Codec;

class SubstrateDemocracyProposals extends ProposalModule<
  ApiRx,
  ISubstrateDemocracyProposal,
  SubstrateDemocracyProposal
> {
  // SubstrateDemocracyProposals DATA
  // How often (in blocks) new public referenda are launched.
  private _launchPeriod: number = null;

  get launchPeriod() { return this._launchPeriod; }

  // Period in blocks where an external proposal may not be re-submitted after being vetoed.
  private _cooloffPeriod: number = null;

  get cooloffPeriod() { return this._cooloffPeriod; }

  // The minimum amount to be used as a deposit for a public referendum proposal.
  private _minimumDeposit: SubstrateCoin = null;

  get minimumDeposit() { return this._minimumDeposit; }

  get nextLaunchBlock(): number {
    return (Math.floor(this.app.chain.block.height / this.launchPeriod) + 1) * this.launchPeriod;
  }

  private _lastTabledWasExternal: boolean = null;

  get lastTabledWasExternal() { return this._lastTabledWasExternal; }

  private _nextExternal: [ Hash, VoteThreshold ] = null;

  get nextExternal() { return this._nextExternal; }

  private _externalsSubscription: Unsubscribable;

  private _Chain: SubstrateChain;

  private _Accounts: SubstrateAccounts;

  public getByHash(hash: string) {
    return this.store.getAll().find((proposal) => proposal.hash === hash);
  }

  constructor(app: IApp) {
    super(app, (e) => new SubstrateDemocracyProposal(this._Chain, this._Accounts, this, e));
  }

  // Loads all proposals and referendums currently present in the democracy module
  public init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts): Promise<void> {
    if (this._initializing || this._initialized || this.disabled) return;
    this._initializing = true;
    this._Chain = ChainInfo;
    this._Accounts = Accounts;

    // load server proposals
    const entities = this.app.chain.chainEntities.store.getByType(SubstrateTypes.EntityKind.DemocracyProposal);
    const proposals = entities.map((e) => this._entityConstructor(e));

    return new Promise((resolve, reject) => {
      this._Chain.api.pipe(first()).subscribe(async (api: ApiRx) => {
        // save parameters
        this._minimumDeposit = this._Chain.coins(api.consts.democracy.minimumDeposit as Balance);
        this._launchPeriod = +(api.consts.democracy.launchPeriod as BlockNumber);
        this._cooloffPeriod = +(api.consts.democracy.cooloffPeriod as BlockNumber);

        // fetch proposals from chain
        const events = await this.app.chain.chainEntities.fetchEntities(
          this.app.chain.id,
          this,
          () => this._Chain.fetcher.fetchDemocracyProposals(this.app.chain.block.height)
        );
        const hashes = events.map((e) => e.data.proposalHash);
        await this.app.chain.chainEntities.fetchEntities(
          this.app.chain.id,
          this,
          () => this._Chain.fetcher.fetchDemocracyPreimages(hashes)
        );
        // register new chain-event handlers
        this.app.chain.chainEntities.registerEntityHandler(
          SubstrateTypes.EntityKind.DemocracyPreimage, (entity, event) => {
            if (!this.initialized) return;
            if (event.data.kind === SubstrateTypes.EventKind.PreimageNoted) {
              const proposal = this.getByHash(entity.typeId);
              if (proposal) proposal.update(event);
            }
          }
        );
        this.app.chain.chainEntities.registerEntityHandler(
          SubstrateTypes.EntityKind.DemocracyProposal, (entity, event) => {
            if (this.initialized) this.updateProposal(entity, event);
          }
        );

        // TODO: add preimage to get name of nextExternal
        await new Promise((externalsResolve) => {
          this._externalsSubscription = api.queryMulti([
            api.query.democracy.lastTabledWasExternal,
            api.query.democracy.nextExternal,
          ]).subscribe(([lastTabledWasExternal, nextExternal]: [ bool, Option<NextExternal> ]) => {
            this._lastTabledWasExternal = lastTabledWasExternal.valueOf();
            this._nextExternal = nextExternal.unwrapOr(null);
            externalsResolve();
          });
        });

        this._initialized = true;
        this._initializing = false;
        resolve();
      },
      (err) => reject(new Error(err)));
    });
  }

  public deinit() {
    if (this._externalsSubscription) {
      this._externalsSubscription.unsubscribe();
    }
    super.deinit();
  }

  public async createTx(author: SubstrateAccount, action: Call, proposalHash: Hash, deposit: SubstrateCoin) {
    const txFunc = (api: ApiRx) => api.tx.democracy.propose(proposalHash, deposit.asBN);
    const title = this._Chain.methodToTitle(action);
    return this._Chain.createTXModalData(author, txFunc, 'createDemocracyProposal', title);
  }

  public notePreimage(author: SubstrateAccount, action: Call, encodedProposal: string) {
    const title = this._Chain.methodToTitle(action);
    return this._Chain.createTXModalData(
      author,
      (api: ApiRx) => api.tx.democracy.notePreimage(encodedProposal),
      'notePreimage',
      title
    );
  }

  public noteImminentPreimage(author: SubstrateAccount, action: Call, encodedProposal: string) {
    const title = this._Chain.methodToTitle(action);
    return this._Chain.createTXModalData(
      author,
      (api: ApiRx) => api.tx.democracy.notePreimage(encodedProposal),
      'noteImminentPreimage',
      title,
    );
  }
}

export default SubstrateDemocracyProposals;
