import type { CompoundTypes } from 'chain-events/src/types';
import type { ICompletable } from '../../shared';
import { BigNumber } from 'ethers';

export type ICompoundProposalResponse = Omit<
  CompoundTypes.IProposalCreated,
  'kind'
> &
  ICompletable & {
    eta?: number;
    forVotes: BigNumber;
    againstVotes: BigNumber;
    abstainVotes?: BigNumber;
    state: number;
  };

export type ICompoundVoteResponse = Omit<CompoundTypes.IVoteCast, 'kind'>;
