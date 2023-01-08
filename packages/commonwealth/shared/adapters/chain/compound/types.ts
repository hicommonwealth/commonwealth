import type { CompoundTypes } from 'chain-events/src';
import type { ICompletable } from '../../shared';

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
