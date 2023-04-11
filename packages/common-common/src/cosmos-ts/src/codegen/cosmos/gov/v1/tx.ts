import { Any, AnySDKType } from '../../../google/protobuf/any';
import { Coin, CoinSDKType } from '../../base/v1beta1/coin';
import {
  VoteOption,
  VoteOptionSDKType,
  WeightedVoteOption,
  WeightedVoteOptionSDKType,
  Params,
  ParamsSDKType,
  voteOptionFromJSON,
  voteOptionToJSON,
} from './gov';
import {
  Timestamp,
  TimestampSDKType,
} from '../../../google/protobuf/timestamp';
import * as _m0 from 'protobufjs/minimal';
import {
  isSet,
  Long,
  fromJsonTimestamp,
  fromTimestamp,
} from '../../../helpers';
/**
 * MsgSubmitProposal defines an sdk.Msg type that supports submitting arbitrary
 * proposal Content.
 */

export interface MsgSubmitProposal {
  /** messages are the arbitrary messages to be executed if proposal passes. */
  messages: Any[];
  /** initial_deposit is the deposit value that must be paid at proposal submission. */

  initialDeposit: Coin[];
  /** proposer is the account address of the proposer. */

  proposer: string;
  /** metadata is any arbitrary metadata attached to the proposal. */

  metadata: string;
  /**
   * title is the title of the proposal.
   *
   * Since: cosmos-sdk 0.47
   */

  title: string;
  /**
   * summary is the summary of the proposal
   *
   * Since: cosmos-sdk 0.47
   */

  summary: string;
  /**
   * expedided defines if the proposal is expedited or not
   *
   * Since: cosmos-sdk 0.48
   */

  expedited: boolean;
}
/**
 * MsgSubmitProposal defines an sdk.Msg type that supports submitting arbitrary
 * proposal Content.
 */

export interface MsgSubmitProposalSDKType {
  /** messages are the arbitrary messages to be executed if proposal passes. */
  messages: AnySDKType[];
  /** initial_deposit is the deposit value that must be paid at proposal submission. */

  initial_deposit: CoinSDKType[];
  /** proposer is the account address of the proposer. */

  proposer: string;
  /** metadata is any arbitrary metadata attached to the proposal. */

  metadata: string;
  /**
   * title is the title of the proposal.
   *
   * Since: cosmos-sdk 0.47
   */

  title: string;
  /**
   * summary is the summary of the proposal
   *
   * Since: cosmos-sdk 0.47
   */

  summary: string;
  /**
   * expedided defines if the proposal is expedited or not
   *
   * Since: cosmos-sdk 0.48
   */

  expedited: boolean;
}
/** MsgSubmitProposalResponse defines the Msg/SubmitProposal response type. */

export interface MsgSubmitProposalResponse {
  /** proposal_id defines the unique id of the proposal. */
  proposalId: Long;
}
/** MsgSubmitProposalResponse defines the Msg/SubmitProposal response type. */

export interface MsgSubmitProposalResponseSDKType {
  /** proposal_id defines the unique id of the proposal. */
  proposal_id: Long;
}
/**
 * MsgExecLegacyContent is used to wrap the legacy content field into a message.
 * This ensures backwards compatibility with v1beta1.MsgSubmitProposal.
 */

export interface MsgExecLegacyContent {
  /** content is the proposal's content. */
  content?: Any;
  /** authority must be the gov module address. */

  authority: string;
}
/**
 * MsgExecLegacyContent is used to wrap the legacy content field into a message.
 * This ensures backwards compatibility with v1beta1.MsgSubmitProposal.
 */

export interface MsgExecLegacyContentSDKType {
  /** content is the proposal's content. */
  content?: AnySDKType;
  /** authority must be the gov module address. */

  authority: string;
}
/** MsgExecLegacyContentResponse defines the Msg/ExecLegacyContent response type. */

export interface MsgExecLegacyContentResponse {}
/** MsgExecLegacyContentResponse defines the Msg/ExecLegacyContent response type. */

export interface MsgExecLegacyContentResponseSDKType {}
/** MsgVote defines a message to cast a vote. */

