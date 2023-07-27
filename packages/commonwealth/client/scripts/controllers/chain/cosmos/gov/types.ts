import { CosmosToken, CosmosVoteChoice, ICosmosProposalTally } from '../types';
import BN from 'bn.js';

// Used to invalidate cache for React Query
export interface DepositParamsQueryResponse {
  minDeposit: CosmosToken;
  maxDepositPeriodS: number;
}

export interface TallyParamsQueryResponse {
  yesThreshold: number;
  vetoThreshold: number;
}

export interface VotingParamsQueryResponse {
  votingPeriodS: number;
}

export interface VoteInfoQueryResponse {
  depositors: Array<[string, BN]>;
  tally: ICosmosProposalTally;
  voters: Array<[string, CosmosVoteChoice]>;
}
