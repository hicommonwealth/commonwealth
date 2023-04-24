import type { MsgDepositEncodeObject } from '@cosmjs/stargate';
import BN from 'bn.js';
import { longify } from '@cosmjs/stargate/build/queries/utils';
import {
  QueryDepositsResponseSDKType,
  QueryTallyResultResponseSDKType,
  QueryVotesResponseSDKType,
} from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/query';
import { ProposalType } from 'common-common/src/types';
import type {
  CosmosProposalState,
  CosmosToken,
  CosmosVoteChoice,
  ICosmosProposal,
} from 'controllers/chain/cosmos/types';

import type { ITXModalData, ProposalEndTime } from 'models';
import {
  DepositVote,
  Proposal,
  ProposalStatus,
  VotingType,
  VotingUnit,
} from 'models';
import moment from 'moment';
import CosmosAccount from './account';
import type CosmosAccounts from './accounts';
import type CosmosChain from './chain';
import type { CosmosApiType } from './chain';
import { marshalTallyV1 } from './governance-v1';
import type CosmosGovernanceV1 from './governance-v1';
import { encodeMsgVote } from './helpers';
import { CosmosVote } from './proposal';

const voteToEnumV1 = (voteOption: number | string): CosmosVoteChoice => {
  switch (voteOption) {
    case 'VOTE_OPTION_YES':
      return 'Yes';
    case 'VOTE_OPTION_NO':
      return 'No';
    case 'VOTE_OPTION_ABSTAIN':
      return 'Abstain';
    case 'VOTE_OPTION_NO_WITH_VETO':
      return 'NoWithVeto';
    default:
      return null;
  }
};

export class CosmosProposalV1 extends Proposal<
  CosmosApiType,
  CosmosToken,
  ICosmosProposal,
  CosmosVote
