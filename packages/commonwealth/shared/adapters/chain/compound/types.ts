import { BigNumber } from 'ethers';
import type {
  IProposalCreated,
  IVoteCast,
} from '../../../chain/types/compound';
import type { ICompletable } from '../../shared';

export type ICompoundProposalResponse = Omit<IProposalCreated, 'kind'> &
  ICompletable & {
    eta?: number;
    forVotes: BigNumber;
    againstVotes: BigNumber;
    abstainVotes?: BigNumber;
    state: number;
  };

export type ICompoundVoteResponse = Omit<IVoteCast, 'kind'>;
