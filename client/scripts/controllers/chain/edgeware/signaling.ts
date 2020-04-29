import { switchMap, first } from 'rxjs/operators';
import { ApiRx } from '@polkadot/api';
import { BlockNumber, BalanceOf, Balance } from '@polkadot/types/interfaces';

import { IEdgewareSignalingProposal, IEdgewareSignalingProposalState } from 'adapters/chain/edgeware/types';
import { EdgewareSignalingProposalAdapter } from 'adapters/chain/edgeware/subscriptions';
import { ProposalModule, } from 'models';
import { default as SubstrateChain } from 'controllers/chain/substrate/shared';
import SubstrateAccounts, { SubstrateAccount } from 'controllers/chain/substrate/account';
import { SubstrateCoin } from 'shared/adapters/chain/substrate/types';
import { EdgewareSignalingProposal, SignalingProposalStage } from './signaling_proposal';

class EdgewareSignaling extends ProposalModule<
  ApiRx,
  IEdgewareSignalingProposal,
  IEdgewareSignalingProposalState,
  EdgewareSignalingProposal,
  EdgewareSignalingProposalAdapter
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

  public init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts): Promise<void> {
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    return new Promise((resolve, reject) => {
      this._adapter = new EdgewareSignalingProposalAdapter();
      this._Chain.api.pipe(
        switchMap((api: ApiRx) => api.queryMulti([
          api.query.signaling.proposalCreationBond,
          api.query.signaling.votingLength,
        ])),
        first(),
      ).subscribe(([proposalcreationbond, votinglength]: [BalanceOf, BlockNumber]) => {
        // save parameters
        this._votingPeriod = +votinglength;
        this._proposalBond = this._Chain.coins(proposalcreationbond as Balance);

        this._Chain.api.pipe(first()).subscribe((api: ApiRx) => {
          this.initSubscription(
            api,
            (ps) => ps.map((p) => new EdgewareSignalingProposal(ChainInfo, Accounts, this, p))
          ).then(() => {
            this._initialized = true;
            resolve();
          }).catch((err) => {
            reject(err);
          });
        });
      },
      (err) => reject(new Error(err)));
    });
  }

  public createTx(
    author: SubstrateAccount,
    title: string,
    description: string,
    voteOutcomes: any[] = [0, 1],
    voteType: string = 'binary',
    tallyType: string = 'onecoin',
  ) {
    const vOutcomes = (voteOutcomes.length >= 2)
      ? voteOutcomes.map((o) => this._Chain.createType('VoteOutcome', o))
      : null;
    const vType = (voteType === 'binary' || voteType === 'multioption' || voteType === 'rankedchoice')
      ? this._Chain.createType('VoteType', voteType)
      : null;
    const tType = (tallyType === 'onecoin' || tallyType === 'oneperson')
      ? this._Chain.createType('TallyType', tallyType)
      : null;
    if (!vOutcomes || !vType || !tType) return;
    return this._Chain.createTXModalData(
      author,
      (api: ApiRx) => api.tx.signaling.createProposal(title, description, vOutcomes, vType, tType),
      'createSignalingProposal',
      title
    );
  }
  public advance(author: SubstrateAccount, proposal: EdgewareSignalingProposal) {
    if (proposal.stage === SignalingProposalStage.Completed) {
      throw new Error('Proposal already completed');
    }
    if (proposal.data.author !== author.address) {
      throw new Error('Only the original author can advance the proposal');
    }
    return this._Chain.createTXModalData(
      author,
      (api: ApiRx) => api.tx.signaling.advanceProposal(proposal.data.hash),
      'advanceSignalingProposal',
      proposal.title
    );
  }
}

export default EdgewareSignaling;
