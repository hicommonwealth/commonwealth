import {
  Proposal,
  ITXModalData,
  ProposalEndTime,
  ProposalStatus,
  IVote,
  VotingUnit,
  VotingType,
  DepositVote
} from 'models';
import {
  ICosmosProposal, ICosmosProposalState, CosmosToken, CosmosVoteChoice, CosmosProposalState, ICosmosProposalTally
} from 'adapters/chain/cosmos/types';
import { CosmosApi } from 'adapters/chain/cosmos/api';
import { Unsubscribable, BehaviorSubject } from 'rxjs';
import { filter, takeWhile } from 'rxjs/operators';
import { ProposalStore } from 'stores';
import { default as moment } from 'moment-twitter';
import { CosmosAccount, CosmosAccounts } from './account';
import CosmosChain from './chain';
import CosmosGovernance, { marshalTally } from './governance';

export const voteToEnum = (voteOption: number | string): CosmosVoteChoice => {
  if (typeof voteOption === 'number') {
    switch (voteOption) {
      case 1: return CosmosVoteChoice.YES;
      case 2: return CosmosVoteChoice.ABSTAIN;
      case 3: return CosmosVoteChoice.NO;
      case 4: return CosmosVoteChoice.VETO;
      default: return null;
    }
  } else {
    return voteOption as CosmosVoteChoice;
  }
};

// TODO: add staking amount to this?
export class CosmosVote implements IVote<CosmosToken> {
  public readonly account: CosmosAccount;
  public readonly choice: CosmosVoteChoice;
  constructor(account: CosmosAccount, choice: CosmosVoteChoice) {
    this.account = account;
    this.choice = choice;
  }
}

export class CosmosProposal extends Proposal<
  CosmosApi, CosmosToken, ICosmosProposal, CosmosVote
