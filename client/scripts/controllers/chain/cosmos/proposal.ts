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
import moment from 'moment';
import { CosmosAccount, CosmosAccounts } from './account';
import CosmosChain, { CosmosApiType } from './chain';
import CosmosGovernance, { marshalTally } from './governance';

export const voteToEnum = (voteOption: number | string): CosmosVoteChoice => {
  if (typeof voteOption === 'number') {
    switch (voteOption) {
      case 1: return 'Yes';
      case 2: return 'Abstain';
      case 3: return 'No';
      case 4: return 'NoWithVeto';
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
  CosmosApiType, CosmosToken, ICosmosProposal, CosmosVote
> {
  public get shortIdentifier() {
    return `#${this.identifier.toString()}`;
  }
  public title: string;
  public get description() { return this.data.description; }
  public get author() { return this.data.proposer ? this._Accounts.fromAddress(this.data.proposer) : null; }

  public get votingType() {
    if (this.status === 'DepositPeriod') {
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
    const api = this._Chain.api;
    const [depositResp, voteResp, tallyResp]: [
      GovDepositsResponse, GovVotesResponse, GovTallyResponse
    ] = await Promise.all([
      api.gov.deposits(this.data.identifier),
      this.status === 'DepositPeriod'
        ? Promise.resolve(null)
        : api.gov.votes(this.data.identifier),
      this.status === 'DepositPeriod'
        ? Promise.resolve(null)
        : api.gov.tally(this.data.identifier),
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
    if (depositResp?.result) {
      for (const deposit of depositResp.result) {
        if (deposit.amount && deposit.amount[0]) {
          state.depositors.push([ deposit.depositor, new BN(deposit.amount[0].amount) ]);
        }
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
    if (tallyResp?.result) {
      state.tally = marshalTally(tallyResp.result);
    }
  }

  // TODO: add getters for various vote features: tally, quorum, threshold, veto
  // see: https://blog.chorus.one/an-overview-of-cosmos-hub-governance/
  get support() {
    if (this.status === 'DepositPeriod') {
      return this._Chain.coins(this._totalDeposit);
    }
    if (!this._tally) return 0;
    const nonAbstainingPower = this._tally.no.add(this._tally.noWithVeto).add(this._tally.yes);
    if (nonAbstainingPower.eqn(0)) return 0;
    const ratioPpm = this._tally.yes.muln(1_000_000).div(nonAbstainingPower);
    return +ratioPpm / 1_000_000;
  }
  get turnout() {
    if (this.status === 'DepositPeriod') {
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
    if (this.status === 'DepositPeriod') {
      if (!this.data.depositEndTime) return { kind: 'unavailable' };
      return { kind: 'fixed', time: moment(this.data.depositEndTime) };
    }
    // if in voting period: exactly voting start time + votingTime
    if (!this.data.votingEndTime) return { kind: 'unavailable' };
    return { kind: 'fixed', time: moment(this.data.votingEndTime) };
  }
  get isPassing(): ProposalStatus {
    switch (this.status) {
      case 'Passed':
        return ProposalStatus.Passed;
      case 'Rejected':
        return ProposalStatus.Failed;
      case 'VotingPeriod':
        return (this.support > 0.5 && this.veto <= (1 / 3)) ? ProposalStatus.Passing : ProposalStatus.Failing;
      case 'DepositPeriod':
        return this._totalDeposit.gte(this._Governance.minDeposit) ? ProposalStatus.Passing : ProposalStatus.Failing;
      default:
        return ProposalStatus.None;
    }
  }

  // TRANSACTIONS
  public submitDepositTx(depositor: CosmosAccount, amount: CosmosToken, memo: string = '') {
    if (this.status !== 'DepositPeriod') {
      throw new Error('proposal not in deposit period');
    }
    const args = { proposalId: this.data.identifier, amounts: [amount] };
    const txFn = (gas: number) => this._Chain.tx(
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
    if (this.status !== 'VotingPeriod') {
      throw new Error('proposal not in voting period');
    }
    const args = { proposalId: this.data.identifier, option: vote.choice };
    const txFn = (gas: number) => this._Chain.tx(
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
      voteResp = await this._Chain.api.gov.votes(this.identifier);
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
