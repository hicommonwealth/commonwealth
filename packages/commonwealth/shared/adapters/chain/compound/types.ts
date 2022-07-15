import { CompoundTypes } from '@commonwealth/chain-events';
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
