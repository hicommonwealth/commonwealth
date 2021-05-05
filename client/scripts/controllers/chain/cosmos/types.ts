import BN from 'bn.js';
import { Coin } from 'adapters/currency';
import { IIdentifiable, ICompletable } from 'adapters/shared';

export class CosmosToken extends Coin {
  constructor(denom: string, n: number | string | BN, inDollars: boolean = false) {
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

  public toCoinObject() {
    return { amount: this.toNumber(), denom: this.denom };
  }
}

export type CosmosProposalType = 'text' | 'upgrade' | 'parameter';
export type CosmosVoteChoice = 'Yes' | 'No' | 'NoWithVeto' | 'Abstain';
export type CosmosProposalState = 'DepositPeriod' | 'VotingPeriod' | 'Passed' | 'Rejected';
export interface ICosmosProposalTally {
  yes: BN;
  abstain: BN;
  no: BN;
  noWithVeto: BN;
}

export interface ICosmosProposal extends IIdentifiable {
  type: CosmosProposalType;
  title: string;
  description: string;
  proposer: string;
  submitTime: string; // TODO: moment?
  depositEndTime: string;
  votingStartTime: string; // TODO: moment
  votingEndTime: string;

  // partially populated initial state update -- no depositors or voters
  state: ICosmosProposalState;
}

// TODO: note that these vote number values are in terms of _stake_
export interface ICosmosProposalState extends ICompletable {
  status: CosmosProposalState;
  depositors: Array<[ string, BN ]>;
  totalDeposit: BN;
  voters: Array<[ string, CosmosVoteChoice ]>;
  tally: ICosmosProposalTally;
}
