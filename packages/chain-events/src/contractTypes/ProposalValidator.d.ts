/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import type {
  ethers,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  CallOverrides} from "ethers";
import {
  EventFilter,
  Contract,
  ContractTransaction
} from "ethers";
import type { BytesLike } from "@ethersproject/bytes";
import type { Listener, Provider } from "@ethersproject/providers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import { EventFragment } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface ProposalValidatorInterface extends ethers.utils.Interface {
  functions: {
    "MINIMUM_QUORUM()": FunctionFragment;
    "ONE_HUNDRED_WITH_PRECISION()": FunctionFragment;
    "PROPOSITION_THRESHOLD()": FunctionFragment;
    "VOTE_DIFFERENTIAL()": FunctionFragment;
    "VOTING_DURATION()": FunctionFragment;
    "getMinimumPropositionPowerNeeded(address,uint256)": FunctionFragment;
    "getMinimumVotingPowerNeeded(uint256)": FunctionFragment;
    "isProposalPassed(address,uint256)": FunctionFragment;
    "isPropositionPowerEnough(address,address,uint256)": FunctionFragment;
    "isQuorumValid(address,uint256)": FunctionFragment;
    "isVoteDifferentialValid(address,uint256)": FunctionFragment;
    "validateCreatorOfProposal(address,address,uint256)": FunctionFragment;
    "validateProposalCancellation(address,address,uint256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "MINIMUM_QUORUM",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "ONE_HUNDRED_WITH_PRECISION",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "PROPOSITION_THRESHOLD",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "VOTE_DIFFERENTIAL",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "VOTING_DURATION",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getMinimumPropositionPowerNeeded",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getMinimumVotingPowerNeeded",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "isProposalPassed",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "isPropositionPowerEnough",
    values: [string, string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "isQuorumValid",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "isVoteDifferentialValid",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "validateCreatorOfProposal",
    values: [string, string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "validateProposalCancellation",
    values: [string, string, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "MINIMUM_QUORUM",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "ONE_HUNDRED_WITH_PRECISION",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "PROPOSITION_THRESHOLD",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "VOTE_DIFFERENTIAL",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "VOTING_DURATION",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getMinimumPropositionPowerNeeded",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getMinimumVotingPowerNeeded",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isProposalPassed",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isPropositionPowerEnough",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isQuorumValid",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isVoteDifferentialValid",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "validateCreatorOfProposal",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "validateProposalCancellation",
    data: BytesLike
  ): Result;

  events: {};
}

export class ProposalValidator extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: ProposalValidatorInterface;

  functions: {
    MINIMUM_QUORUM(overrides?: CallOverrides): Promise<[BigNumber]>;

    "MINIMUM_QUORUM()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    ONE_HUNDRED_WITH_PRECISION(overrides?: CallOverrides): Promise<[BigNumber]>;

    "ONE_HUNDRED_WITH_PRECISION()"(
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    PROPOSITION_THRESHOLD(overrides?: CallOverrides): Promise<[BigNumber]>;

    "PROPOSITION_THRESHOLD()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    VOTE_DIFFERENTIAL(overrides?: CallOverrides): Promise<[BigNumber]>;

    "VOTE_DIFFERENTIAL()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    VOTING_DURATION(overrides?: CallOverrides): Promise<[BigNumber]>;

    "VOTING_DURATION()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    getMinimumPropositionPowerNeeded(
      governance: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    "getMinimumPropositionPowerNeeded(address,uint256)"(
      governance: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    getMinimumVotingPowerNeeded(
      votingSupply: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    "getMinimumVotingPowerNeeded(uint256)"(
      votingSupply: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    isProposalPassed(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    "isProposalPassed(address,uint256)"(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    isPropositionPowerEnough(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    "isPropositionPowerEnough(address,address,uint256)"(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    isQuorumValid(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    "isQuorumValid(address,uint256)"(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    isVoteDifferentialValid(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    "isVoteDifferentialValid(address,uint256)"(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    validateCreatorOfProposal(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    "validateCreatorOfProposal(address,address,uint256)"(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    validateProposalCancellation(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    "validateProposalCancellation(address,address,uint256)"(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[boolean]>;
  };

  MINIMUM_QUORUM(overrides?: CallOverrides): Promise<BigNumber>;

  "MINIMUM_QUORUM()"(overrides?: CallOverrides): Promise<BigNumber>;

  ONE_HUNDRED_WITH_PRECISION(overrides?: CallOverrides): Promise<BigNumber>;

  "ONE_HUNDRED_WITH_PRECISION()"(overrides?: CallOverrides): Promise<BigNumber>;

  PROPOSITION_THRESHOLD(overrides?: CallOverrides): Promise<BigNumber>;

  "PROPOSITION_THRESHOLD()"(overrides?: CallOverrides): Promise<BigNumber>;

  VOTE_DIFFERENTIAL(overrides?: CallOverrides): Promise<BigNumber>;

  "VOTE_DIFFERENTIAL()"(overrides?: CallOverrides): Promise<BigNumber>;

  VOTING_DURATION(overrides?: CallOverrides): Promise<BigNumber>;

  "VOTING_DURATION()"(overrides?: CallOverrides): Promise<BigNumber>;

  getMinimumPropositionPowerNeeded(
    governance: string,
    blockNumber: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "getMinimumPropositionPowerNeeded(address,uint256)"(
    governance: string,
    blockNumber: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  getMinimumVotingPowerNeeded(
    votingSupply: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "getMinimumVotingPowerNeeded(uint256)"(
    votingSupply: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  isProposalPassed(
    governance: string,
    proposalId: BigNumberish,
    overrides?: CallOverrides
  ): Promise<boolean>;

  "isProposalPassed(address,uint256)"(
    governance: string,
    proposalId: BigNumberish,
    overrides?: CallOverrides
  ): Promise<boolean>;

  isPropositionPowerEnough(
    governance: string,
    user: string,
    blockNumber: BigNumberish,
    overrides?: CallOverrides
  ): Promise<boolean>;

  "isPropositionPowerEnough(address,address,uint256)"(
    governance: string,
    user: string,
    blockNumber: BigNumberish,
    overrides?: CallOverrides
  ): Promise<boolean>;

  isQuorumValid(
    governance: string,
    proposalId: BigNumberish,
    overrides?: CallOverrides
  ): Promise<boolean>;

  "isQuorumValid(address,uint256)"(
    governance: string,
    proposalId: BigNumberish,
    overrides?: CallOverrides
  ): Promise<boolean>;

  isVoteDifferentialValid(
    governance: string,
    proposalId: BigNumberish,
    overrides?: CallOverrides
  ): Promise<boolean>;

  "isVoteDifferentialValid(address,uint256)"(
    governance: string,
    proposalId: BigNumberish,
    overrides?: CallOverrides
  ): Promise<boolean>;

  validateCreatorOfProposal(
    governance: string,
    user: string,
    blockNumber: BigNumberish,
    overrides?: CallOverrides
  ): Promise<boolean>;

  "validateCreatorOfProposal(address,address,uint256)"(
    governance: string,
    user: string,
    blockNumber: BigNumberish,
    overrides?: CallOverrides
  ): Promise<boolean>;

  validateProposalCancellation(
    governance: string,
    user: string,
    blockNumber: BigNumberish,
    overrides?: CallOverrides
  ): Promise<boolean>;

  "validateProposalCancellation(address,address,uint256)"(
    governance: string,
    user: string,
    blockNumber: BigNumberish,
    overrides?: CallOverrides
  ): Promise<boolean>;

  callStatic: {
    MINIMUM_QUORUM(overrides?: CallOverrides): Promise<BigNumber>;

    "MINIMUM_QUORUM()"(overrides?: CallOverrides): Promise<BigNumber>;

    ONE_HUNDRED_WITH_PRECISION(overrides?: CallOverrides): Promise<BigNumber>;

    "ONE_HUNDRED_WITH_PRECISION()"(
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    PROPOSITION_THRESHOLD(overrides?: CallOverrides): Promise<BigNumber>;

    "PROPOSITION_THRESHOLD()"(overrides?: CallOverrides): Promise<BigNumber>;

    VOTE_DIFFERENTIAL(overrides?: CallOverrides): Promise<BigNumber>;

    "VOTE_DIFFERENTIAL()"(overrides?: CallOverrides): Promise<BigNumber>;

    VOTING_DURATION(overrides?: CallOverrides): Promise<BigNumber>;

    "VOTING_DURATION()"(overrides?: CallOverrides): Promise<BigNumber>;

    getMinimumPropositionPowerNeeded(
      governance: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "getMinimumPropositionPowerNeeded(address,uint256)"(
      governance: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getMinimumVotingPowerNeeded(
      votingSupply: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "getMinimumVotingPowerNeeded(uint256)"(
      votingSupply: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    isProposalPassed(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    "isProposalPassed(address,uint256)"(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    isPropositionPowerEnough(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    "isPropositionPowerEnough(address,address,uint256)"(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    isQuorumValid(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    "isQuorumValid(address,uint256)"(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    isVoteDifferentialValid(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    "isVoteDifferentialValid(address,uint256)"(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    validateCreatorOfProposal(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    "validateCreatorOfProposal(address,address,uint256)"(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    validateProposalCancellation(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    "validateProposalCancellation(address,address,uint256)"(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;
  };

  filters: {};

  estimateGas: {
    MINIMUM_QUORUM(overrides?: CallOverrides): Promise<BigNumber>;

    "MINIMUM_QUORUM()"(overrides?: CallOverrides): Promise<BigNumber>;

    ONE_HUNDRED_WITH_PRECISION(overrides?: CallOverrides): Promise<BigNumber>;

    "ONE_HUNDRED_WITH_PRECISION()"(
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    PROPOSITION_THRESHOLD(overrides?: CallOverrides): Promise<BigNumber>;

    "PROPOSITION_THRESHOLD()"(overrides?: CallOverrides): Promise<BigNumber>;

    VOTE_DIFFERENTIAL(overrides?: CallOverrides): Promise<BigNumber>;

    "VOTE_DIFFERENTIAL()"(overrides?: CallOverrides): Promise<BigNumber>;

    VOTING_DURATION(overrides?: CallOverrides): Promise<BigNumber>;

    "VOTING_DURATION()"(overrides?: CallOverrides): Promise<BigNumber>;

    getMinimumPropositionPowerNeeded(
      governance: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "getMinimumPropositionPowerNeeded(address,uint256)"(
      governance: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getMinimumVotingPowerNeeded(
      votingSupply: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "getMinimumVotingPowerNeeded(uint256)"(
      votingSupply: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    isProposalPassed(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "isProposalPassed(address,uint256)"(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    isPropositionPowerEnough(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "isPropositionPowerEnough(address,address,uint256)"(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    isQuorumValid(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "isQuorumValid(address,uint256)"(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    isVoteDifferentialValid(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "isVoteDifferentialValid(address,uint256)"(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    validateCreatorOfProposal(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "validateCreatorOfProposal(address,address,uint256)"(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    validateProposalCancellation(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "validateProposalCancellation(address,address,uint256)"(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    MINIMUM_QUORUM(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "MINIMUM_QUORUM()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    ONE_HUNDRED_WITH_PRECISION(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "ONE_HUNDRED_WITH_PRECISION()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    PROPOSITION_THRESHOLD(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "PROPOSITION_THRESHOLD()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    VOTE_DIFFERENTIAL(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "VOTE_DIFFERENTIAL()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    VOTING_DURATION(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "VOTING_DURATION()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getMinimumPropositionPowerNeeded(
      governance: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "getMinimumPropositionPowerNeeded(address,uint256)"(
      governance: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getMinimumVotingPowerNeeded(
      votingSupply: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "getMinimumVotingPowerNeeded(uint256)"(
      votingSupply: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    isProposalPassed(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "isProposalPassed(address,uint256)"(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    isPropositionPowerEnough(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "isPropositionPowerEnough(address,address,uint256)"(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    isQuorumValid(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "isQuorumValid(address,uint256)"(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    isVoteDifferentialValid(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "isVoteDifferentialValid(address,uint256)"(
      governance: string,
      proposalId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    validateCreatorOfProposal(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "validateCreatorOfProposal(address,address,uint256)"(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    validateProposalCancellation(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "validateProposalCancellation(address,address,uint256)"(
      governance: string,
      user: string,
      blockNumber: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
