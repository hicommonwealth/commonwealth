import BN from 'bn.js';
import { Coin } from 'adapters/currency';
import { IIdentifiable, ICompletable } from '../../shared';

export class CosmosValidatorToken extends Coin {
  constructor(n: number | string | BN, inDollars: boolean = false) {
    if (typeof n === 'string') {
      n = parseInt(n, 10);
    }
    super('validatortoken', n, inDollars);
  }
}

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

export enum CosmosProposalType {
  'text',
  'upgrade',
  'parameter',
}

export enum CosmosVoteChoice {
  YES = 'Yes',
  NO = 'No',
  VETO = 'NoWithVeto',
  ABSTAIN = 'Abstain',
}

export enum CosmosProposalState {
  DEPOSIT_PERIOD = 'DepositPeriod',
  VOTING_PERIOD = 'VotingPeriod',
  PASSED = 'Passed',
  REJECTED = 'Rejected',
}

export interface ICosmosProposalTally {
  yes: number;
  abstain: number;
  no: number;
  noWithVeto: number;
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
  depositors: Array<[ string, number ]>;
  totalDeposit: number;
  voters: Array<[ string, CosmosVoteChoice ]>;
  tally: ICosmosProposalTally;
}