> {
  public get shortIdentifier() {
    return `#${this.identifier.toString()}`;
  }

  public get title() {
    return this.data.title;
  }

  public get description() {
    return this.data.description;
  }

  public get author() {
    return this.data.proposer
      ? this._Accounts.fromAddress(this.data.proposer)
      : null;
  }

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
    // TODO: balance check
    return account instanceof CosmosAccount;
  }

  public get status(): CosmosProposalState {
    return this.data.state.status;
  }

  public get depositorsAsVotes(): Array<DepositVote<CosmosToken>> {
    return this.data.state.depositors.map(
      ([a, n]) =>
        new DepositVote(this._Accounts.fromAddress(a), this._Chain.coins(n))
    );
  }

  private _Chain: CosmosChain;
  private _Accounts: CosmosAccounts;
  private _Governance: CosmosGovernanceV1;

  constructor(
    ChainInfo: CosmosChain,
    Accounts: CosmosAccounts,
    Governance: CosmosGovernanceV1,
    data: ICosmosProposal
  ) {
    super(ProposalType.CosmosProposal, data);
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Governance = Governance;
    this._Governance.store.add(this);
  }

  public update() {
    throw new Error('unimplemented');
  }

  public async init() {
    const lcd = this._Chain.lcd;
    const proposalId = longify(this.data.identifier);
    // only fetch voter data if active
    if (!this.data.state.completed) {
      try {
        const [depositResp, voteResp, tallyResp]: [
          QueryDepositsResponseSDKType,
          QueryVotesResponseSDKType,
          QueryTallyResultResponseSDKType
        ] = await Promise.all([
          this.status === 'DepositPeriod'
            ? lcd.cosmos.gov.v1.deposits({ proposalId })
            : Promise.resolve(null),
          this.status === 'DepositPeriod'
            ? Promise.resolve(null)
            : lcd.cosmos.gov.v1.votes({ proposalId }),
          this.status === 'DepositPeriod'
            ? Promise.resolve(null)
            : lcd.cosmos.gov.v1.tallyResult({ proposalId }),
        ]);
        if (depositResp?.deposits) {
          for (const deposit of depositResp.deposits) {
            if (deposit.amount && deposit.amount[0]) {
              this.data.state.depositors.push([
                deposit.depositor,
                new BN(deposit.amount[0].amount),
              ]);
            }
          }
        }
        if (voteResp) {
          for (const voter of voteResp.votes) {
            const vote = voteToEnumV1(voter.options[0].option);
            if (vote) {
              this.data.state.voters.push([voter.voter, vote]);
              this.addOrUpdateVote(
                new CosmosVote(this._Accounts.fromAddress(voter.voter), vote)
              );
            } else {
              console.error(
                `voter: ${voter.voter} has invalid vote option: ${voter.options[0].option}`
              );
            }
          }
        }
        if (tallyResp?.tally) {
          this.data.state.tally = marshalTallyV1(tallyResp?.tally);
        }
      } catch (err) {
        console.error(`Cosmos query failed: ${err.message}`);
      }
    }
    if (!this.initialized) {
      this._initialized = true;
    }
    if (this.data.state.completed) {
      super.complete(this._Governance.store);
    }
  }

  // TODO: add getters for various vote features: tally, quorum, threshold, veto
  // see: https://blog.chorus.one/an-overview-of-cosmos-hub-governance/
  get support() {
    if (this.status === 'DepositPeriod') {
      return this._Chain.coins(this.data.state.totalDeposit);
    }
    if (!this.data.state.tally) return 0;
    const nonAbstainingPower = this.data.state.tally.no
      .add(this.data.state.tally.noWithVeto)
      .add(this.data.state.tally.yes);
    if (nonAbstainingPower.eqn(0)) return 0;
    const ratioPpm = this.data.state.tally.yes
      .muln(1_000_000)
      .div(nonAbstainingPower);
    return +ratioPpm / 1_000_000;
  }

  get turnout() {
    if (this.status === 'DepositPeriod') {
      if (this.data.state.totalDeposit.eqn(0)) {
        return 0;
      } else {
        const ratioInPpm = +this.data.state.totalDeposit
          .muln(1_000_000)
          .div(this._Chain.staked);
        return +ratioInPpm / 1_000_000;
      }
    }
    if (!this.data.state.tally) return 0;
    // all voters automatically abstain, so we compute turnout as the percent non-abstaining
    const totalVotingPower = this.data.state.tally.no
      .add(this.data.state.tally.noWithVeto)
      .add(this.data.state.tally.yes)
      .add(this.data.state.tally.abstain);
    if (totalVotingPower.eqn(0)) return 0;
    const ratioInPpm = +this.data.state.tally.abstain
      .muln(1_000_000)
      .div(totalVotingPower);
    return 1 - ratioInPpm / 1_000_000;
  }

  get veto() {
    if (!this.data.state.tally) return 0;
    const totalVotingPower = this.data.state.tally.no
      .add(this.data.state.tally.noWithVeto)
      .add(this.data.state.tally.yes)
      .add(this.data.state.tally.abstain);
    if (totalVotingPower.eqn(0)) return 0;
    const ratioInPpm = +this.data.state.tally.noWithVeto
      .muln(1_000_000)
      .div(totalVotingPower);
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
        return this.support > 0.5 && this.veto <= 1 / 3
          ? ProposalStatus.Passing
          : ProposalStatus.Failing;
      case 'DepositPeriod':
        return this.data.state.totalDeposit.gte(this._Governance.minDeposit)
          ? ProposalStatus.Passing
          : ProposalStatus.Failing;
      default:
        return ProposalStatus.None;
    }
  }

  // TRANSACTIONS
  public async submitDepositTx(depositor: CosmosAccount, amount: CosmosToken) {
    if (this.status !== 'DepositPeriod') {
      throw new Error('proposal not in deposit period');
    }
    const cosm = await import('@cosmjs/stargate/build/queries/utils');
    const msg: MsgDepositEncodeObject = {
      typeUrl: '/cosmos.gov.v1beta1.MsgDeposit',
      value: {
        proposalId: cosm.longify(this.data.identifier),
        depositor: depositor.address,
        amount: [amount.toCoinObject()],
      },
    };
    await this._Chain.sendTx(depositor, msg);
    this.data.state.depositors.push([depositor.address, new BN(+amount)]);
  }

  public async voteTx(vote: CosmosVote) {
    if (this.status !== 'VotingPeriod') {
      throw new Error('proposal not in voting period');
    }
    const msg = encodeMsgVote(
      vote.account.address,
      this.data.identifier,
      vote.option
    );

    await this._Chain.sendTx(vote.account, msg);
    this.addOrUpdateVote(vote);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public submitVoteTx(vote: CosmosVote, memo = '', cb?): ITXModalData {
    throw new Error('unsupported');
  }
}
