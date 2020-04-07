import {
  Proposal,
  ITXModalData,
  ProposalEndTime,
  ProposalStatus,
  IVote,
  VotingUnit,
  ProposalModule,
  VotingType,
  DepositVote
} from 'models';
import {
  ICosmosProposal, ICosmosProposalState, CosmosToken, CosmosVoteChoice, CosmosProposalState, ICosmosProposalTally
} from 'adapters/chain/cosmos/types';
import { CosmosProposalAdapter, voteToEnum } from 'adapters/chain/cosmos/subscriptions';
import { CosmosApi } from 'adapters/chain/cosmos/api';
import { of, forkJoin } from 'rxjs';
import { ProposalStore } from 'stores';
import { default as moment } from 'moment-twitter';
import { map, flatMap } from 'rxjs/operators';
import { CosmosAccount, CosmosAccounts } from './account';
import CosmosChain from './chain';

class CosmosGovernance extends ProposalModule<
  CosmosApi,
  ICosmosProposal,
  ICosmosProposalState,
  CosmosProposal,
  CosmosProposalAdapter
> {
  private _votingPeriodNs: number;
  private _yesThreshold: number;
  private _vetoThreshold: number;
  private _penalty: number;
  private _maxDepositPeriodNs: number;
  private _minDeposit: CosmosToken;
  public get votingPeriodNs() { return this._votingPeriodNs; }
  public get yesThreshold() { return this._yesThreshold; }
  public get vetoThreshold() { return this._vetoThreshold; }
  public get penalty() { return this._penalty; }
  public get maxDepositPeriodNs() { return this._maxDepositPeriodNs; }
  public get minDeposit() { return this._minDeposit; }

  private _Chain: CosmosChain;
  private _Accounts: CosmosAccounts;

  public async init(ChainInfo: CosmosChain, Accounts: CosmosAccounts): Promise<void> {
    this._Chain = ChainInfo;
    this._Accounts = Accounts;

    // query chain-wide params
    const [ depositParams, tallyingParams, votingParams ] = await Promise.all([
      this._Chain.api.query.govDepositParameters(),
      this._Chain.api.query.govTallyingParameters(),
      this._Chain.api.query.govVotingParameters(),
    ]);
    this._votingPeriodNs = +votingParams.voting_period;
    this._yesThreshold = +tallyingParams.threshold;
    this._vetoThreshold = +tallyingParams.veto;
    this._penalty = +tallyingParams.governance_penalty;
    this._maxDepositPeriodNs = +depositParams.max_deposit_period;
    this._minDeposit = new CosmosToken(depositParams.min_deposit[0].denom, +depositParams.min_deposit[0].amount);

    // query existing proposals
    return new Promise((resolve, reject) => {
      this._adapter = new CosmosProposalAdapter();
      // TODO: fix test cases with this too
      this.initSubscription(
        this._Chain.api,
        (ps) => ps.map((p) => new CosmosProposal(ChainInfo, Accounts, this, p))
      ).then(() => {
        this._initialized = true;
        resolve();
      }).catch((err) => {
        reject(err);
      });
    });
  }

  // TODO: cosmos-api only supports text proposals and not parameter_change or software_upgrade
  public createTx(
    sender: CosmosAccount, title: string, description: string, initialDeposit: CosmosToken, memo: string = ''
  ): ITXModalData {
    const args = { title, description, initialDeposits: [initialDeposit.toCoinObject()] };
    const txFn = (gas: number) => this._Chain.api.tx(
      'MsgSubmitProposal', sender.address, args, memo, gas, this._Chain.denom
    );
    return this._Chain.createTXModalData(
      sender,
      txFn,
      'MsgSubmitProposal',
      `${sender.address} submits proposal: ${title}.`,
    );
  }
}

export default CosmosGovernance;

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
  CosmosApi, CosmosToken, ICosmosProposal, ICosmosProposalState, CosmosVote
> {
  public get shortIdentifier() {
    return 'COS-' + this.identifier.toString();
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
    return Object.entries(this.depositors).map(([a, n]) =>
      new DepositVote(this._Accounts.fromAddress(a), this._Chain.coins(n)));
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
    this._title = data.title;

    // workaround to avoid fetching all voters for completed proposals
    if (!data.state.completed) {
      this.subscribe(
        of(this._Chain.api), // Temporary of() hack to get around dumb typing
        this._Governance.store,
        this._Governance.adapter,
      );
    } else {
      this.updateState(this._Governance.store, data.state);
    }
    this._Governance.store.add(this);
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
      console.error('could not fetch votes on proposal: ' + this.identifier);
      return;
    }
    if (voteResp) {
      for (const voter of voteResp) {
        const vote = voteToEnum(voter.option);
        if (vote) {
          this.addOrUpdateVote({ account: this._Accounts.fromAddress(voter.voter), choice: vote });
        } else {
          console.error('voter: ' + voter.voter + ' has invalid vote option: ' + voter.option);
        }
      }
    }
  }

  protected updateState(store: ProposalStore<CosmosProposal>, state: ICosmosProposalState) {
    if (!state) return;
    this._status = state.status;
    this._tally = state.tally;
    for (const [ voterAddr, choice ] of state.voters) {
      this.addOrUpdateVote({ account: this._Accounts.fromAddress(voterAddr), choice });
    }
    for (const [ depositor, deposit ] of state.depositors) {
      this._depositors[depositor] = deposit;
    }
    this._totalDeposit = state.totalDeposit;
    super.updateState(store, state);
  }
}