export interface MsgVote {
  /** proposal_id defines the unique id of the proposal. */
  proposalId: Long;
  /** voter is the voter address for the proposal. */

  voter: string;
  /** option defines the vote option. */

  option: VoteOption;
  /** metadata is any arbitrary metadata attached to the Vote. */

  metadata: string;
}
/** MsgVote defines a message to cast a vote. */

export interface MsgVoteSDKType {
  /** proposal_id defines the unique id of the proposal. */
  proposal_id: Long;
  /** voter is the voter address for the proposal. */

  voter: string;
  /** option defines the vote option. */

  option: VoteOptionSDKType;
  /** metadata is any arbitrary metadata attached to the Vote. */

  metadata: string;
}
/** MsgVoteResponse defines the Msg/Vote response type. */

export interface MsgVoteResponse {}
/** MsgVoteResponse defines the Msg/Vote response type. */

export interface MsgVoteResponseSDKType {}
/** MsgVoteWeighted defines a message to cast a vote. */

export interface MsgVoteWeighted {
  /** proposal_id defines the unique id of the proposal. */
  proposalId: Long;
  /** voter is the voter address for the proposal. */

  voter: string;
  /** options defines the weighted vote options. */

  options: WeightedVoteOption[];
  /** metadata is any arbitrary metadata attached to the VoteWeighted. */

  metadata: string;
}
/** MsgVoteWeighted defines a message to cast a vote. */

export interface MsgVoteWeightedSDKType {
  /** proposal_id defines the unique id of the proposal. */
  proposal_id: Long;
  /** voter is the voter address for the proposal. */

  voter: string;
  /** options defines the weighted vote options. */

  options: WeightedVoteOptionSDKType[];
  /** metadata is any arbitrary metadata attached to the VoteWeighted. */

  metadata: string;
}
/** MsgVoteWeightedResponse defines the Msg/VoteWeighted response type. */

export interface MsgVoteWeightedResponse {}
/** MsgVoteWeightedResponse defines the Msg/VoteWeighted response type. */

export interface MsgVoteWeightedResponseSDKType {}
/** MsgDeposit defines a message to submit a deposit to an existing proposal. */

export interface MsgDeposit {
  /** proposal_id defines the unique id of the proposal. */
  proposalId: Long;
  /** depositor defines the deposit addresses from the proposals. */

  depositor: string;
  /** amount to be deposited by depositor. */

  amount: Coin[];
}
/** MsgDeposit defines a message to submit a deposit to an existing proposal. */

export interface MsgDepositSDKType {
  /** proposal_id defines the unique id of the proposal. */
  proposal_id: Long;
  /** depositor defines the deposit addresses from the proposals. */

  depositor: string;
  /** amount to be deposited by depositor. */

  amount: CoinSDKType[];
}
/** MsgDepositResponse defines the Msg/Deposit response type. */

export interface MsgDepositResponse {}
/** MsgDepositResponse defines the Msg/Deposit response type. */

export interface MsgDepositResponseSDKType {}
/**
 * MsgUpdateParams is the Msg/UpdateParams request type.
 *
 * Since: cosmos-sdk 0.47
 */

export interface MsgUpdateParams {
  /** authority is the address that controls the module (defaults to x/gov unless overwritten). */
  authority: string;
  /**
   * params defines the x/gov parameters to update.
   *
   * NOTE: All parameters must be supplied.
   */

  params?: Params;
}
/**
 * MsgUpdateParams is the Msg/UpdateParams request type.
 *
 * Since: cosmos-sdk 0.47
 */

export interface MsgUpdateParamsSDKType {
  /** authority is the address that controls the module (defaults to x/gov unless overwritten). */
  authority: string;
  /**
   * params defines the x/gov parameters to update.
   *
   * NOTE: All parameters must be supplied.
   */

  params?: ParamsSDKType;
}
/**
 * MsgUpdateParamsResponse defines the response structure for executing a
 * MsgUpdateParams message.
 *
 * Since: cosmos-sdk 0.47
 */

