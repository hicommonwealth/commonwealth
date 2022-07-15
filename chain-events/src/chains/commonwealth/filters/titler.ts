import {
  IEventTitle,
  SupportedNetwork,
  TitlerFilter,
} from '../../../interfaces';
import { EventKind } from '../types';

/**
 * This a titler function, not to be confused with the labeler -- it takes a particular
 * kind of event, and returns a "plain english" description of that type. This is used
 * on the client to present a list of subscriptions that a user might want to subscribe to.
 */
export const Title: TitlerFilter = (
  kind: EventKind,
  chain?: string
): IEventTitle => {
  switch (kind) {
    case EventKind.ProjectCreated: {
      return {
        title: 'Project created',
        description: 'A new project has been created.',
      };
    }
    case EventKind.ProjectBacked: {
      return {
        title: 'Project backed',
        description: 'A project has been backed.',
      };
    }
    case EventKind.ProjectCurated: {
      return {
        title: 'Project curated',
        description: 'A project has been curated.',
      };
    }
    case EventKind.ProjectSucceeded: {
      return {
        title: 'Project succeeded',
        description: 'A project succeeds at meeting funding threshold.',
      };
    }
    case EventKind.ProjectFailed: {
      return {
        title: 'Project failed',
        description: 'A project fails to meet funding threshold.',
      };
    }
    case EventKind.ProjectWithdraw: {
      return {
        title: 'Project withdraw',
        description: 'A project has been withdrawn from.',
      };
    }
    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustiveMatch: never = kind;
      throw new Error(
        `[${SupportedNetwork.Commonwealth}${
          chain ? `::${chain}` : ''
        }]: Unknown event type`
      );
    }
  }
};