> {
  public get shortIdentifier() {
    return `COS-${this.identifier.toString()}`;
  }
  public get title() { return this._title; }
  public get description() { return this.data.description; }
  public get author() { return this.data.proposer ? this._Accounts.fromAddress(this.data.proposer) : null; }

  public get votingType() {
    if (this.status === CosmosProposalState.DEPOSIT_PERIOD) {
      return VotingType.SimpleYesApprovalVoting;
    }
    return VotingType.YesNoAbstainVeto;
  }
  public get votingUnit() {
    return VotingUnit.CoinVote;
  }
  public canVoteFrom(account) {
    return account instanceof CosmosAccount;
  }
  private readonly _title: string;
  private _tally: ICosmosProposalTally;
  private _status: CosmosProposalState;
  public get status(): CosmosProposalState {
    return this._status;
  }

  private _totalDeposit: number = 0;
  private _depositors: { [depositor: string]: number } = {};
  public get depositors() {
    return this._depositors;
  }
  public get depositorsAsVotes(): Array<DepositVote<CosmosToken>> {
    return Object.entries(this.depositors).map(([a, n]) => new DepositVote(
      this._Accounts.fromAddress(a),
      this._Chain.coins(n)
    ));
  }

  private _Chain: CosmosChain;
  private _Accounts: CosmosAccounts;
  private _Governance: CosmosGovernance;
  private _completedVotesFetched: boolean = false;

  private _stateSubscription: Unsubscribable;

  constructor(ChainInfo: CosmosChain, Accounts: CosmosAccounts, Governance: CosmosGovernance, data: ICosmosProposal) {
    super('cosmosproposal', data);
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Governance = Governance;
    this._title = data.title;

    // workaround to avoid fetching all voters for completed proposals
    if (!data.state.completed) {
      this._stateSubscription = this._subscribeState();
    } else {
      this.updateState(this._Governance.store, data.state);
    }
    this._Governance.store.add(this);
  }

  public update() {
    throw new Error('unimplemented');
  }

  private _subscribeState() {
    if (this.completed) {
      throw new Error('should not subscribe cosmos proposal state if completed');
    }
    const subject = new BehaviorSubject<ICosmosProposalState>(null);
    const api = this._Chain.api;
    // TODO: observe real-time events here re: proposal
    Promise.all([
      api.query.proposalDeposits(this.data.identifier),
      this.status === CosmosProposalState.DEPOSIT_PERIOD
        ? Promise.resolve(null)
        : api.query.proposalVotes(this.data.identifier),
      this.status === CosmosProposalState.DEPOSIT_PERIOD
        ? Promise.resolve(null)
        : api.query.proposalTally(this.data.identifier),
    ]).then(([depositResp, voteResp, tallyResp]) => {
      const state: ICosmosProposalState = {
        identifier: this.data.identifier,
        completed: false,
        status: this.status,
        depositors: [],
        totalDeposit: 0,
        voters: [],
        tally: null,
      };
      if (depositResp) {
        // eslint-disable-next-line no-restricted-syntax
        for (const deposit of depositResp) {
          state.depositors.push([ deposit.depositor, deposit.amount.amount ]);
        }
      }
      if (voteResp) {
        // eslint-disable-next-line no-restricted-syntax
        for (const voter of voteResp) {
          const vote = voteToEnum(voter.option);
          if (vote) {
            state.voters.push([ voter.voter, vote ]);
          } else {
            console.error(`voter: ${voter.voter} has invalid vote option: ${voter.option}`);
          }
        }
      }
      if (tallyResp) {
        state.tally = marshalTally(tallyResp);
      }
      subject.next(state);

      // init stream listeners for updates
      if (state.status === CosmosProposalState.DEPOSIT_PERIOD) {
        api.observeEvent('MsgDeposit').pipe(
          filter(({ msg }) => msg.value.proposal_id.toString() === this.data.identifier),
          takeWhile(() => !state.completed),
        ).subscribe(async ({ msg: deposit }) => {
          state.depositors.push([ deposit.value.sender, deposit.value.amount.amount ]);
          state.totalDeposit += +deposit.value.amount.amount;
          subject.next(state);
        });
      }

      // keep vote subscription open even during deposit period in case
      // the proposal goes into voting stage -- we can identify this and
      // shift the type
      api.observeEvent('MsgVote').pipe(
        filter(({ msg }) => msg.value.proposal_id.toString() === this.data.identifier),
        takeWhile(() => !state.completed),
      ).subscribe(async ({ msg: voter }) => {
        const vote = voteToEnum(voter.value.option);
        const voterAddress = voter.value.voter || voter.value.sender;
        if (!vote) {
          console.error(`voter: ${voterAddress} has invalid vote option: ${voter.value.option}`);
        }
        const voterIdx = state.voters.findIndex(([v]) => v === voterAddress);
        if (voterIdx === -1) {
          // new voter
          state.voters.push([ voterAddress, vote ]);
        } else {
          state.voters[voterIdx][1] = vote;
        }
        const tallyRespEvt = await api.query.proposalTally(this.data.identifier);
        if (tallyRespEvt) state.tally = marshalTally(tallyRespEvt);
        subject.next(state);
      });
    }).catch((err) => {
      console.log(`error fetching state for proposal ${this.data.identifier}, err: ${err}`);
    });
    const obs = subject.asObservable();
    return obs.subscribe((state) => {
      this.updateState(this._Governance.store, state);
    });
  }

  // TODO: add getters for various vote features: tally, quorum, threshold, veto
  // see: https://blog.chorus.one/an-overview-of-cosmos-hub-governance/
  get support() {
    if (this.status === CosmosProposalState.DEPOSIT_PERIOD) {
      return this._totalDeposit;
    }
    if (!this._tally) return 0;
    const nonAbstainingPower = this._tally.no + this._tally.noWithVeto + this._tally.yes;
    if (nonAbstainingPower === 0) return 0;
    return this._tally.yes / nonAbstainingPower;
  }
  get turnout() {
    if (this.status === CosmosProposalState.DEPOSIT_PERIOD) {
      if (this._totalDeposit === 0) {
        return 0;
      } else {
        return this._totalDeposit / this._Chain.staked;
      }
    }
    if (!this._tally) return 0;
    // all voters automatically abstain, so we compute turnout as the percent non-abstaining
    const totalVotingPower = this._tally.no + this._tally.noWithVeto + this._tally.yes + this._tally.abstain;
    if (totalVotingPower === 0) return 0;
    return 1 - (this._tally.abstain / totalVotingPower);
  }
  get veto() {
    if (!this._tally) return 0;
    const totalVotingPower = this._tally.no + this._tally.noWithVeto + this._tally.yes + this._tally.abstain;
    if (totalVotingPower === 0) return 0;
    return this._tally.noWithVeto / totalVotingPower;
  }
  get endTime(): ProposalEndTime {
    // if in deposit period: at most create time + maxDepositTime
    if (this.status === CosmosProposalState.DEPOSIT_PERIOD) {
      if (!this.data.depositEndTime) return { kind: 'unavailable' };
      return { kind: 'fixed', time: moment(this.data.depositEndTime) };
    }
    // if in voting period: exactly voting start time + votingTime
    if (!this.data.votingEndTime) return { kind: 'unavailable' };
    return { kind: 'fixed', time: moment(this.data.votingEndTime) };
  }
  get isPassing(): ProposalStatus {
    switch (this.status) {
      case CosmosProposalState.PASSED:
        return ProposalStatus.Passed;
      case CosmosProposalState.REJECTED:
        return ProposalStatus.Failed;
      case CosmosProposalState.VOTING_PERIOD:
        return (this.support > 0.5 && this.veto <= (1 / 3)) ? ProposalStatus.Passing : ProposalStatus.Failing;
      case CosmosProposalState.DEPOSIT_PERIOD:
        return this._totalDeposit >= +this._Governance.minDeposit ? ProposalStatus.Passing : ProposalStatus.Failing;
      default:
        return ProposalStatus.None;
    }
  }

  // TRANSACTIONS
  public submitDepositTx(depositor: CosmosAccount, amount: CosmosToken, memo: string = '') {
    if (this.status !== CosmosProposalState.DEPOSIT_PERIOD) {
      throw new Error('proposal not in deposit period');
    }
    const args = { proposalId: this.data.identifier, amounts: [amount] };
    const txFn = (gas: number) => this._Chain.api.tx(
      'MsgDeposit', depositor.address, args, memo, gas, this._Chain.denom,
    );
    return this._Chain.createTXModalData(
      depositor,
      txFn,
      'MsgDeposit',
      `${depositor.address} deposited ${amount.toNumber} to proposal ${this.data.identifier}`,
    );
  }

  public submitVoteTx(vote: CosmosVote, memo: string = ''): ITXModalData {
    if (this.status !== CosmosProposalState.VOTING_PERIOD) {
      throw new Error('proposal not in voting period');
    }
    const args = { proposalId: this.data.identifier, option: vote.choice };
    const txFn = (gas: number) => this._Chain.api.tx(
      'MsgVote', vote.account.address, args, memo, gas, this._Chain.denom,
    );
    return this._Chain.createTXModalData(
      vote.account,
      txFn,
      'MsgVote',
      `${vote.account} voted ${vote.choice} on proposal ${this.data.identifier}`,
    );
  }

  // fetches all votes on a completed proposal -- active proposal are automatically kept updated
  // with votes.
  public async fetchVotes() {
    if (!this.completed) {
      throw new Error('tried to fetch votes on active proposal!');
    }
    if (this._completedVotesFetched) {
      // votes already fetched
      return;
    }
    this._completedVotesFetched = true;
    let voteResp;
    try {
      voteResp = await this._Chain.api.query.proposalVotes(this.identifier);
    } catch (e) {
      console.error(`could not fetch votes on proposal: ${this.identifier}`);
      return;
    }
    if (voteResp) {
      // eslint-disable-next-line no-restricted-syntax
      for (const voter of voteResp) {
        const vote = voteToEnum(voter.option);
        if (vote) {
          this.addOrUpdateVote({ account: this._Accounts.fromAddress(voter.voter), choice: vote });
        } else {
          console.error(`voter: ${voter.voter} has invalid vote option: ${voter.option}`);
        }
      }
    }
  }

  protected updateState(store: ProposalStore<CosmosProposal>, state: ICosmosProposalState) {
    if (!state) return;
    if (!this.initialized) {
      this._initialized.next(true);
    }
    this._status = state.status;
    this._tally = state.tally;
    // eslint-disable-next-line no-restricted-syntax
    for (const [ voterAddr, choice ] of state.voters) {
      this.addOrUpdateVote({ account: this._Accounts.fromAddress(voterAddr), choice });
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const [ depositor, deposit ] of state.depositors) {
      this._depositors[depositor] = deposit;
    }
    this._totalDeposit = state.totalDeposit;
    if (state.completed) {
      super.complete(store);
    } else {
      store.update(this);
    }
  }
}