export interface MsgUpdateParamsResponse {}
/**
 * MsgUpdateParamsResponse defines the response structure for executing a
 * MsgUpdateParams message.
 *
 * Since: cosmos-sdk 0.47
 */

export interface MsgUpdateParamsResponseSDKType {}
/**
 * MsgCancelProposal is the Msg/CancelProposal request type.
 *
 * Since: cosmos-sdk 0.48
 */

export interface MsgCancelProposal {
  proposalId: Long;
  proposer: string;
}
/**
 * MsgCancelProposal is the Msg/CancelProposal request type.
 *
 * Since: cosmos-sdk 0.48
 */

export interface MsgCancelProposalSDKType {
  proposal_id: Long;
  proposer: string;
}
/**
 * MsgCancelProposalResponse defines the response structure for executing a
 * MsgCancelProposal message.
 *
 * Since: cosmos-sdk 0.48
 */

export interface MsgCancelProposalResponse {
  proposalId: Long;
  /** canceled_time is the time when proposal is canceled. */

  canceledTime?: Timestamp;
  /** canceled_height defines the block height at which the proposal is canceled. */

  canceledHeight: Long;
}
/**
 * MsgCancelProposalResponse defines the response structure for executing a
 * MsgCancelProposal message.
 *
 * Since: cosmos-sdk 0.48
 */

export interface MsgCancelProposalResponseSDKType {
  proposal_id: Long;
  /** canceled_time is the time when proposal is canceled. */

  canceled_time?: TimestampSDKType;
  /** canceled_height defines the block height at which the proposal is canceled. */

  canceled_height: Long;
}

function createBaseMsgSubmitProposal(): MsgSubmitProposal {
  return {
    messages: [],
    initialDeposit: [],
    proposer: '',
    metadata: '',
    title: '',
    summary: '',
    expedited: false,
  };
}

export const MsgSubmitProposal = {
  encode(
    message: MsgSubmitProposal,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.messages) {
      Any.encode(v!, writer.uint32(10).fork()).ldelim();
    }

    for (const v of message.initialDeposit) {
      Coin.encode(v!, writer.uint32(18).fork()).ldelim();
    }

    if (message.proposer !== '') {
      writer.uint32(26).string(message.proposer);
    }

    if (message.metadata !== '') {
      writer.uint32(34).string(message.metadata);
    }

    if (message.title !== '') {
      writer.uint32(42).string(message.title);
    }

    if (message.summary !== '') {
      writer.uint32(50).string(message.summary);
    }

    if (message.expedited === true) {
      writer.uint32(56).bool(message.expedited);
    }

    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MsgSubmitProposal {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMsgSubmitProposal();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.messages.push(Any.decode(reader, reader.uint32()));
          break;

        case 2:
          message.initialDeposit.push(Coin.decode(reader, reader.uint32()));
          break;

        case 3:
          message.proposer = reader.string();
          break;

        case 4:
          message.metadata = reader.string();
          break;

        case 5:
          message.title = reader.string();
          break;

        case 6:
          message.summary = reader.string();
          break;

        case 7:
          message.expedited = reader.bool();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object: any): MsgSubmitProposal {
    return {
      messages: Array.isArray(object?.messages)
        ? object.messages.map((e: any) => Any.fromJSON(e))
        : [],
      initialDeposit: Array.isArray(object?.initialDeposit)
        ? object.initialDeposit.map((e: any) => Coin.fromJSON(e))
        : [],
      proposer: isSet(object.proposer) ? String(object.proposer) : '',
      metadata: isSet(object.metadata) ? String(object.metadata) : '',
      title: isSet(object.title) ? String(object.title) : '',
      summary: isSet(object.summary) ? String(object.summary) : '',
      expedited: isSet(object.expedited) ? Boolean(object.expedited) : false,
    };
  },

  toJSON(message: MsgSubmitProposal): unknown {
    const obj: any = {};

    if (message.messages) {
      obj.messages = message.messages.map((e) =>
        e ? Any.toJSON(e) : undefined
      );
    } else {
      obj.messages = [];
    }

    if (message.initialDeposit) {
      obj.initialDeposit = message.initialDeposit.map((e) =>
        e ? Coin.toJSON(e) : undefined
      );
    } else {
      obj.initialDeposit = [];
    }

    message.proposer !== undefined && (obj.proposer = message.proposer);
    message.metadata !== undefined && (obj.metadata = message.metadata);
    message.title !== undefined && (obj.title = message.title);
    message.summary !== undefined && (obj.summary = message.summary);
    message.expedited !== undefined && (obj.expedited = message.expedited);
    return obj;
  },

  fromPartial(object: Partial<MsgSubmitProposal>): MsgSubmitProposal {
    const message = createBaseMsgSubmitProposal();
    message.messages = object.messages?.map((e) => Any.fromPartial(e)) || [];
    message.initialDeposit =
      object.initialDeposit?.map((e) => Coin.fromPartial(e)) || [];
    message.proposer = object.proposer ?? '';
    message.metadata = object.metadata ?? '';
    message.title = object.title ?? '';
    message.summary = object.summary ?? '';
    message.expedited = object.expedited ?? false;
    return message;
  },

  fromSDK(object: MsgSubmitProposalSDKType): MsgSubmitProposal {
    return {
      messages: Array.isArray(object?.messages)
        ? object.messages.map((e: any) => Any.fromSDK(e))
        : [],
      initialDeposit: Array.isArray(object?.initial_deposit)
        ? object.initial_deposit.map((e: any) => Coin.fromSDK(e))
        : [],
      proposer: isSet(object.proposer) ? object.proposer : undefined,
      metadata: isSet(object.metadata) ? object.metadata : undefined,
      title: isSet(object.title) ? object.title : undefined,
      summary: isSet(object.summary) ? object.summary : undefined,
      expedited: isSet(object.expedited) ? object.expedited : undefined,
    };
  },
};

