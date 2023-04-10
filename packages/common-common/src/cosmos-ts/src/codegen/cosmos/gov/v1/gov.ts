import { Coin, CoinSDKType } from '../../base/v1beta1/coin';
import { Any, AnySDKType } from '../../../google/protobuf/any';
import {
  Timestamp,
  TimestampSDKType,
} from '../../../google/protobuf/timestamp';
import { Duration, DurationSDKType } from '../../../google/protobuf/duration';
import * as _m0 from 'protobufjs/minimal';
import {
  isSet,
  Long,
  fromJsonTimestamp,
  fromTimestamp,
} from '../../../helpers';
/** VoteOption enumerates the valid vote options for a given governance proposal. */

export enum VoteOption {
  /** VOTE_OPTION_UNSPECIFIED - VOTE_OPTION_UNSPECIFIED defines a no-op vote option. */
  VOTE_OPTION_UNSPECIFIED = 0,

  /** VOTE_OPTION_YES - VOTE_OPTION_YES defines a yes vote option. */
  VOTE_OPTION_YES = 1,

  /** VOTE_OPTION_ABSTAIN - VOTE_OPTION_ABSTAIN defines an abstain vote option. */
  VOTE_OPTION_ABSTAIN = 2,

  /** VOTE_OPTION_NO - VOTE_OPTION_NO defines a no vote option. */
  VOTE_OPTION_NO = 3,

  /** VOTE_OPTION_NO_WITH_VETO - VOTE_OPTION_NO_WITH_VETO defines a no with veto vote option. */
  VOTE_OPTION_NO_WITH_VETO = 4,
  UNRECOGNIZED = -1,
}
/** VoteOption enumerates the valid vote options for a given governance proposal. */

export enum VoteOptionSDKType {
  /** VOTE_OPTION_UNSPECIFIED - VOTE_OPTION_UNSPECIFIED defines a no-op vote option. */
  VOTE_OPTION_UNSPECIFIED = 0,

  /** VOTE_OPTION_YES - VOTE_OPTION_YES defines a yes vote option. */
  VOTE_OPTION_YES = 1,

  /** VOTE_OPTION_ABSTAIN - VOTE_OPTION_ABSTAIN defines an abstain vote option. */
  VOTE_OPTION_ABSTAIN = 2,

  /** VOTE_OPTION_NO - VOTE_OPTION_NO defines a no vote option. */
  VOTE_OPTION_NO = 3,

  /** VOTE_OPTION_NO_WITH_VETO - VOTE_OPTION_NO_WITH_VETO defines a no with veto vote option. */
  VOTE_OPTION_NO_WITH_VETO = 4,
  UNRECOGNIZED = -1,
}
export function voteOptionFromJSON(object: any): VoteOption {
  switch (object) {
    case 0:
    case 'VOTE_OPTION_UNSPECIFIED':
      return VoteOption.VOTE_OPTION_UNSPECIFIED;

    case 1:
    case 'VOTE_OPTION_YES':
      return VoteOption.VOTE_OPTION_YES;

    case 2:
    case 'VOTE_OPTION_ABSTAIN':
      return VoteOption.VOTE_OPTION_ABSTAIN;

    case 3:
    case 'VOTE_OPTION_NO':
      return VoteOption.VOTE_OPTION_NO;

    case 4:
    case 'VOTE_OPTION_NO_WITH_VETO':
      return VoteOption.VOTE_OPTION_NO_WITH_VETO;

    case -1:
    case 'UNRECOGNIZED':
    default:
      return VoteOption.UNRECOGNIZED;
  }
}
export function voteOptionToJSON(object: VoteOption): string {
  switch (object) {
    case VoteOption.VOTE_OPTION_UNSPECIFIED:
      return 'VOTE_OPTION_UNSPECIFIED';

    case VoteOption.VOTE_OPTION_YES:
      return 'VOTE_OPTION_YES';

    case VoteOption.VOTE_OPTION_ABSTAIN:
      return 'VOTE_OPTION_ABSTAIN';

    case VoteOption.VOTE_OPTION_NO:
      return 'VOTE_OPTION_NO';

    case VoteOption.VOTE_OPTION_NO_WITH_VETO:
      return 'VOTE_OPTION_NO_WITH_VETO';

    case VoteOption.UNRECOGNIZED:
    default:
      return 'UNRECOGNIZED';
  }
}
/** ProposalStatus enumerates the valid statuses of a proposal. */

export enum ProposalStatus {
  /** PROPOSAL_STATUS_UNSPECIFIED - PROPOSAL_STATUS_UNSPECIFIED defines the default proposal status. */
  PROPOSAL_STATUS_UNSPECIFIED = 0,

  /**
   * PROPOSAL_STATUS_DEPOSIT_PERIOD - PROPOSAL_STATUS_DEPOSIT_PERIOD defines a proposal status during the deposit
   * period.
   */
  PROPOSAL_STATUS_DEPOSIT_PERIOD = 1,

  /**
   * PROPOSAL_STATUS_VOTING_PERIOD - PROPOSAL_STATUS_VOTING_PERIOD defines a proposal status during the voting
   * period.
   */
  PROPOSAL_STATUS_VOTING_PERIOD = 2,

  /**
   * PROPOSAL_STATUS_PASSED - PROPOSAL_STATUS_PASSED defines a proposal status of a proposal that has
   * passed.
   */
  PROPOSAL_STATUS_PASSED = 3,

  /**
   * PROPOSAL_STATUS_REJECTED - PROPOSAL_STATUS_REJECTED defines a proposal status of a proposal that has
   * been rejected.
   */
  PROPOSAL_STATUS_REJECTED = 4,

  /**
   * PROPOSAL_STATUS_FAILED - PROPOSAL_STATUS_FAILED defines a proposal status of a proposal that has
   * failed.
   */
  PROPOSAL_STATUS_FAILED = 5,
  UNRECOGNIZED = -1,
}
/** ProposalStatus enumerates the valid statuses of a proposal. */

export enum ProposalStatusSDKType {
  /** PROPOSAL_STATUS_UNSPECIFIED - PROPOSAL_STATUS_UNSPECIFIED defines the default proposal status. */
  PROPOSAL_STATUS_UNSPECIFIED = 0,

  /**
   * PROPOSAL_STATUS_DEPOSIT_PERIOD - PROPOSAL_STATUS_DEPOSIT_PERIOD defines a proposal status during the deposit
   * period.
   */
  PROPOSAL_STATUS_DEPOSIT_PERIOD = 1,

  /**
   * PROPOSAL_STATUS_VOTING_PERIOD - PROPOSAL_STATUS_VOTING_PERIOD defines a proposal status during the voting
   * period.
   */
  PROPOSAL_STATUS_VOTING_PERIOD = 2,

  /**
   * PROPOSAL_STATUS_PASSED - PROPOSAL_STATUS_PASSED defines a proposal status of a proposal that has
   * passed.
   */
  PROPOSAL_STATUS_PASSED = 3,

  /**
   * PROPOSAL_STATUS_REJECTED - PROPOSAL_STATUS_REJECTED defines a proposal status of a proposal that has
   * been rejected.
   */
  PROPOSAL_STATUS_REJECTED = 4,

