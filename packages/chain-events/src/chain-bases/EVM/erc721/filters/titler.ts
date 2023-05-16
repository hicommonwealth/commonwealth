import type { IEventTitle, TitlerFilter } from '../../../../interfaces';
import { SupportedNetwork } from '../../../../interfaces';
import { EventKind } from '../types';

/**
 * This a titler function, not to be confused with the labeler -- it takes a particular
 * kind of event, and returns a "plain english" description of that type. This is used
 * on the client to present a list of subscriptions that a user might want to subscribe to.
 */
export const Title: TitlerFilter = (kind: EventKind): IEventTitle => {
  switch (kind) {
    case EventKind.Approval:
      return {
        title: 'Delegation Approved',
        description: 'One account delegated a token to another.',
      };
    case EventKind.ApprovalForAll:
      return {
        title: 'Full Delegation Approved',
        description: 'One account delegated all of its tokens to another.',
      };
    case EventKind.Transfer:
      return {
        title: 'Tokens Transferred',
        description: 'Tokens have been transferred.',
      };
    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustiveMatch: never = kind;
      throw new Error(
        `[${SupportedNetwork.ERC721}]: Unknown event type: ${kind}`
      );
    }
  }
};
