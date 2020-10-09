import { switchMap, first } from 'rxjs/operators';
import { ApiRx } from '@polkadot/api';
import { BlockNumber, BalanceOf, Balance } from '@polkadot/types/interfaces';
import { IApp } from 'state';
import { IEdgewareSignalingProposal } from 'adapters/chain/edgeware/types';
import { ProposalModule, ChainNetwork } from 'models';
import SubstrateChain from 'controllers/chain/substrate/shared';
import SubstrateAccounts, { SubstrateAccount } from 'controllers/chain/substrate/account';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import { SubstrateTypes } from '@commonwealth/chain-events';
import { EdgewareSignalingProposal } from './signaling_proposal';

class EdgewareSignaling extends ProposalModule<
  ApiRx,
  IEdgewareSignalingProposal,
  EdgewareSignalingProposal
> {
  // How many EDG are bonded in reserve to create a signaling proposal.
  // The bond is returned after voting is moved to the 'completed' stage.
  private _proposalBond: SubstrateCoin = null;
  get proposalBond() {
    return this._proposalBond;
  }

  // The number of blocks signaling proposals are in voting for.
  private _votingPeriod: number = null;
  get votingPeriod() {
    return this._votingPeriod;
  }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;

  constructor(app: IApp) {
    super(app, (e) => new EdgewareSignalingProposal(this._Chain, this._Accounts, this, e));
  }

  public init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts): Promise<void> {
    if (this._initializing || this._initialized || this.disabled) return;
    this._initializing = true;
    this._Chain = ChainInfo;
    this._Accounts = Accounts;

    // load server proposals
    const entities = this.app.chain.chainEntities.store.getByType(SubstrateTypes.EntityKind.SignalingProposal);
    const proposals = entities.map((e) => this._entityConstructor(e));

    return new Promise((resolve, reject) => {
      this._Chain.api.pipe(
        switchMap((api: ApiRx) => api.queryMulti([
          api.query.signaling.proposalCreationBond,
          api.query.signaling.votingLength,
        ])),
        first(),
      ).subscribe(async ([proposalcreationbond, votinglength]: [BalanceOf, BlockNumber]) => {
        // save parameters
        this._votingPeriod = +votinglength;
        this._proposalBond = this._Chain.coins(proposalcreationbond as Balance);

        // fetch proposals from chain
        await this.app.chain.chainEntities.fetchEntities(
          this.app.chain.id,
          this,
          () => this._Chain.fetcher.fetchSignalingProposals(this.app.chain.block.height)
        );

        // register new chain-event handlers
        this.app.chain.chainEntities.registerEntityHandler(
          SubstrateTypes.EntityKind.SignalingProposal, (entity, event) => {
            if (this.initialized) this.updateProposal(entity, event);
          }
        );

        this._initialized = true;
        this._initializing = false;
        resolve();
      },
      (err) => reject(new Error(err)));
    });
  }

  public createTx(
    author: SubstrateAccount,
    title: string,
    description: string,
    voteOutcomes: any[] = [0, 1],
    voteType: 'binary' | 'multioption' | 'rankedchoice' = 'binary',
    tallyType: 'onecoin' | 'oneperson' = 'onecoin',
  ) {
    const vOutcomes = voteOutcomes.map((o) => this._Chain.createType('VoteOutcome', o));
    const vType = this._Chain.createType('VoteType', voteType);
    const tType = this._Chain.createType('TallyType', tallyType);
    return this._Chain.createTXModalData(
      author,
      (api: ApiRx) => api.tx.signaling.createProposal(title, description, vOutcomes, vType, tType),
      'createSignalingProposal',
      title
    );
  }

  public advance(author: SubstrateAccount, proposal: EdgewareSignalingProposal) {
    return this._Chain.createTXModalData(
      author,
      (api: ApiRx) => api.tx.signaling.advanceProposal(proposal.data.hash),
      'advanceSignalingProposal',
      proposal.title
    );
  }
}

export default EdgewareSignaling;
