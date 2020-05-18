import { switchMap, first } from 'rxjs/operators';
import { ApiRx } from '@polkadot/api';
import { BlockNumber, BalanceOf, Balance } from '@polkadot/types/interfaces';

import { IEdgewareSignalingProposal } from 'adapters/chain/edgeware/types';
import { ProposalModule, ChainEntity, } from 'models';
import { default as SubstrateChain } from 'controllers/chain/substrate/shared';
import SubstrateAccounts, { SubstrateAccount } from 'controllers/chain/substrate/account';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import { SubstrateEntityKind } from 'events/edgeware/types';
import { EdgewareSignalingProposal, SignalingProposalStage } from './signaling_proposal';

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

  protected _entityConstructor(entity: ChainEntity): EdgewareSignalingProposal {
    return new EdgewareSignalingProposal(this._Chain, this._Accounts, this, entity);
  }

  public init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts): Promise<void> {
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    return new Promise((resolve, reject) => {
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

        const entities = this.app.chainEntities.store.getByType(SubstrateEntityKind.SignalingProposal);
        const proposals = entities.map((e) => this._entityConstructor(e));
        this._initialized = true;
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
