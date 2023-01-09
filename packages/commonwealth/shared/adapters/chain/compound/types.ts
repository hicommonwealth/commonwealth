import { CompoundTypes } from 'chain-events/src/types';
import { ICompletable } from '../../shared';

export type ICompoundProposalResponse = Omit<
  CompoundTypes.IProposalCreated,
  'kind'
> &
  ICompletable & {
    eta?: number;
    queued: boolean;
    executed: boolean;
    cancelled: boolean;
    expired: boolean;
  };