  /**
   * PROPOSAL_STATUS_FAILED - PROPOSAL_STATUS_FAILED defines a proposal status of a proposal that has
   * failed.
   */
  PROPOSAL_STATUS_FAILED = 5,
  UNRECOGNIZED = -1,
}
export function proposalStatusFromJSON(object: any): ProposalStatus {
  switch (object) {
    case 0:
    case 'PROPOSAL_STATUS_UNSPECIFIED':
      return ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED;

    case 1:
    case 'PROPOSAL_STATUS_DEPOSIT_PERIOD':
      return ProposalStatus.PROPOSAL_STATUS_DEPOSIT_PERIOD;

    case 2:
    case 'PROPOSAL_STATUS_VOTING_PERIOD':
      return ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD;

    case 3:
    case 'PROPOSAL_STATUS_PASSED':
      return ProposalStatus.PROPOSAL_STATUS_PASSED;

    case 4:
    case 'PROPOSAL_STATUS_REJECTED':
      return ProposalStatus.PROPOSAL_STATUS_REJECTED;

    case 5:
    case 'PROPOSAL_STATUS_FAILED':
      return ProposalStatus.PROPOSAL_STATUS_FAILED;

    case -1:
    case 'UNRECOGNIZED':
    default:
      return ProposalStatus.UNRECOGNIZED;
  }
}
export function proposalStatusToJSON(object: ProposalStatus): string {
  switch (object) {
    case ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED:
      return 'PROPOSAL_STATUS_UNSPECIFIED';

    case ProposalStatus.PROPOSAL_STATUS_DEPOSIT_PERIOD:
      return 'PROPOSAL_STATUS_DEPOSIT_PERIOD';

    case ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD:
      return 'PROPOSAL_STATUS_VOTING_PERIOD';

    case ProposalStatus.PROPOSAL_STATUS_PASSED:
      return 'PROPOSAL_STATUS_PASSED';

    case ProposalStatus.PROPOSAL_STATUS_REJECTED:
      return 'PROPOSAL_STATUS_REJECTED';

    case ProposalStatus.PROPOSAL_STATUS_FAILED:
      return 'PROPOSAL_STATUS_FAILED';

    case ProposalStatus.UNRECOGNIZED:
    default:
      return 'UNRECOGNIZED';
  }
}
/** WeightedVoteOption defines a unit of vote for vote split. */

export interface WeightedVoteOption {
  /** option defines the valid vote options, it must not contain duplicate vote options. */
  option: VoteOption;
  /** weight is the vote weight associated with the vote option. */

  weight: string;
}
/** WeightedVoteOption defines a unit of vote for vote split. */

export interface WeightedVoteOptionSDKType {
  /** option defines the valid vote options, it must not contain duplicate vote options. */
  option: VoteOptionSDKType;
  /** weight is the vote weight associated with the vote option. */

  weight: string;
}
/**
 * Deposit defines an amount deposited by an account address to an active
 * proposal.
 */

export interface Deposit {
  /** proposal_id defines the unique id of the proposal. */
  proposalId: Long;
  /** depositor defines the deposit addresses from the proposals. */

  depositor: string;
  /** amount to be deposited by depositor. */

  amount: Coin[];
}
/**
 * Deposit defines an amount deposited by an account address to an active
 * proposal.
 */

export interface DepositSDKType {
  /** proposal_id defines the unique id of the proposal. */
  proposal_id: Long;
  /** depositor defines the deposit addresses from the proposals. */

  depositor: string;
  /** amount to be deposited by depositor. */

  amount: CoinSDKType[];
}
/** Proposal defines the core field members of a governance proposal. */

export interface Proposal {
  /** id defines the unique id of the proposal. */
  id: Long;
  /** messages are the arbitrary messages to be executed if the proposal passes. */

  messages: Any[];
  /** status defines the proposal status. */

  status: ProposalStatus;
  /**
   * final_tally_result is the final tally result of the proposal. When
   * querying a proposal via gRPC, this field is not populated until the
   * proposal's voting period has ended.
   */

  finalTallyResult?: TallyResult;
  /** submit_time is the time of proposal submission. */

  submitTime?: Timestamp;
  /** deposit_end_time is the end time for deposition. */

  depositEndTime?: Timestamp;
  /** total_deposit is the total deposit on the proposal. */

  totalDeposit: Coin[];
  /** voting_start_time is the starting time to vote on a proposal. */

  votingStartTime?: Timestamp;
  /** voting_end_time is the end time of voting on a proposal. */

  votingEndTime?: Timestamp;
  /** metadata is any arbitrary metadata attached to the proposal. */

  metadata: string;
  /**
   * title is the title of the proposal
   *
   * Since: cosmos-sdk 0.47
   */

  title: string;
  /**
   * summary is a short summary of the proposal
   *
   * Since: cosmos-sdk 0.47
   */

  summary: string;
  /**
   * proposer is the address of the proposal sumbitter
   *
   * Since: cosmos-sdk 0.47
   */

  proposer: string;
  /**
   * expedited defines if the proposal is expedited
   *
   * Since: cosmos-sdk 0.48
   */

  expedited: boolean;
}
/** Proposal defines the core field members of a governance proposal. */

export interface ProposalSDKType {
  /** id defines the unique id of the proposal. */
  id: Long;
  /** messages are the arbitrary messages to be executed if the proposal passes. */

  messages: AnySDKType[];
  /** status defines the proposal status. */

  status: ProposalStatusSDKType;
  /**
   * final_tally_result is the final tally result of the proposal. When
   * querying a proposal via gRPC, this field is not populated until the
   * proposal's voting period has ended.
   */

  final_tally_result?: TallyResultSDKType;
  /** submit_time is the time of proposal submission. */

  submit_time?: TimestampSDKType;
  /** deposit_end_time is the end time for deposition. */

  deposit_end_time?: TimestampSDKType;
  /** total_deposit is the total deposit on the proposal. */

  total_deposit: CoinSDKType[];
  /** voting_start_time is the starting time to vote on a proposal. */

  voting_start_time?: TimestampSDKType;
  /** voting_end_time is the end time of voting on a proposal. */

  voting_end_time?: TimestampSDKType;
  /** metadata is any arbitrary metadata attached to the proposal. */

  metadata: string;
  /**
   * title is the title of the proposal
   *
   * Since: cosmos-sdk 0.47
   */

  title: string;
  /**
   * summary is a short summary of the proposal
   *
   * Since: cosmos-sdk 0.47
   */

  summary: string;
  /**
   * proposer is the address of the proposal sumbitter
   *
   * Since: cosmos-sdk 0.47
   */

  proposer: string;
  /**
   * expedited defines if the proposal is expedited
   *
   * Since: cosmos-sdk 0.48
   */

  expedited: boolean;
}
/** TallyResult defines a standard tally for a governance proposal. */

export interface TallyResult {
  /** yes_count is the number of yes votes on a proposal. */
  yesCount: string;
  /** abstain_count is the number of abstain votes on a proposal. */

  abstainCount: string;
  /** no_count is the number of no votes on a proposal. */

  noCount: string;
  /** no_with_veto_count is the number of no with veto votes on a proposal. */

  noWithVetoCount: string;
}
/** TallyResult defines a standard tally for a governance proposal. */

