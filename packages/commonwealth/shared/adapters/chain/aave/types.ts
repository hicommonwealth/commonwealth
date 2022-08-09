import { AaveTypes } from 'chain-events/src';
import { ICompletable } from '../../shared';

export type IAaveProposalResponse = Omit<AaveTypes.IProposalCreated, 'kind'> & ICompletable & {
  executionTime?: number;
  queued: boolean;
  executed: boolean;
  cancelled: boolean;
};
