import { MarlinTypes } from '@commonwealth/chain-events';
import { ICompletable } from '../../shared';

export type IMarlinProposalResponse = Omit<MarlinTypes.IProposalCreated, 'kind'> & ICompletable & {
  eta?: number;
  queued: boolean;
  executed: boolean;
  cancelled: boolean;
};
