import { Coin } from 'adapters/currency';
import type { ICompletable, IIdentifiable } from 'adapters/shared';
import type BN from 'bn.js';
import type moment from 'moment';

export class CosmosToken extends Coin {
  constructor(denom: string, n: number | string | BN, inDollars = false) {
    if (typeof n === 'string') {
      n = parseInt(n, 10);
    }
    if (inDollars) {
      throw new Error('cannot create cosmos token in dollars!');
    }
    super(denom, n, inDollars);
  }

  get inDollars(): number {
    return +this;
  }

  public toCoinObject(): CoinObject {
    return {
      denom: this.denom,
      amount: this.toString(),
    };
  }
}

export type CoinObject = {
  denom: string;
  amount: string;
};

export type CosmosProposalType =
  | 'text'
  | 'upgrade'
  | 'parameter'
  | 'communitySpend';
export type CosmosVoteChoice = 'Yes' | 'No' | 'NoWithVeto' | 'Abstain';
export type CosmosProposalState =
  | 'Unspecified'
  | 'DepositPeriod'
  | 'VotingPeriod'
  | 'Passed'
  | 'Rejected'
  | 'Failed'
  | 'Unrecognized';

export interface ICosmosProposalTally {
  yes: BN;
  abstain: BN;
  no: BN;
  noWithVeto: BN;
}

// TODO: note that these vote number values are in terms of _stake_
export interface ICosmosProposalState extends ICompletable {
  status: CosmosProposalState;
  depositors: Array<[string, BN]>;
  totalDeposit: BN;
  voters: Array<[string, CosmosVoteChoice]>;
  tally: ICosmosProposalTally;
}

export interface ICosmosProposal extends IIdentifiable {
  type: CosmosProposalType;
  title: string;
  description: string;
  messages?: any[]; // v1 only
  proposer: string;
  spendRecipient?: string;
  spendAmount?: CoinObject[];
  submitTime: moment.Moment;
  depositEndTime: moment.Moment;
  votingStartTime: moment.Moment;
  votingEndTime: moment.Moment;
  metadata?: string; // v1 only

  // partially populated initial state update -- no depositors or voters
  state: ICosmosProposalState;
}
