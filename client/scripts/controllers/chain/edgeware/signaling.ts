import { switchMap, first } from 'rxjs/operators';
import { ApiRx } from '@polkadot/api';
import { BlockNumber, BalanceOf, Balance } from '@polkadot/types/interfaces';

import { IEdgewareSignalingProposal } from 'adapters/chain/edgeware/types';
import { ProposalModule } from 'models';
import SubstrateChain from 'controllers/chain/substrate/shared';
import SubstrateAccounts, { SubstrateAccount } from 'controllers/chain/substrate/account';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import { SubstrateTypes } from '@commonwealth/chain-events';
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

        const entities = this.app.chain.chainEntities.store.getByType(SubstrateTypes.EntityKind.SignalingProposal);
        const constructorFunc = (e) => new EdgewareSignalingProposal(this._Chain, this._Accounts, this, e);
        const proposals = entities.map((e) => this._entityConstructor(constructorFunc, e));
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