function createBaseMsgSubmitProposalResponse(): MsgSubmitProposalResponse {
  return {
    proposalId: Long.UZERO,
  };
}

export const MsgSubmitProposalResponse = {
  encode(
    message: MsgSubmitProposalResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (!message.proposalId.isZero()) {
      writer.uint32(8).uint64(message.proposalId);
    }

    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): MsgSubmitProposalResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMsgSubmitProposalResponse();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.proposalId = reader.uint64() as Long;
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object: any): MsgSubmitProposalResponse {
    return {
      proposalId: isSet(object.proposalId)
        ? Long.fromValue(object.proposalId)
        : Long.UZERO,
    };
  },

  toJSON(message: MsgSubmitProposalResponse): unknown {
    const obj: any = {};
    message.proposalId !== undefined &&
      (obj.proposalId = (message.proposalId || Long.UZERO).toString());
    return obj;
  },

  fromPartial(
    object: Partial<MsgSubmitProposalResponse>
  ): MsgSubmitProposalResponse {
    const message = createBaseMsgSubmitProposalResponse();
    message.proposalId =
      object.proposalId !== undefined && object.proposalId !== null
        ? Long.fromValue(object.proposalId)
        : Long.UZERO;
    return message;
  },

  fromSDK(object: MsgSubmitProposalResponseSDKType): MsgSubmitProposalResponse {
    return {
      proposalId: isSet(object.proposal_id) ? object.proposal_id : undefined,
    };
  },
};

function createBaseMsgExecLegacyContent(): MsgExecLegacyContent {
  return {
    content: undefined,
    authority: '',
  };
}

