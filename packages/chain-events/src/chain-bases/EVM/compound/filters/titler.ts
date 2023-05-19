import type { IEventTitle, TitlerFilter } from '../../../../interfaces';
import { SupportedNetwork } from '../../../../interfaces';
import { EventKind } from '../types';

/**
 * This a titler function, not to be confused with the labeler -- it takes a particular
 * kind of event, and returns a "plain english" description of that type. This is used
 * on the client to present a list of subscriptions that a user might want to subscribe to.
 */
export const Title: TitlerFilter = (
  kind: EventKind,
  origin?: string
): IEventTitle => {
  switch (kind) {
    case EventKind.ProposalCanceled: {
      return {
        title: 'Proposal cancelled',
        description: 'A proposal has been cancelled.',
      };
    }
    case EventKind.ProposalCreated: {
      return {
        title: 'Proposal created',
        description: 'A proposal has been created.',
      };
    }
    case EventKind.ProposalExecuted: {
      return {
        title: 'Proposal executed',
        description: 'A proposal has been executed.',
      };
    }
    case EventKind.ProposalQueued: {
      return {
        title: 'Proposal queued',
        description: 'A proposal has been added to the queue.',
      };
    }
    case EventKind.VoteCast: {
      return {
        title: 'Vote cast',
        description: 'A new vote has been cast.',
      };
    }
    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustiveMatch: never = kind;
      throw new Error(
        `[${SupportedNetwork.Compound}${
          origin ? `::${origin}` : ''
        }]: Unknown event type`
      );
    }
  }
};
