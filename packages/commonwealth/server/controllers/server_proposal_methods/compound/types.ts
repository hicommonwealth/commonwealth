import { BigNumber } from 'ethers';

export enum GovVersion {
  Alpha = 'alpha',
  Bravo = 'bravo',
  OzBravo = 'oz-bravo',
  OzCountSimple = 'raw-oz',
}

export type CompoundProposalType = {
  id: BigNumber;
  proposer: string;
  eta: BigNumber;
  startBlock: BigNumber;
  endBlock: BigNumber;
  forVotes: BigNumber;
  againstVotes: BigNumber;
  abstainVotes?: BigNumber;
  canceled: boolean;
  executed: boolean;
};
export type ProposalCreatedEventArgsArray = [
  BigNumber,
  string,
  string[],
  BigNumber[],
  string[],
  string[],
  BigNumber,
  BigNumber,
  string,
];

export type ProposalCreatedEventArgsObject = {
  id: BigNumber;
  proposer: string;
  targets: string[];
  values: BigNumber[];
  signatures: string[];
  calldatas: string[];
  startBlock: BigNumber;
  endBlock: BigNumber;
  description: string;
};

export type ResolvedProposalPromises = [
  ProposalCreatedEventArgsObject[],
  CompoundProposalType[],
  number[],
];

export type ProposalDataType = {
  rawProposal: CompoundProposalType;
  proposalState: number;
  proposalCreatedEvent: ProposalCreatedEventArgsObject;
  identifier?: string;
};

export type CompoundVoteEvents = {
  voter: string;
  proposalId: BigNumber;
  support: boolean;
  votes: BigNumber;
  reason?: string;
};