export const MsgExecLegacyContent = {
  encode(
    message: MsgExecLegacyContent,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.content !== undefined) {
      Any.encode(message.content, writer.uint32(10).fork()).ldelim();
    }

    if (message.authority !== '') {
      writer.uint32(18).string(message.authority);
    }

    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): MsgExecLegacyContent {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMsgExecLegacyContent();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.content = Any.decode(reader, reader.uint32());
          break;

        case 2:
          message.authority = reader.string();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object: any): MsgExecLegacyContent {
    return {
      content: isSet(object.content) ? Any.fromJSON(object.content) : undefined,
      authority: isSet(object.authority) ? String(object.authority) : '',
    };
  },

  toJSON(message: MsgExecLegacyContent): unknown {
    const obj: any = {};
    message.content !== undefined &&
      (obj.content = message.content ? Any.toJSON(message.content) : undefined);
    message.authority !== undefined && (obj.authority = message.authority);
    return obj;
  },

  fromPartial(object: Partial<MsgExecLegacyContent>): MsgExecLegacyContent {
    const message = createBaseMsgExecLegacyContent();
    message.content =
      object.content !== undefined && object.content !== null
        ? Any.fromPartial(object.content)
        : undefined;
    message.authority = object.authority ?? '';
    return message;
  },

  fromSDK(object: MsgExecLegacyContentSDKType): MsgExecLegacyContent {
    return {
      content: isSet(object.content) ? Any.fromSDK(object.content) : undefined,
      authority: isSet(object.authority) ? object.authority : undefined,
    };
  },
};

function createBaseMsgExecLegacyContentResponse(): MsgExecLegacyContentResponse {
  return {};
}

export const MsgExecLegacyContentResponse = {
  encode(
    _: MsgExecLegacyContentResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): MsgExecLegacyContentResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMsgExecLegacyContentResponse();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(_: any): MsgExecLegacyContentResponse {
    return {};
  },

  toJSON(_: MsgExecLegacyContentResponse): unknown {
    const obj: any = {};
    return obj;
  },

  fromPartial(
    _: Partial<MsgExecLegacyContentResponse>
  ): MsgExecLegacyContentResponse {
    const message = createBaseMsgExecLegacyContentResponse();
    return message;
  },

  fromSDK(
    _: MsgExecLegacyContentResponseSDKType
  ): MsgExecLegacyContentResponse {
    return {};
  },
};

function createBaseMsgVote(): MsgVote {
  return {
    proposalId: Long.UZERO,
    voter: '',
    option: 0,
    metadata: '',
  };
}