export interface TallyResultSDKType {
  /** yes_count is the number of yes votes on a proposal. */
  yes_count: string;
  /** abstain_count is the number of abstain votes on a proposal. */

  abstain_count: string;
  /** no_count is the number of no votes on a proposal. */

  no_count: string;
  /** no_with_veto_count is the number of no with veto votes on a proposal. */

  no_with_veto_count: string;
}
/**
 * Vote defines a vote on a governance proposal.
 * A Vote consists of a proposal ID, the voter, and the vote option.
 */

export interface Vote {
  /** proposal_id defines the unique id of the proposal. */
  proposalId: Long;
  /** voter is the voter address of the proposal. */

  voter: string;
  /** options is the weighted vote options. */

  options: WeightedVoteOption[];
  /** metadata is any  arbitrary metadata to attached to the vote. */

  metadata: string;
}
/**
 * Vote defines a vote on a governance proposal.
 * A Vote consists of a proposal ID, the voter, and the vote option.
 */

export interface VoteSDKType {
  /** proposal_id defines the unique id of the proposal. */
  proposal_id: Long;
  /** voter is the voter address of the proposal. */

  voter: string;
  /** options is the weighted vote options. */

  options: WeightedVoteOptionSDKType[];
  /** metadata is any  arbitrary metadata to attached to the vote. */

  metadata: string;
}
/** DepositParams defines the params for deposits on governance proposals. */

/** @deprecated */

export interface DepositParams {
  /** Minimum deposit for a proposal to enter voting period. */
  minDeposit: Coin[];
  /**
   * Maximum period for Atom holders to deposit on a proposal. Initial value: 2
   * months.
   */

  maxDepositPeriod?: Duration;
}
/** DepositParams defines the params for deposits on governance proposals. */

/** @deprecated */

export interface DepositParamsSDKType {
  /** Minimum deposit for a proposal to enter voting period. */
  min_deposit: CoinSDKType[];
  /**
   * Maximum period for Atom holders to deposit on a proposal. Initial value: 2
   * months.
   */

  max_deposit_period?: DurationSDKType;
}
/** VotingParams defines the params for voting on governance proposals. */

/** @deprecated */

export interface VotingParams {
  /** Duration of the voting period. */
  votingPeriod?: Duration;
}
/** VotingParams defines the params for voting on governance proposals. */

/** @deprecated */

export interface VotingParamsSDKType {
  /** Duration of the voting period. */
  voting_period?: DurationSDKType;
}
/** TallyParams defines the params for tallying votes on governance proposals. */

/** @deprecated */

export interface TallyParams {
  /**
   * Minimum percentage of total stake needed to vote for a result to be
   * considered valid.
   */
  quorum: string;
  /** Minimum proportion of Yes votes for proposal to pass. Default value: 0.5. */

  threshold: string;
  /**
   * Minimum value of Veto votes to Total votes ratio for proposal to be
   * vetoed. Default value: 1/3.
   */

  vetoThreshold: string;
}
/** TallyParams defines the params for tallying votes on governance proposals. */

/** @deprecated */

export interface TallyParamsSDKType {
  /**
   * Minimum percentage of total stake needed to vote for a result to be
   * considered valid.
   */
  quorum: string;
  /** Minimum proportion of Yes votes for proposal to pass. Default value: 0.5. */

  threshold: string;
  /**
   * Minimum value of Veto votes to Total votes ratio for proposal to be
   * vetoed. Default value: 1/3.
   */

  veto_threshold: string;
}
/**
 * Params defines the parameters for the x/gov module.
 *
 * Since: cosmos-sdk 0.47
 */

export interface Params {
  /** Minimum deposit for a proposal to enter voting period. */
  minDeposit: Coin[];
  /**
   * Maximum period for Atom holders to deposit on a proposal. Initial value: 2
   * months.
   */

  maxDepositPeriod?: Duration;
  /** Duration of the voting period. */

  votingPeriod?: Duration;
  /**
   * Minimum percentage of total stake needed to vote for a result to be
   *  considered valid.
   */

  quorum: string;
  /** Minimum proportion of Yes votes for proposal to pass. Default value: 0.5. */

  threshold: string;
  /**
   * Minimum value of Veto votes to Total votes ratio for proposal to be
   *  vetoed. Default value: 1/3.
   */

  vetoThreshold: string;
  /** The ratio representing the proportion of the deposit value that must be paid at proposal submission. */

  minInitialDepositRatio: string;
  /**
   * The cancel ratio which will not be returned back to the depositors when a proposal is cancelled.
   *
   * Since: cosmos-sdk 0.48
   */

  proposalCancelRatio: string;
  /**
   * The address which will receive (proposal_cancel_ratio * deposit) proposal deposits.
   * If empty, the (proposal_cancel_ratio * deposit) proposal deposits will be burned.
   *
   * Since: cosmos-sdk 0.48
   */

  proposalCancelDest: string;
  /**
   * Duration of the voting period of an expedited proposal.
   *
   * Since: cosmos-sdk 0.48
   */

  expeditedVotingPeriod?: Duration;
  /**
   * Minimum proportion of Yes votes for proposal to pass. Default value: 0.67.
   *
   * Since: cosmos-sdk 0.48
   */

  expeditedThreshold: string;
  /** Minimum expedited deposit for a proposal to enter voting period. */

  expeditedMinDeposit: Coin[];
  /** burn deposits if a proposal does not meet quorum */

  burnVoteQuorum: boolean;
  /** burn deposits if the proposal does not enter voting period */

  burnProposalDepositPrevote: boolean;
  /** burn deposits if quorum with vote type no_veto is met */

  burnVoteVeto: boolean;
}
/**
 * Params defines the parameters for the x/gov module.
 *
 * Since: cosmos-sdk 0.47
 */

export interface ParamsSDKType {
  /** Minimum deposit for a proposal to enter voting period. */
  min_deposit: CoinSDKType[];
  /**
   * Maximum period for Atom holders to deposit on a proposal. Initial value: 2
   * months.
   */

  max_deposit_period?: DurationSDKType;
  /** Duration of the voting period. */

  voting_period?: DurationSDKType;
  /**
   * Minimum percentage of total stake needed to vote for a result to be
   *  considered valid.
   */

  quorum: string;
  /** Minimum proportion of Yes votes for proposal to pass. Default value: 0.5. */

  threshold: string;
  /**
   * Minimum value of Veto votes to Total votes ratio for proposal to be
   *  vetoed. Default value: 1/3.
   */

  veto_threshold: string;
  /** The ratio representing the proportion of the deposit value that must be paid at proposal submission. */

  min_initial_deposit_ratio: string;
  /**
   * The cancel ratio which will not be returned back to the depositors when a proposal is cancelled.
   *
   * Since: cosmos-sdk 0.48
   */

  proposal_cancel_ratio: string;
  /**
   * The address which will receive (proposal_cancel_ratio * deposit) proposal deposits.
   * If empty, the (proposal_cancel_ratio * deposit) proposal deposits will be burned.
   *
   * Since: cosmos-sdk 0.48
   */

  proposal_cancel_dest: string;
  /**
   * Duration of the voting period of an expedited proposal.
   *
   * Since: cosmos-sdk 0.48
   */

  expedited_voting_period?: DurationSDKType;
  /**
   * Minimum proportion of Yes votes for proposal to pass. Default value: 0.67.
   *
   * Since: cosmos-sdk 0.48
   */

