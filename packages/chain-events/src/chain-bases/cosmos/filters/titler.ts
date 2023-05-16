import type { IEventTitle, TitlerFilter } from '../../../interfaces';
import { SupportedNetwork } from '../../../interfaces';
import { EventKind } from '../types';

/**
 * This a titler function, not to be confused with the labeler -- it takes a particular
 * kind of event, and returns a "plain english" description of that type. This is used
 * on the client to present a list of subscriptions that a user might want to subscribe to.
 */
export const Title: TitlerFilter = (kind: EventKind): IEventTitle => {
  switch (kind) {
    case EventKind.SubmitProposal:
      return {
        title: 'Proposal Submitted',
        description: 'A user submits a  proposal.',
      };
    case EventKind.Deposit:
      return {
        title: 'Deposit',
        description: 'A deposit is made on a proposal.',
      };
    case EventKind.Vote:
      return {
        title: 'Vote',
        description: 'A vote is made on a proposal.',
      };
    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustiveMatch: never = kind;
      throw new Error(
        `[${SupportedNetwork.Cosmos}]: Unknown event type: ${kind}`
      );
    }
  }
};
