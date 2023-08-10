import type { AaveTypes } from 'chain-events/src/types';
import type { ICompletable } from '../../shared';
import { BigNumber } from 'ethers';

export type IAaveProposalResponse = Omit<AaveTypes.IProposalCreated, 'kind'> &
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
  };
