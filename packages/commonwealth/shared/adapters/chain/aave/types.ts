import type { AaveTypes } from 'chain-events/src/types';
import type { ICompletable } from '../../shared';

export type IAaveProposalResponse = Omit<AaveTypes.IProposalCreated, 'kind'> &
  ICompletable & {
    executionTime?: number;
    queued: boolean;
    executed: boolean;
    cancelled: boolean;
  };