  expedited_threshold: string;
  /** Minimum expedited deposit for a proposal to enter voting period. */

  expedited_min_deposit: CoinSDKType[];
  /** burn deposits if a proposal does not meet quorum */

  burn_vote_quorum: boolean;
  /** burn deposits if the proposal does not enter voting period */

  burn_proposal_deposit_prevote: boolean;
  /** burn deposits if quorum with vote type no_veto is met */

  burn_vote_veto: boolean;
}

function createBaseWeightedVoteOption(): WeightedVoteOption {
  return {
    option: 0,
    weight: '',
  };
}

export const WeightedVoteOption = {
  encode(
    message: WeightedVoteOption,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.option !== 0) {
      writer.uint32(8).int32(message.option);
    }

    if (message.weight !== '') {
      writer.uint32(18).string(message.weight);
    }

    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): WeightedVoteOption {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseWeightedVoteOption();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.option = reader.int32() as any;
          break;

        case 2:
          message.weight = reader.string();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object: any): WeightedVoteOption {
    return {
      option: isSet(object.option) ? voteOptionFromJSON(object.option) : 0,
      weight: isSet(object.weight) ? String(object.weight) : '',
    };
  },

  toJSON(message: WeightedVoteOption): unknown {
    const obj: any = {};
    message.option !== undefined &&
      (obj.option = voteOptionToJSON(message.option));
    message.weight !== undefined && (obj.weight = message.weight);
    return obj;
  },

  fromPartial(object: Partial<WeightedVoteOption>): WeightedVoteOption {
    const message = createBaseWeightedVoteOption();
    message.option = object.option ?? 0;
    message.weight = object.weight ?? '';
    return message;
  },

  fromSDK(object: WeightedVoteOptionSDKType): WeightedVoteOption {
    return {
      option: isSet(object.option) ? voteOptionFromJSON(object.option) : 0,
      weight: isSet(object.weight) ? object.weight : undefined,
    };
  },
};

function createBaseDeposit(): Deposit {
  return {
    proposalId: Long.UZERO,
    depositor: '',
    amount: [],
  };
}

