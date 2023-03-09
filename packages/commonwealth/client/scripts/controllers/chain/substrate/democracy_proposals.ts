import type { ApiPromise } from '@polkadot/api';
import type {
  Balance,
  BlockNumber,
  Call,
  Hash,
  VoteThreshold,
} from '@polkadot/types/interfaces';
import type {
  ISubstrateDemocracyProposal,
  SubstrateCoin,
} from 'adapters/chain/substrate/types';
import { SubstrateTypes } from 'chain-events/src/types';
import { ProposalModule } from 'models';
import type { IApp } from 'state';
import type SubstrateAccounts from './accounts';
import SubstrateDemocracyProposal from './democracy_proposal';
import type SubstrateChain from './shared';
import type { AddressAccount } from 'models';

class SubstrateDemocracyProposals extends ProposalModule<
  ApiPromise,
  ISubstrateDemocracyProposal,
  SubstrateDemocracyProposal
> {
  // SubstrateDemocracyProposals DATA
  // How often (in blocks) new public referenda are launched.
  private _launchPeriod: number = null;
  get launchPeriod() {
    return this._launchPeriod;
  }

  // Period in blocks where an external proposal may not be re-submitted after being vetoed.
  private _cooloffPeriod: number = null;

  // The minimum amount to be used as a deposit for a public referendum proposal.
  private _minimumDeposit: SubstrateCoin = null;
  get minimumDeposit() {
    return this._minimumDeposit;
  }

  get nextLaunchBlock(): number {
    return (
      (Math.floor(this.app.chain.block.height / this.launchPeriod) + 1) *
      this.launchPeriod
    );
  }

  private _lastTabledWasExternal: boolean = null;
  get lastTabledWasExternal() {
    return this._lastTabledWasExternal;
  }

  private _nextExternal: [Hash, VoteThreshold] = null;
  get nextExternal() {
    return this._nextExternal;
  }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;

  public getByHash(hash: string) {
    return this.store.getAll().find((proposal) => proposal.hash === hash);
  }

  constructor(app: IApp) {
    super(
      app,
      (e) =>
        new SubstrateDemocracyProposal(this._Chain, this._Accounts, this, e)
    );
  }

  // Loads all proposals and referendums currently present in the democracy module
  public async init(
    ChainInfo: SubstrateChain,
    Accounts: SubstrateAccounts
  ): Promise<void> {
    this._disabled = !ChainInfo.api.query.democracy;
    if (this._initializing || this._initialized || this.disabled) return;
    this._initializing = true;
    this._Chain = ChainInfo;
    this._Accounts = Accounts;

    // load server proposals
    const entities = this.app.chainEntities.getByType(
      SubstrateTypes.EntityKind.DemocracyProposal
    );
    entities.forEach((e) => this._entityConstructor(e));

    // save parameters
    this._minimumDeposit = this._Chain.coins(
      ChainInfo.api.consts.democracy.minimumDeposit as Balance
    );
    this._launchPeriod = +(ChainInfo.api.consts.democracy
      .launchPeriod as BlockNumber);
    this._cooloffPeriod = +(ChainInfo.api.consts.democracy
      .cooloffPeriod as BlockNumber);

    // register new chain-event handlers
    this.app.chainEntities.registerEntityHandler(
      SubstrateTypes.EntityKind.DemocracyProposal,
      (entity, event) => {
        this.updateProposal(entity, event);
      }
    );
    this.app.chainEntities.registerEntityHandler(
      SubstrateTypes.EntityKind.DemocracyPreimage,
      (entity, event) => {
        if (event.data.kind === SubstrateTypes.EventKind.PreimageNoted) {
          const proposal = this.getByHash(entity.typeId);
          if (proposal) proposal.update(event);
        }
      }
    );

    const lastTabledWasExternal =
      await ChainInfo.api.query.democracy.lastTabledWasExternal();
    const nextExternal = await ChainInfo.api.query.democracy.nextExternal();
    this._lastTabledWasExternal = lastTabledWasExternal.valueOf();
    this._nextExternal = nextExternal.unwrapOr(null);
    this._initialized = true;
    this._initializing = false;
  }

  public async createTx(
    author: AddressAccount,
    action: Call,
    proposalHash: Hash,
    deposit: SubstrateCoin
  ) {
    const txFunc = (api: ApiPromise) =>
      api.tx.democracy.propose(proposalHash, deposit.asBN);
    const title = this._Chain.methodToTitle(action);
    return this._Chain.createTXModalData(
      author,
      txFunc,
      'createDemocracyProposal',
      title
    );
  }

  public notePreimage(
    author: AddressAccount,
    action: Call,
    encodedProposal: string
  ) {
    const title = this._Chain.methodToTitle(action);
    return this._Chain.createTXModalData(
      author,
      (api: ApiPromise) => api.tx.democracy.notePreimage(encodedProposal),
      'notePreimage',
      title
    );
  }

  public noteImminentPreimage(
    author: AddressAccount,
    action: Call,
    encodedProposal: string
  ) {
    const title = this._Chain.methodToTitle(action);
    return this._Chain.createTXModalData(
      author,
      (api: ApiPromise) => api.tx.democracy.notePreimage(encodedProposal),
      'noteImminentPreimage',
      title
    );
  }
}

export default SubstrateDemocracyProposals;
