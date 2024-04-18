import { SupportedNetwork } from '@hicommonwealth/shared';
import type { IEventData } from '../types/compound';
import { EventKind } from '../types/compound';
import { IEventLabel, LabelerFilter } from './util';

/**
 * This a labeler function, which takes event data and describes it in "plain english",
 * such that we can display a notification regarding its contents.
 */
export const Label: LabelerFilter = (
  chainId: string,
  data: IEventData,
  chain?: string,
): IEventLabel => {
  switch (data.kind) {
    case EventKind.ProposalCanceled: {
      return {
        heading: 'Proposal Canceled',
        label: `Proposal ${data.id} was cancelled.`,
        linkUrl: chainId
          ? `/${chainId}/proposal/compoundproposal/${data.id}`
          : null,
      };
    }
    case EventKind.ProposalCreated: {
      return {
        heading: 'Proposal Created',
        label: `Proposal ${data.id} was created.`,
        linkUrl: chainId
          ? `/${chainId}/proposal/compoundproposal/${data.id}`
          : null,
      };
    }
    case EventKind.ProposalExecuted: {
      return {
        heading: 'Proposal Executed',
        label: `Proposal ${data.id} was executed.`,
        linkUrl: chainId
          ? `/${chainId}/proposal/compoundproposal/${data.id}`
          : null,
      };
    }
    case EventKind.ProposalQueued: {
      return {
        heading: 'Proposal Queued',
        label: `Proposal ${data.id} queued up. ETA: Block ${data.eta}.`,
        linkUrl: chainId
          ? `/${chainId}/proposal/compoundproposal/${data.id}`
          : null,
      };
    }
    case EventKind.VoteCast: {
      return {
        heading: 'Vote Cast',
        label: `Voter (${data.voter}) cast ${data.votes} votes ${
          data.support ? 'not' : null
        } in support of proposal ${data.id}.`,
        linkUrl: chainId
          ? `/${chainId}/proposal/compoundproposal/${data.id}`
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
          chain ? `::${chain}` : ''
        }]: Unknown event type`,
      );
    }
  }
};