export const Deposit = {
  encode(
    message: Deposit,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (!message.proposalId.isZero()) {
      writer.uint32(8).uint64(message.proposalId);
    }

    if (message.depositor !== '') {
      writer.uint32(18).string(message.depositor);
    }

    for (const v of message.amount) {
      Coin.encode(v!, writer.uint32(26).fork()).ldelim();
    }

    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Deposit {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeposit();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.proposalId = reader.uint64() as Long;
          break;

        case 2:
          message.depositor = reader.string();
          break;

        case 3:
          message.amount.push(Coin.decode(reader, reader.uint32()));
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object: any): Deposit {
    return {
      proposalId: isSet(object.proposalId)
        ? Long.fromValue(object.proposalId)
        : Long.UZERO,
      depositor: isSet(object.depositor) ? String(object.depositor) : '',
      amount: Array.isArray(object?.amount)
        ? object.amount.map((e: any) => Coin.fromJSON(e))
        : [],
    };
  },

  toJSON(message: Deposit): unknown {
    const obj: any = {};
    message.proposalId !== undefined &&
      (obj.proposalId = (message.proposalId || Long.UZERO).toString());
    message.depositor !== undefined && (obj.depositor = message.depositor);

    if (message.amount) {
      obj.amount = message.amount.map((e) => (e ? Coin.toJSON(e) : undefined));
    } else {
      obj.amount = [];
    }

    return obj;
  },

  fromPartial(object: Partial<Deposit>): Deposit {
    const message = createBaseDeposit();
    message.proposalId =
      object.proposalId !== undefined && object.proposalId !== null
        ? Long.fromValue(object.proposalId)
        : Long.UZERO;
    message.depositor = object.depositor ?? '';
    message.amount = object.amount?.map((e) => Coin.fromPartial(e)) || [];
    return message;
  },

  fromSDK(object: DepositSDKType): Deposit {
    return {
      proposalId: isSet(object.proposal_id) ? object.proposal_id : undefined,
      depositor: isSet(object.depositor) ? object.depositor : undefined,
      amount: Array.isArray(object?.amount)
        ? object.amount.map((e: any) => Coin.fromSDK(e))
        : [],
    };
  },
};

function createBaseProposal(): Proposal {
  return {
    id: Long.UZERO,
    messages: [],
    status: 0,
    finalTallyResult: undefined,
    submitTime: undefined,
    depositEndTime: undefined,
    totalDeposit: [],
    votingStartTime: undefined,
    votingEndTime: undefined,
    metadata: '',
    title: '',
    summary: '',
    proposer: '',
    expedited: false,
  };
}

export const Proposal = {
  encode(
    message: Proposal,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (!message.id.isZero()) {
      writer.uint32(8).uint64(message.id);
    }

    for (const v of message.messages) {
      Any.encode(v!, writer.uint32(18).fork()).ldelim();
    }

    if (message.status !== 0) {
      writer.uint32(24).int32(message.status);
    }

    if (message.finalTallyResult !== undefined) {
      TallyResult.encode(
        message.finalTallyResult,
        writer.uint32(34).fork()
      ).ldelim();
    }

    if (message.submitTime !== undefined) {
      Timestamp.encode(message.submitTime, writer.uint32(42).fork()).ldelim();
    }

    if (message.depositEndTime !== undefined) {
      Timestamp.encode(
        message.depositEndTime,
        writer.uint32(50).fork()
      ).ldelim();
    }

    for (const v of message.totalDeposit) {
      Coin.encode(v!, writer.uint32(58).fork()).ldelim();
    }

    if (message.votingStartTime !== undefined) {
      Timestamp.encode(
        message.votingStartTime,
        writer.uint32(66).fork()
      ).ldelim();
    }

    if (message.votingEndTime !== undefined) {
      Timestamp.encode(
        message.votingEndTime,
        writer.uint32(74).fork()
      ).ldelim();
    }

    if (message.metadata !== '') {
      writer.uint32(82).string(message.metadata);
    }

    if (message.title !== '') {
      writer.uint32(90).string(message.title);
    }

    if (message.summary !== '') {
      writer.uint32(98).string(message.summary);
    }

    if (message.proposer !== '') {
      writer.uint32(106).string(message.proposer);
    }

    if (message.expedited === true) {
      writer.uint32(112).bool(message.expedited);
    }

    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Proposal {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProposal();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.id = reader.uint64() as Long;
          break;

        case 2:
          message.messages.push(Any.decode(reader, reader.uint32()));
          break;

        case 3:
          message.status = reader.int32() as any;
          break;

        case 4:
          message.finalTallyResult = TallyResult.decode(
            reader,
            reader.uint32()
          );
          break;

        case 5:
          message.submitTime = Timestamp.decode(reader, reader.uint32());
          break;

        case 6:
          message.depositEndTime = Timestamp.decode(reader, reader.uint32());
          break;

        case 7:
          message.totalDeposit.push(Coin.decode(reader, reader.uint32()));
          break;

        case 8:
          message.votingStartTime = Timestamp.decode(reader, reader.uint32());
          break;

        case 9:
          message.votingEndTime = Timestamp.decode(reader, reader.uint32());
          break;

        case 10:
          message.metadata = reader.string();
          break;

        case 11:
          message.title = reader.string();
          break;

        case 12:
          message.summary = reader.string();
          break;

        case 13:
          message.proposer = reader.string();
          break;

        case 14:
          message.expedited = reader.bool();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object: any): Proposal {
    return {
      id: isSet(object.id) ? Long.fromValue(object.id) : Long.UZERO,
      messages: Array.isArray(object?.messages)
        ? object.messages.map((e: any) => Any.fromJSON(e))
        : [],
      status: isSet(object.status) ? proposalStatusFromJSON(object.status) : 0,
      finalTallyResult: isSet(object.finalTallyResult)
        ? TallyResult.fromJSON(object.finalTallyResult)
        : undefined,
      submitTime: isSet(object.submitTime)
        ? fromJsonTimestamp(object.submitTime)
        : undefined,
      depositEndTime: isSet(object.depositEndTime)
        ? fromJsonTimestamp(object.depositEndTime)
        : undefined,
      totalDeposit: Array.isArray(object?.totalDeposit)
        ? object.totalDeposit.map((e: any) => Coin.fromJSON(e))
        : [],
      votingStartTime: isSet(object.votingStartTime)
        ? fromJsonTimestamp(object.votingStartTime)
        : undefined,
      votingEndTime: isSet(object.votingEndTime)
        ? fromJsonTimestamp(object.votingEndTime)
        : undefined,
      metadata: isSet(object.metadata) ? String(object.metadata) : '',
      title: isSet(object.title) ? String(object.title) : '',
      summary: isSet(object.summary) ? String(object.summary) : '',
      proposer: isSet(object.proposer) ? String(object.proposer) : '',
      expedited: isSet(object.expedited) ? Boolean(object.expedited) : false,
    };
  },

  toJSON(message: Proposal): unknown {
    const obj: any = {};
    message.id !== undefined &&
      (obj.id = (message.id || Long.UZERO).toString());

    if (message.messages) {
      obj.messages = message.messages.map((e) =>
        e ? Any.toJSON(e) : undefined
      );
    } else {
      obj.messages = [];
    }

    message.status !== undefined &&
      (obj.status = proposalStatusToJSON(message.status));
    message.finalTallyResult !== undefined &&
      (obj.finalTallyResult = message.finalTallyResult
        ? TallyResult.toJSON(message.finalTallyResult)
        : undefined);
    message.submitTime !== undefined &&
      (obj.submitTime = fromTimestamp(message.submitTime).toISOString());
    message.depositEndTime !== undefined &&
      (obj.depositEndTime = fromTimestamp(
        message.depositEndTime
      ).toISOString());

    if (message.totalDeposit) {
      obj.totalDeposit = message.totalDeposit.map((e) =>
        e ? Coin.toJSON(e) : undefined
      );
    } else {
      obj.totalDeposit = [];
    }

    message.votingStartTime !== undefined &&
      (obj.votingStartTime = fromTimestamp(
        message.votingStartTime
      ).toISOString());
    message.votingEndTime !== undefined &&
      (obj.votingEndTime = fromTimestamp(message.votingEndTime).toISOString());
    message.metadata !== undefined && (obj.metadata = message.metadata);
    message.title !== undefined && (obj.title = message.title);
    message.summary !== undefined && (obj.summary = message.summary);
    message.proposer !== undefined && (obj.proposer = message.proposer);
    message.expedited !== undefined && (obj.expedited = message.expedited);
    return obj;
  },

  fromPartial(object: Partial<Proposal>): Proposal {
    const message = createBaseProposal();
    message.id =
      object.id !== undefined && object.id !== null
        ? Long.fromValue(object.id)
        : Long.UZERO;
    message.messages = object.messages?.map((e) => Any.fromPartial(e)) || [];
    message.status = object.status ?? 0;
    message.finalTallyResult =
      object.finalTallyResult !== undefined && object.finalTallyResult !== null
        ? TallyResult.fromPartial(object.finalTallyResult)
        : undefined;
    message.submitTime =
      object.submitTime !== undefined && object.submitTime !== null
        ? Timestamp.fromPartial(object.submitTime)
        : undefined;
    message.depositEndTime =
      object.depositEndTime !== undefined && object.depositEndTime !== null
        ? Timestamp.fromPartial(object.depositEndTime)
        : undefined;
    message.totalDeposit =
      object.totalDeposit?.map((e) => Coin.fromPartial(e)) || [];
    message.votingStartTime =
      object.votingStartTime !== undefined && object.votingStartTime !== null
        ? Timestamp.fromPartial(object.votingStartTime)
        : undefined;
    message.votingEndTime =
      object.votingEndTime !== undefined && object.votingEndTime !== null
        ? Timestamp.fromPartial(object.votingEndTime)
        : undefined;
    message.metadata = object.metadata ?? '';
    message.title = object.title ?? '';
    message.summary = object.summary ?? '';
    message.proposer = object.proposer ?? '';
    message.expedited = object.expedited ?? false;
    return message;
  },

  fromSDK(object: ProposalSDKType): Proposal {
    return {
      id: isSet(object.id) ? object.id : undefined,
      messages: Array.isArray(object?.messages)
        ? object.messages.map((e: any) => Any.fromSDK(e))
        : [],
      status: isSet(object.status) ? proposalStatusFromJSON(object.status) : 0,
      finalTallyResult: isSet(object.final_tally_result)
        ? TallyResult.fromSDK(object.final_tally_result)
        : undefined,
      submitTime: isSet(object.submit_time)
        ? Timestamp.fromSDK(object.submit_time)
        : undefined,
      depositEndTime: isSet(object.deposit_end_time)
        ? Timestamp.fromSDK(object.deposit_end_time)
        : undefined,
      totalDeposit: Array.isArray(object?.total_deposit)
        ? object.total_deposit.map((e: any) => Coin.fromSDK(e))
        : [],
      votingStartTime: isSet(object.voting_start_time)
        ? Timestamp.fromSDK(object.voting_start_time)
        : undefined,
      votingEndTime: isSet(object.voting_end_time)
        ? Timestamp.fromSDK(object.voting_end_time)
        : undefined,
      metadata: isSet(object.metadata) ? object.metadata : undefined,
      title: isSet(object.title) ? object.title : undefined,
      summary: isSet(object.summary) ? object.summary : undefined,
      proposer: isSet(object.proposer) ? object.proposer : undefined,
      expedited: isSet(object.expedited) ? object.expedited : undefined,
    };
  },
};

function createBaseTallyResult(): TallyResult {
  return {
    yesCount: '',
    abstainCount: '',
    noCount: '',
    noWithVetoCount: '',
  };
}

export const TallyResult = {
  encode(
    message: TallyResult,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.yesCount !== '') {
      writer.uint32(10).string(message.yesCount);
    }

    if (message.abstainCount !== '') {
      writer.uint32(18).string(message.abstainCount);
    }

    if (message.noCount !== '') {
      writer.uint32(26).string(message.noCount);
    }

    if (message.noWithVetoCount !== '') {
      writer.uint32(34).string(message.noWithVetoCount);
    }

    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TallyResult {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTallyResult();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.yesCount = reader.string();
          break;

        case 2:
          message.abstainCount = reader.string();
          break;

        case 3:
          message.noCount = reader.string();
          break;

        case 4:
          message.noWithVetoCount = reader.string();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object: any): TallyResult {
    return {
      yesCount: isSet(object.yesCount) ? String(object.yesCount) : '',
      abstainCount: isSet(object.abstainCount)
        ? String(object.abstainCount)
        : '',
      noCount: isSet(object.noCount) ? String(object.noCount) : '',
      noWithVetoCount: isSet(object.noWithVetoCount)
        ? String(object.noWithVetoCount)
        : '',
    };
  },

  toJSON(message: TallyResult): unknown {
    const obj: any = {};
    message.yesCount !== undefined && (obj.yesCount = message.yesCount);
    message.abstainCount !== undefined &&
      (obj.abstainCount = message.abstainCount);
    message.noCount !== undefined && (obj.noCount = message.noCount);
    message.noWithVetoCount !== undefined &&
      (obj.noWithVetoCount = message.noWithVetoCount);
    return obj;
  },

  fromPartial(object: Partial<TallyResult>): TallyResult {
    const message = createBaseTallyResult();
    message.yesCount = object.yesCount ?? '';
    message.abstainCount = object.abstainCount ?? '';
    message.noCount = object.noCount ?? '';
    message.noWithVetoCount = object.noWithVetoCount ?? '';
    return message;
  },

  fromSDK(object: TallyResultSDKType): TallyResult {
    return {
      yesCount: isSet(object.yes_count) ? object.yes_count : undefined,
      abstainCount: isSet(object.abstain_count)
        ? object.abstain_count
        : undefined,
      noCount: isSet(object.no_count) ? object.no_count : undefined,
      noWithVetoCount: isSet(object.no_with_veto_count)
        ? object.no_with_veto_count
        : undefined,
    };
  },
};

function createBaseVote(): Vote {
  return {
    proposalId: Long.UZERO,
    voter: '',
    options: [],
    metadata: '',
  };
}

export const Vote = {
  encode(message: Vote, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (!message.proposalId.isZero()) {
      writer.uint32(8).uint64(message.proposalId);
    }

    if (message.voter !== '') {
      writer.uint32(18).string(message.voter);
    }

    for (const v of message.options) {
      WeightedVoteOption.encode(v!, writer.uint32(34).fork()).ldelim();
    }

    if (message.metadata !== '') {
      writer.uint32(42).string(message.metadata);
    }

    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Vote {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVote();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.proposalId = reader.uint64() as Long;
          break;

        case 2:
          message.voter = reader.string();
          break;

        case 4:
          message.options.push(
            WeightedVoteOption.decode(reader, reader.uint32())
          );
          break;

        case 5:
          message.metadata = reader.string();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object: any): Vote {
    return {
      proposalId: isSet(object.proposalId)
        ? Long.fromValue(object.proposalId)
        : Long.UZERO,
      voter: isSet(object.voter) ? String(object.voter) : '',
      options: Array.isArray(object?.options)
        ? object.options.map((e: any) => WeightedVoteOption.fromJSON(e))
        : [],
      metadata: isSet(object.metadata) ? String(object.metadata) : '',
    };
  },

  toJSON(message: Vote): unknown {
    const obj: any = {};
    message.proposalId !== undefined &&
      (obj.proposalId = (message.proposalId || Long.UZERO).toString());
    message.voter !== undefined && (obj.voter = message.voter);

    if (message.options) {
      obj.options = message.options.map((e) =>
        e ? WeightedVoteOption.toJSON(e) : undefined
      );
    } else {
      obj.options = [];
    }

    message.metadata !== undefined && (obj.metadata = message.metadata);
    return obj;
  },

  fromPartial(object: Partial<Vote>): Vote {
    const message = createBaseVote();
    message.proposalId =
      object.proposalId !== undefined && object.proposalId !== null
        ? Long.fromValue(object.proposalId)
        : Long.UZERO;
    message.voter = object.voter ?? '';
    message.options =
      object.options?.map((e) => WeightedVoteOption.fromPartial(e)) || [];
    message.metadata = object.metadata ?? '';
    return message;
  },

  fromSDK(object: VoteSDKType): Vote {
    return {
      proposalId: isSet(object.proposal_id) ? object.proposal_id : undefined,
      voter: isSet(object.voter) ? object.voter : undefined,
      options: Array.isArray(object?.options)
        ? object.options.map((e: any) => WeightedVoteOption.fromSDK(e))
        : [],
      metadata: isSet(object.metadata) ? object.metadata : undefined,
    };
  },
};

function createBaseDepositParams(): DepositParams {
  return {
    minDeposit: [],
    maxDepositPeriod: undefined,
  };
}

export const DepositParams = {
  encode(
    message: DepositParams,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.minDeposit) {
      Coin.encode(v!, writer.uint32(10).fork()).ldelim();
    }

    if (message.maxDepositPeriod !== undefined) {
      Duration.encode(
        message.maxDepositPeriod,
        writer.uint32(18).fork()
      ).ldelim();
    }

    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DepositParams {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDepositParams();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.minDeposit.push(Coin.decode(reader, reader.uint32()));
          break;

        case 2:
          message.maxDepositPeriod = Duration.decode(reader, reader.uint32());
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object: any): DepositParams {
    return {
      minDeposit: Array.isArray(object?.minDeposit)
        ? object.minDeposit.map((e: any) => Coin.fromJSON(e))
        : [],
      maxDepositPeriod: isSet(object.maxDepositPeriod)
        ? Duration.fromJSON(object.maxDepositPeriod)
        : undefined,
    };
  },

  toJSON(message: DepositParams): unknown {
    const obj: any = {};

    if (message.minDeposit) {
      obj.minDeposit = message.minDeposit.map((e) =>
        e ? Coin.toJSON(e) : undefined
      );
    } else {
      obj.minDeposit = [];
    }

    message.maxDepositPeriod !== undefined &&
      (obj.maxDepositPeriod = message.maxDepositPeriod
        ? Duration.toJSON(message.maxDepositPeriod)
        : undefined);
    return obj;
  },

  fromPartial(object: Partial<DepositParams>): DepositParams {
    const message = createBaseDepositParams();
    message.minDeposit =
      object.minDeposit?.map((e) => Coin.fromPartial(e)) || [];
    message.maxDepositPeriod =
      object.maxDepositPeriod !== undefined && object.maxDepositPeriod !== null
        ? Duration.fromPartial(object.maxDepositPeriod)
        : undefined;
    return message;
  },

  fromSDK(object: DepositParamsSDKType): DepositParams {
    return {
      minDeposit: Array.isArray(object?.min_deposit)
        ? object.min_deposit.map((e: any) => Coin.fromSDK(e))
        : [],
      maxDepositPeriod: isSet(object.max_deposit_period)
        ? Duration.fromSDK(object.max_deposit_period)
        : undefined,
    };
  },
};

function createBaseVotingParams(): VotingParams {
  return {
    votingPeriod: undefined,
  };
}

export const VotingParams = {
  encode(
    message: VotingParams,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.votingPeriod !== undefined) {
      Duration.encode(message.votingPeriod, writer.uint32(10).fork()).ldelim();
    }

    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): VotingParams {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVotingParams();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.votingPeriod = Duration.decode(reader, reader.uint32());
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object: any): VotingParams {
    return {
      votingPeriod: isSet(object.votingPeriod)
        ? Duration.fromJSON(object.votingPeriod)
        : undefined,
    };
  },

  toJSON(message: VotingParams): unknown {
    const obj: any = {};
    message.votingPeriod !== undefined &&
      (obj.votingPeriod = message.votingPeriod
        ? Duration.toJSON(message.votingPeriod)
        : undefined);
    return obj;
  },

  fromPartial(object: Partial<VotingParams>): VotingParams {
    const message = createBaseVotingParams();
    message.votingPeriod =
      object.votingPeriod !== undefined && object.votingPeriod !== null
        ? Duration.fromPartial(object.votingPeriod)
        : undefined;
    return message;
  },

  fromSDK(object: VotingParamsSDKType): VotingParams {
    return {
      votingPeriod: isSet(object.voting_period)
        ? Duration.fromSDK(object.voting_period)
        : undefined,
    };
  },
};

function createBaseTallyParams(): TallyParams {
  return {
    quorum: '',
    threshold: '',
    vetoThreshold: '',
  };
}

export const TallyParams = {
  encode(
    message: TallyParams,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.quorum !== '') {
      writer.uint32(10).string(message.quorum);
    }

    if (message.threshold !== '') {
      writer.uint32(18).string(message.threshold);
    }

    if (message.vetoThreshold !== '') {
      writer.uint32(26).string(message.vetoThreshold);
    }

    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TallyParams {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTallyParams();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.quorum = reader.string();
          break;

        case 2:
          message.threshold = reader.string();
          break;

        case 3:
          message.vetoThreshold = reader.string();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object: any): TallyParams {
    return {
      quorum: isSet(object.quorum) ? String(object.quorum) : '',
      threshold: isSet(object.threshold) ? String(object.threshold) : '',
      vetoThreshold: isSet(object.vetoThreshold)
        ? String(object.vetoThreshold)
        : '',
    };
  },

  toJSON(message: TallyParams): unknown {
    const obj: any = {};
    message.quorum !== undefined && (obj.quorum = message.quorum);
    message.threshold !== undefined && (obj.threshold = message.threshold);
    message.vetoThreshold !== undefined &&
      (obj.vetoThreshold = message.vetoThreshold);
    return obj;
  },

  fromPartial(object: Partial<TallyParams>): TallyParams {
    const message = createBaseTallyParams();
    message.quorum = object.quorum ?? '';
    message.threshold = object.threshold ?? '';
    message.vetoThreshold = object.vetoThreshold ?? '';
    return message;
  },

  fromSDK(object: TallyParamsSDKType): TallyParams {
    return {
      quorum: isSet(object.quorum) ? object.quorum : undefined,
      threshold: isSet(object.threshold) ? object.threshold : undefined,
      vetoThreshold: isSet(object.veto_threshold)
        ? object.veto_threshold
        : undefined,
    };
  },
};

function createBaseParams(): Params {
  return {
    minDeposit: [],
    maxDepositPeriod: undefined,
    votingPeriod: undefined,
    quorum: '',
    threshold: '',
    vetoThreshold: '',
    minInitialDepositRatio: '',
    proposalCancelRatio: '',
    proposalCancelDest: '',
    expeditedVotingPeriod: undefined,
    expeditedThreshold: '',
    expeditedMinDeposit: [],
    burnVoteQuorum: false,
    burnProposalDepositPrevote: false,
    burnVoteVeto: false,
  };
}

export const Params = {
  encode(
    message: Params,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.minDeposit) {
      Coin.encode(v!, writer.uint32(10).fork()).ldelim();
    }

    if (message.maxDepositPeriod !== undefined) {
      Duration.encode(
        message.maxDepositPeriod,
        writer.uint32(18).fork()
      ).ldelim();
    }

    if (message.votingPeriod !== undefined) {
      Duration.encode(message.votingPeriod, writer.uint32(26).fork()).ldelim();
    }

    if (message.quorum !== '') {
      writer.uint32(34).string(message.quorum);
    }

    if (message.threshold !== '') {
      writer.uint32(42).string(message.threshold);
    }

    if (message.vetoThreshold !== '') {
      writer.uint32(50).string(message.vetoThreshold);
    }

    if (message.minInitialDepositRatio !== '') {
      writer.uint32(58).string(message.minInitialDepositRatio);
    }

    if (message.proposalCancelRatio !== '') {
      writer.uint32(66).string(message.proposalCancelRatio);
    }

    if (message.proposalCancelDest !== '') {
      writer.uint32(74).string(message.proposalCancelDest);
    }

    if (message.expeditedVotingPeriod !== undefined) {
      Duration.encode(
        message.expeditedVotingPeriod,
        writer.uint32(82).fork()
      ).ldelim();
    }

    if (message.expeditedThreshold !== '') {
      writer.uint32(90).string(message.expeditedThreshold);
    }

    for (const v of message.expeditedMinDeposit) {
      Coin.encode(v!, writer.uint32(98).fork()).ldelim();
    }

    if (message.burnVoteQuorum === true) {
      writer.uint32(104).bool(message.burnVoteQuorum);
    }

    if (message.burnProposalDepositPrevote === true) {
      writer.uint32(112).bool(message.burnProposalDepositPrevote);
    }

    if (message.burnVoteVeto === true) {
      writer.uint32(120).bool(message.burnVoteVeto);
    }

    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Params {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseParams();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.minDeposit.push(Coin.decode(reader, reader.uint32()));
          break;

        case 2:
          message.maxDepositPeriod = Duration.decode(reader, reader.uint32());
          break;

        case 3:
          message.votingPeriod = Duration.decode(reader, reader.uint32());
          break;

        case 4:
          message.quorum = reader.string();
          break;

        case 5:
          message.threshold = reader.string();
          break;

        case 6:
          message.vetoThreshold = reader.string();
          break;

        case 7:
          message.minInitialDepositRatio = reader.string();
          break;

        case 8:
          message.proposalCancelRatio = reader.string();
          break;

        case 9:
          message.proposalCancelDest = reader.string();
          break;

        case 10:
          message.expeditedVotingPeriod = Duration.decode(
            reader,
            reader.uint32()
          );
          break;

        case 11:
          message.expeditedThreshold = reader.string();
          break;

        case 12:
          message.expeditedMinDeposit.push(
            Coin.decode(reader, reader.uint32())
          );
          break;

        case 13:
          message.burnVoteQuorum = reader.bool();
          break;

        case 14:
          message.burnProposalDepositPrevote = reader.bool();
          break;

        case 15:
          message.burnVoteVeto = reader.bool();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object: any): Params {
    return {
      minDeposit: Array.isArray(object?.minDeposit)
        ? object.minDeposit.map((e: any) => Coin.fromJSON(e))
        : [],
      maxDepositPeriod: isSet(object.maxDepositPeriod)
        ? Duration.fromJSON(object.maxDepositPeriod)
        : undefined,
      votingPeriod: isSet(object.votingPeriod)
        ? Duration.fromJSON(object.votingPeriod)
        : undefined,
      quorum: isSet(object.quorum) ? String(object.quorum) : '',
      threshold: isSet(object.threshold) ? String(object.threshold) : '',
      vetoThreshold: isSet(object.vetoThreshold)
        ? String(object.vetoThreshold)
        : '',
      minInitialDepositRatio: isSet(object.minInitialDepositRatio)
        ? String(object.minInitialDepositRatio)
        : '',
      proposalCancelRatio: isSet(object.proposalCancelRatio)
        ? String(object.proposalCancelRatio)
        : '',
      proposalCancelDest: isSet(object.proposalCancelDest)
        ? String(object.proposalCancelDest)
        : '',
      expeditedVotingPeriod: isSet(object.expeditedVotingPeriod)
        ? Duration.fromJSON(object.expeditedVotingPeriod)
        : undefined,
      expeditedThreshold: isSet(object.expeditedThreshold)
        ? String(object.expeditedThreshold)
        : '',
      expeditedMinDeposit: Array.isArray(object?.expeditedMinDeposit)
        ? object.expeditedMinDeposit.map((e: any) => Coin.fromJSON(e))
        : [],
      burnVoteQuorum: isSet(object.burnVoteQuorum)
        ? Boolean(object.burnVoteQuorum)
        : false,
      burnProposalDepositPrevote: isSet(object.burnProposalDepositPrevote)
        ? Boolean(object.burnProposalDepositPrevote)
        : false,
      burnVoteVeto: isSet(object.burnVoteVeto)
        ? Boolean(object.burnVoteVeto)
        : false,
    };
  },

  toJSON(message: Params): unknown {
    const obj: any = {};

    if (message.minDeposit) {
      obj.minDeposit = message.minDeposit.map((e) =>
        e ? Coin.toJSON(e) : undefined
      );
    } else {
      obj.minDeposit = [];
    }

    message.maxDepositPeriod !== undefined &&
      (obj.maxDepositPeriod = message.maxDepositPeriod
        ? Duration.toJSON(message.maxDepositPeriod)
        : undefined);
    message.votingPeriod !== undefined &&
      (obj.votingPeriod = message.votingPeriod
        ? Duration.toJSON(message.votingPeriod)
        : undefined);
    message.quorum !== undefined && (obj.quorum = message.quorum);
    message.threshold !== undefined && (obj.threshold = message.threshold);
    message.vetoThreshold !== undefined &&
      (obj.vetoThreshold = message.vetoThreshold);
    message.minInitialDepositRatio !== undefined &&
      (obj.minInitialDepositRatio = message.minInitialDepositRatio);
    message.proposalCancelRatio !== undefined &&
      (obj.proposalCancelRatio = message.proposalCancelRatio);
    message.proposalCancelDest !== undefined &&
      (obj.proposalCancelDest = message.proposalCancelDest);
    message.expeditedVotingPeriod !== undefined &&
      (obj.expeditedVotingPeriod = message.expeditedVotingPeriod
        ? Duration.toJSON(message.expeditedVotingPeriod)
        : undefined);
    message.expeditedThreshold !== undefined &&
      (obj.expeditedThreshold = message.expeditedThreshold);

    if (message.expeditedMinDeposit) {
      obj.expeditedMinDeposit = message.expeditedMinDeposit.map((e) =>
        e ? Coin.toJSON(e) : undefined
      );
    } else {
      obj.expeditedMinDeposit = [];
    }

    message.burnVoteQuorum !== undefined &&
      (obj.burnVoteQuorum = message.burnVoteQuorum);
    message.burnProposalDepositPrevote !== undefined &&
      (obj.burnProposalDepositPrevote = message.burnProposalDepositPrevote);
    message.burnVoteVeto !== undefined &&
      (obj.burnVoteVeto = message.burnVoteVeto);
    return obj;
  },

  fromPartial(object: Partial<Params>): Params {
    const message = createBaseParams();
    message.minDeposit =
      object.minDeposit?.map((e) => Coin.fromPartial(e)) || [];
    message.maxDepositPeriod =
      object.maxDepositPeriod !== undefined && object.maxDepositPeriod !== null
        ? Duration.fromPartial(object.maxDepositPeriod)
        : undefined;
    message.votingPeriod =
      object.votingPeriod !== undefined && object.votingPeriod !== null
        ? Duration.fromPartial(object.votingPeriod)
        : undefined;
    message.quorum = object.quorum ?? '';
    message.threshold = object.threshold ?? '';
    message.vetoThreshold = object.vetoThreshold ?? '';
    message.minInitialDepositRatio = object.minInitialDepositRatio ?? '';
    message.proposalCancelRatio = object.proposalCancelRatio ?? '';
    message.proposalCancelDest = object.proposalCancelDest ?? '';
    message.expeditedVotingPeriod =
      object.expeditedVotingPeriod !== undefined &&
      object.expeditedVotingPeriod !== null
        ? Duration.fromPartial(object.expeditedVotingPeriod)
        : undefined;
    message.expeditedThreshold = object.expeditedThreshold ?? '';
    message.expeditedMinDeposit =
      object.expeditedMinDeposit?.map((e) => Coin.fromPartial(e)) || [];
    message.burnVoteQuorum = object.burnVoteQuorum ?? false;
    message.burnProposalDepositPrevote =
      object.burnProposalDepositPrevote ?? false;
    message.burnVoteVeto = object.burnVoteVeto ?? false;
    return message;
  },

  fromSDK(object: ParamsSDKType): Params {
    return {
      minDeposit: Array.isArray(object?.min_deposit)
        ? object.min_deposit.map((e: any) => Coin.fromSDK(e))
        : [],
      maxDepositPeriod: isSet(object.max_deposit_period)
        ? Duration.fromSDK(object.max_deposit_period)
        : undefined,
      votingPeriod: isSet(object.voting_period)
        ? Duration.fromSDK(object.voting_period)
        : undefined,
      quorum: isSet(object.quorum) ? object.quorum : undefined,
      threshold: isSet(object.threshold) ? object.threshold : undefined,
      vetoThreshold: isSet(object.veto_threshold)
        ? object.veto_threshold
        : undefined,
      minInitialDepositRatio: isSet(object.min_initial_deposit_ratio)
        ? object.min_initial_deposit_ratio
        : undefined,
      proposalCancelRatio: isSet(object.proposal_cancel_ratio)
        ? object.proposal_cancel_ratio
        : undefined,
      proposalCancelDest: isSet(object.proposal_cancel_dest)
        ? object.proposal_cancel_dest
        : undefined,
      expeditedVotingPeriod: isSet(object.expedited_voting_period)
        ? Duration.fromSDK(object.expedited_voting_period)
        : undefined,
      expeditedThreshold: isSet(object.expedited_threshold)
        ? object.expedited_threshold
        : undefined,
      expeditedMinDeposit: Array.isArray(object?.expedited_min_deposit)
        ? object.expedited_min_deposit.map((e: any) => Coin.fromSDK(e))
        : [],
      burnVoteQuorum: isSet(object.burn_vote_quorum)
        ? object.burn_vote_quorum
        : undefined,
      burnProposalDepositPrevote: isSet(object.burn_proposal_deposit_prevote)
        ? object.burn_proposal_deposit_prevote
        : undefined,
      burnVoteVeto: isSet(object.burn_vote_veto)
        ? object.burn_vote_veto
        : undefined,
    };
  },
};
