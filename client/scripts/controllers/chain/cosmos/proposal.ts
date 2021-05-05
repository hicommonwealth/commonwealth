import BN from 'bn.js';
import { GovDepositsResponse, GovTallyResponse, GovVotesResponse } from '@cosmjs/launchpad';
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
} from 'controllers/chain/cosmos/types';
import { ProposalStore } from 'stores';
import moment from 'moment-twitter';

import { CosmosAccount, CosmosAccounts } from './account';
import { CosmosApi } from './api';
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
    return `#${this.identifier.toString()}`;
  }
  public title: string;
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
  private _tally: ICosmosProposalTally;
  private _status: CosmosProposalState;
  public get status(): CosmosProposalState {
    return this._status;
  }

  private _totalDeposit: BN = new BN(0);
  private _depositors: { [depositor: string]: BN } = {};
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

  constructor(ChainInfo: CosmosChain, Accounts: CosmosAccounts, Governance: CosmosGovernance, data: ICosmosProposal) {
    super('cosmosproposal', data);
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Governance = Governance;
    this.title = data.title;

    // workaround to avoid fetching all voters for completed proposals
    if (!data.state.completed) {
      this._initState();
    } else {
      this.updateState(this._Governance.store, data.state);
    }
    this._Governance.store.add(this);
  }

  public update() {
    throw new Error('unimplemented');
  }

  private async _initState() {
    if (this.completed) {
      throw new Error('should not subscribe cosmos proposal state if completed');
    }

    const api = this._Chain.api;
    const [depositResp, voteResp, tallyResp]: [
      GovDepositsResponse, GovVotesResponse, GovTallyResponse
    ] = await Promise.all([
      api.query.gov.deposits(this.data.identifier),
      this.status === CosmosProposalState.DEPOSIT_PERIOD
        ? Promise.resolve(null)
        : api.query.gov.votes(this.data.identifier),
      this.status === CosmosProposalState.DEPOSIT_PERIOD
        ? Promise.resolve(null)
        : api.query.gov.tally(this.data.identifier),
    ]);

    const state: ICosmosProposalState = {
      identifier: this.data.identifier,
      completed: false,
      status: this.status,
      depositors: [],
      totalDeposit: new BN(0),
      voters: [],
      tally: null,
    };
    if (depositResp) {
      for (const deposit of depositResp.result) {
        state.depositors.push([ deposit.depositor, new BN(deposit.amount[0].amount) ]);
      }
    }
    if (voteResp) {
      for (const voter of voteResp.result) {
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
  }

  // TODO: add getters for various vote features: tally, quorum, threshold, veto
  // see: https://blog.chorus.one/an-overview-of-cosmos-hub-governance/
  get support() {
    if (this.status === CosmosProposalState.DEPOSIT_PERIOD) {
      return this._Chain.coins(this._totalDeposit);
    }
    if (!this._tally) return 0;
    const nonAbstainingPower = this._tally.no.add(this._tally.noWithVeto).add(this._tally.yes);
    if (nonAbstainingPower.eqn(0)) return 0;
    const ratioPpm = this._tally.yes.muln(1_000_000).div(nonAbstainingPower);
    return +ratioPpm / 1_000_000;
  }
  get turnout() {
    if (this.status === CosmosProposalState.DEPOSIT_PERIOD) {
      if (this._totalDeposit.eqn(0)) {
        return 0;
      } else {
        const ratioInPpm = +this._totalDeposit.muln(1_000_000).div(this._Chain.staked);
        return +ratioInPpm / 1_000_000;
      }
    }
    if (!this._tally) return 0;
    // all voters automatically abstain, so we compute turnout as the percent non-abstaining
    const totalVotingPower = this._tally.no.add(this._tally.noWithVeto).add(this._tally.yes).add(this._tally.abstain);
    if (totalVotingPower.eqn(0)) return 0;
    const ratioInPpm = +this._tally.abstain.muln(1_000_000).div(totalVotingPower);
    return 1 - (ratioInPpm / 1_000_000);
  }
  get veto() {
    if (!this._tally) return 0;
    const totalVotingPower = this._tally.no.add(this._tally.noWithVeto).add(this._tally.yes).add(this._tally.abstain);
    if (totalVotingPower.eqn(0)) return 0;
    const ratioInPpm = +this._tally.noWithVeto.muln(1_000_000).div(totalVotingPower);
    return ratioInPpm / 1_000_000;
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
        return this._totalDeposit.gte(this._Governance.minDeposit) ? ProposalStatus.Passing : ProposalStatus.Failing;
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

  public submitVoteTx(vote: CosmosVote, memo: string = '', cb?): ITXModalData {
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
      cb
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
    let voteResp: GovVotesResponse;
    try {
      voteResp = await this._Chain.api.query.gov.votes(this.identifier);
    } catch (e) {
      console.error(`could not fetch votes on proposal: ${this.identifier}`);
      return;
    }
    if (voteResp) {
      for (const voter of voteResp.result) {
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
      this._initialized = true;
    }
    this._status = state.status;
    this._tally = state.tally;
    for (const [ voterAddr, choice ] of state.voters) {
      this.addOrUpdateVote({ account: this._Accounts.fromAddress(voterAddr), choice });
    }
    for (const [ depositor, deposit ] of state.depositors) {
      this._depositors[depositor] = deposit;
    }
    this._totalDeposit = state.totalDeposit;
    if (state.completed) {
      super.complete(store);
    }
  }
}
