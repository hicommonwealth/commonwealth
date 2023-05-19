import type { LabelerFilter, IEventLabel } from '../../../../interfaces';
import { SupportedNetwork } from '../../../../interfaces';
import type { IEventData } from '../types';
import { EventKind } from '../types';

/**
 * This a labeler function, which takes event data and describes it in "plain english",
 * such that we can display a notification regarding its contents.
 */
export const Label: LabelerFilter = (
  blockNumber: number,
  communityId: string,
  data: IEventData,
  origin?: string
): IEventLabel => {
  switch (data.kind) {
    case EventKind.ProposalCanceled: {
      return {
        heading: 'Proposal Canceled',
        label: `Proposal ${data.id} was cancelled.`,
        linkUrl: communityId
          ? `/${communityId}/proposal/compoundproposal/${data.id}`
          : null,
      };
    }
    case EventKind.ProposalCreated: {
      return {
        heading: 'Proposal Created',
        label: `Proposal ${data.id} was created.`,
        linkUrl: communityId
          ? `/${communityId}/proposal/compoundproposal/${data.id}`
          : null,
      };
    }
    case EventKind.ProposalExecuted: {
      return {
        heading: 'Proposal Executed',
        label: `Proposal ${data.id} was executed.`,
        linkUrl: communityId
          ? `/${communityId}/proposal/compoundproposal/${data.id}`
          : null,
      };
    }
    case EventKind.ProposalQueued: {
      return {
        heading: 'Proposal Queued',
        label: `Proposal ${data.id} queued up. ETA: Block ${data.eta}.`,
        linkUrl: communityId
          ? `/${communityId}/proposal/compoundproposal/${data.id}`
          : null,
      };
    }
    case EventKind.VoteCast: {
      return {
        heading: 'Vote Cast',
        label: `Voter (${data.voter}) cast ${data.votes} votes ${
          data.support ? 'not' : null
        } in support of proposal ${data.id}.`,
        linkUrl: communityId
          ? `/${communityId}/proposal/compoundproposal/${data.id}`
          : null,
        icon: 'vote',
      };
    }
    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustiveMatch: never = data;
      throw new Error(
        `[${SupportedNetwork.Compound}${
          origin ? `::${origin}` : ''
        }]: Unknown event type`
      );
    }
  }
};
