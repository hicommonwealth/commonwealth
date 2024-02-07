import type { IProposalCreated, IVoteEmitted } from '../../../chain/types/aave';
import type { ICompletable } from '../../shared';
import { BigNumber } from 'ethers';

export type IAaveProposalResponse = Omit<IProposalCreated, 'kind'> &
  ICompletable & {
    executionTime?: number;
    queued: boolean;
    executed: boolean;
    cancelled: boolean;
    minimumQuorum: BigNumber;
    minimumDiff: BigNumber;
    votingSupplyAtStart: BigNumber;
    forVotes: BigNumber;
    againstVotes: BigNumber;
    executionTimeWithGracePeriod: BigNumber;
  };

export type IAaveVoteResponse = Omit<IVoteEmitted, 'kind'>;