export const MsgVote = {
  encode(
    message: MsgVote,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (!message.proposalId.isZero()) {
      writer.uint32(8).uint64(message.proposalId);
    }

    if (message.voter !== '') {
      writer.uint32(18).string(message.voter);
    }

    if (message.option !== 0) {
      writer.uint32(24).int32(message.option);
    }

    if (message.metadata !== '') {
      writer.uint32(34).string(message.metadata);
    }

    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MsgVote {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMsgVote();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.proposalId = reader.uint64() as Long;
          break;

        case 2:
          message.voter = reader.string();
          break;

        case 3:
          message.option = reader.int32() as any;
          break;

        case 4:
          message.metadata = reader.string();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object: any): MsgVote {
    return {
      proposalId: isSet(object.proposalId)
        ? Long.fromValue(object.proposalId)
        : Long.UZERO,
      voter: isSet(object.voter) ? String(object.voter) : '',
      option: isSet(object.option) ? voteOptionFromJSON(object.option) : 0,
      metadata: isSet(object.metadata) ? String(object.metadata) : '',
    };
  },

  toJSON(message: MsgVote): unknown {
    const obj: any = {};
    message.proposalId !== undefined &&
      (obj.proposalId = (message.proposalId || Long.UZERO).toString());
    message.voter !== undefined && (obj.voter = message.voter);
    message.option !== undefined &&
      (obj.option = voteOptionToJSON(message.option));
    message.metadata !== undefined && (obj.metadata = message.metadata);
    return obj;
  },

  fromPartial(object: Partial<MsgVote>): MsgVote {
    const message = createBaseMsgVote();
    message.proposalId =
      object.proposalId !== undefined && object.proposalId !== null
        ? Long.fromValue(object.proposalId)
        : Long.UZERO;
    message.voter = object.voter ?? '';
    message.option = object.option ?? 0;
    message.metadata = object.metadata ?? '';
    return message;
  },

  fromSDK(object: MsgVoteSDKType): MsgVote {
    return {
      proposalId: isSet(object.proposal_id) ? object.proposal_id : undefined,
      voter: isSet(object.voter) ? object.voter : undefined,
      option: isSet(object.option) ? voteOptionFromJSON(object.option) : 0,
      metadata: isSet(object.metadata) ? object.metadata : undefined,
    };
  },
};

function createBaseMsgVoteResponse(): MsgVoteResponse {
  return {};
}

export const MsgVoteResponse = {
  encode(
    _: MsgVoteResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MsgVoteResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMsgVoteResponse();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(_: any): MsgVoteResponse {
    return {};
  },

  toJSON(_: MsgVoteResponse): unknown {
    const obj: any = {};
    return obj;
  },

  fromPartial(_: Partial<MsgVoteResponse>): MsgVoteResponse {
    const message = createBaseMsgVoteResponse();
    return message;
  },

  fromSDK(_: MsgVoteResponseSDKType): MsgVoteResponse {
    return {};
  },
};

function createBaseMsgVoteWeighted(): MsgVoteWeighted {
  return {
    proposalId: Long.UZERO,
    voter: '',
    options: [],
    metadata: '',
  };
}

export const MsgVoteWeighted = {
  encode(
    message: MsgVoteWeighted,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (!message.proposalId.isZero()) {
      writer.uint32(8).uint64(message.proposalId);
    }

    if (message.voter !== '') {
      writer.uint32(18).string(message.voter);
    }

    for (const v of message.options) {
      WeightedVoteOption.encode(v!, writer.uint32(26).fork()).ldelim();
    }

    if (message.metadata !== '') {
      writer.uint32(34).string(message.metadata);
    }

    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MsgVoteWeighted {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMsgVoteWeighted();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.proposalId = reader.uint64() as Long;
          break;

        case 2:
          message.voter = reader.string();
          break;

        case 3:
          message.options.push(
            WeightedVoteOption.decode(reader, reader.uint32())
          );
          break;

        case 4:
          message.metadata = reader.string();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object: any): MsgVoteWeighted {
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

  toJSON(message: MsgVoteWeighted): unknown {
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

  fromPartial(object: Partial<MsgVoteWeighted>): MsgVoteWeighted {
    const message = createBaseMsgVoteWeighted();
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

  fromSDK(object: MsgVoteWeightedSDKType): MsgVoteWeighted {
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

function createBaseMsgVoteWeightedResponse(): MsgVoteWeightedResponse {
  return {};
}

export const MsgVoteWeightedResponse = {
  encode(
    _: MsgVoteWeightedResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): MsgVoteWeightedResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMsgVoteWeightedResponse();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(_: any): MsgVoteWeightedResponse {
    return {};
  },

  toJSON(_: MsgVoteWeightedResponse): unknown {
    const obj: any = {};
    return obj;
  },

  fromPartial(_: Partial<MsgVoteWeightedResponse>): MsgVoteWeightedResponse {
    const message = createBaseMsgVoteWeightedResponse();
    return message;
  },

  fromSDK(_: MsgVoteWeightedResponseSDKType): MsgVoteWeightedResponse {
    return {};
  },
};

function createBaseMsgDeposit(): MsgDeposit {
  return {
    proposalId: Long.UZERO,
    depositor: '',
    amount: [],
  };
}

export const MsgDeposit = {
  encode(
    message: MsgDeposit,
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

  decode(input: _m0.Reader | Uint8Array, length?: number): MsgDeposit {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMsgDeposit();

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

  fromJSON(object: any): MsgDeposit {
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

  toJSON(message: MsgDeposit): unknown {
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

  fromPartial(object: Partial<MsgDeposit>): MsgDeposit {
    const message = createBaseMsgDeposit();
    message.proposalId =
      object.proposalId !== undefined && object.proposalId !== null
        ? Long.fromValue(object.proposalId)
        : Long.UZERO;
    message.depositor = object.depositor ?? '';
    message.amount = object.amount?.map((e) => Coin.fromPartial(e)) || [];
    return message;
  },

  fromSDK(object: MsgDepositSDKType): MsgDeposit {
    return {
      proposalId: isSet(object.proposal_id) ? object.proposal_id : undefined,
      depositor: isSet(object.depositor) ? object.depositor : undefined,
      amount: Array.isArray(object?.amount)
        ? object.amount.map((e: any) => Coin.fromSDK(e))
        : [],
    };
  },
};

function createBaseMsgDepositResponse(): MsgDepositResponse {
  return {};
}

export const MsgDepositResponse = {
  encode(
    _: MsgDepositResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MsgDepositResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMsgDepositResponse();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(_: any): MsgDepositResponse {
    return {};
  },

  toJSON(_: MsgDepositResponse): unknown {
    const obj: any = {};
    return obj;
  },

  fromPartial(_: Partial<MsgDepositResponse>): MsgDepositResponse {
    const message = createBaseMsgDepositResponse();
    return message;
  },

  fromSDK(_: MsgDepositResponseSDKType): MsgDepositResponse {
    return {};
  },
};

function createBaseMsgUpdateParams(): MsgUpdateParams {
  return {
    authority: '',
    params: undefined,
  };
}

export const MsgUpdateParams = {
  encode(
    message: MsgUpdateParams,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.authority !== '') {
      writer.uint32(10).string(message.authority);
    }

    if (message.params !== undefined) {
      Params.encode(message.params, writer.uint32(18).fork()).ldelim();
    }

    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MsgUpdateParams {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMsgUpdateParams();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.authority = reader.string();
          break;

        case 2:
          message.params = Params.decode(reader, reader.uint32());
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object: any): MsgUpdateParams {
    return {
      authority: isSet(object.authority) ? String(object.authority) : '',
      params: isSet(object.params) ? Params.fromJSON(object.params) : undefined,
    };
  },

  toJSON(message: MsgUpdateParams): unknown {
    const obj: any = {};
    message.authority !== undefined && (obj.authority = message.authority);
    message.params !== undefined &&
      (obj.params = message.params ? Params.toJSON(message.params) : undefined);
    return obj;
  },

  fromPartial(object: Partial<MsgUpdateParams>): MsgUpdateParams {
    const message = createBaseMsgUpdateParams();
    message.authority = object.authority ?? '';
    message.params =
      object.params !== undefined && object.params !== null
        ? Params.fromPartial(object.params)
        : undefined;
    return message;
  },

  fromSDK(object: MsgUpdateParamsSDKType): MsgUpdateParams {
    return {
      authority: isSet(object.authority) ? object.authority : undefined,
      params: isSet(object.params) ? Params.fromSDK(object.params) : undefined,
    };
  },
};

function createBaseMsgUpdateParamsResponse(): MsgUpdateParamsResponse {
  return {};
}

export const MsgUpdateParamsResponse = {
  encode(
    _: MsgUpdateParamsResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): MsgUpdateParamsResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMsgUpdateParamsResponse();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(_: any): MsgUpdateParamsResponse {
    return {};
  },

  toJSON(_: MsgUpdateParamsResponse): unknown {
    const obj: any = {};
    return obj;
  },

  fromPartial(_: Partial<MsgUpdateParamsResponse>): MsgUpdateParamsResponse {
    const message = createBaseMsgUpdateParamsResponse();
    return message;
  },

  fromSDK(_: MsgUpdateParamsResponseSDKType): MsgUpdateParamsResponse {
    return {};
  },
};

function createBaseMsgCancelProposal(): MsgCancelProposal {
  return {
    proposalId: Long.UZERO,
    proposer: '',
  };
}

export const MsgCancelProposal = {
  encode(
    message: MsgCancelProposal,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (!message.proposalId.isZero()) {
      writer.uint32(8).uint64(message.proposalId);
    }

    if (message.proposer !== '') {
      writer.uint32(18).string(message.proposer);
    }

    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MsgCancelProposal {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMsgCancelProposal();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.proposalId = reader.uint64() as Long;
          break;

        case 2:
          message.proposer = reader.string();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object: any): MsgCancelProposal {
    return {
      proposalId: isSet(object.proposalId)
        ? Long.fromValue(object.proposalId)
        : Long.UZERO,
      proposer: isSet(object.proposer) ? String(object.proposer) : '',
    };
  },

  toJSON(message: MsgCancelProposal): unknown {
    const obj: any = {};
    message.proposalId !== undefined &&
      (obj.proposalId = (message.proposalId || Long.UZERO).toString());
    message.proposer !== undefined && (obj.proposer = message.proposer);
    return obj;
  },

  fromPartial(object: Partial<MsgCancelProposal>): MsgCancelProposal {
    const message = createBaseMsgCancelProposal();
    message.proposalId =
      object.proposalId !== undefined && object.proposalId !== null
        ? Long.fromValue(object.proposalId)
        : Long.UZERO;
    message.proposer = object.proposer ?? '';
    return message;
  },

  fromSDK(object: MsgCancelProposalSDKType): MsgCancelProposal {
    return {
      proposalId: isSet(object.proposal_id) ? object.proposal_id : undefined,
      proposer: isSet(object.proposer) ? object.proposer : undefined,
    };
  },
};

function createBaseMsgCancelProposalResponse(): MsgCancelProposalResponse {
  return {
    proposalId: Long.UZERO,
    canceledTime: undefined,
    canceledHeight: Long.UZERO,
  };
}

export const MsgCancelProposalResponse = {
  encode(
    message: MsgCancelProposalResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (!message.proposalId.isZero()) {
      writer.uint32(8).uint64(message.proposalId);
    }

    if (message.canceledTime !== undefined) {
      Timestamp.encode(message.canceledTime, writer.uint32(18).fork()).ldelim();
    }

    if (!message.canceledHeight.isZero()) {
      writer.uint32(24).uint64(message.canceledHeight);
    }

    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): MsgCancelProposalResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMsgCancelProposalResponse();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.proposalId = reader.uint64() as Long;
          break;

        case 2:
          message.canceledTime = Timestamp.decode(reader, reader.uint32());
          break;

        case 3:
          message.canceledHeight = reader.uint64() as Long;
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object: any): MsgCancelProposalResponse {
    return {
      proposalId: isSet(object.proposalId)
        ? Long.fromValue(object.proposalId)
        : Long.UZERO,
      canceledTime: isSet(object.canceledTime)
        ? fromJsonTimestamp(object.canceledTime)
        : undefined,
      canceledHeight: isSet(object.canceledHeight)
        ? Long.fromValue(object.canceledHeight)
        : Long.UZERO,
    };
  },

  toJSON(message: MsgCancelProposalResponse): unknown {
    const obj: any = {};
    message.proposalId !== undefined &&
      (obj.proposalId = (message.proposalId || Long.UZERO).toString());
    message.canceledTime !== undefined &&
      (obj.canceledTime = fromTimestamp(message.canceledTime).toISOString());
    message.canceledHeight !== undefined &&
      (obj.canceledHeight = (message.canceledHeight || Long.UZERO).toString());
    return obj;
  },

  fromPartial(
    object: Partial<MsgCancelProposalResponse>
  ): MsgCancelProposalResponse {
    const message = createBaseMsgCancelProposalResponse();
    message.proposalId =
      object.proposalId !== undefined && object.proposalId !== null
        ? Long.fromValue(object.proposalId)
        : Long.UZERO;
    message.canceledTime =
      object.canceledTime !== undefined && object.canceledTime !== null
        ? Timestamp.fromPartial(object.canceledTime)
        : undefined;
    message.canceledHeight =
      object.canceledHeight !== undefined && object.canceledHeight !== null
        ? Long.fromValue(object.canceledHeight)
        : Long.UZERO;
    return message;
  },

  fromSDK(object: MsgCancelProposalResponseSDKType): MsgCancelProposalResponse {
    return {
      proposalId: isSet(object.proposal_id) ? object.proposal_id : undefined,
      canceledTime: isSet(object.canceled_time)
        ? Timestamp.fromSDK(object.canceled_time)
        : undefined,
      canceledHeight: isSet(object.canceled_height)
        ? object.canceled_height
        : undefined,
    };
  },
};
