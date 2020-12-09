import { IEventTitle, TitlerFilter } from '../../interfaces';
import { EventKind } from '../types';

/**
 * This a titler function, not to be confused with the labeler -- it takes a particular
 * kind of event, and returns a "plain english" description of that type. This is used
 * on the client to present a list of subscriptions that a user might want to subscribe to.
 */
export const Title: TitlerFilter = (kind: EventKind): IEventTitle => {
  switch (kind) {
    // Comp events
    case EventKind.Approval: {
      return {
        title: 'Comp Approval',
        description: 'An Approval event occurred on Comp Contract.',
      };
    }
    case EventKind.DelegateChanged: {
      return {
        title: 'Delegate Changed',
        description: 'A delegated has been changed.',
      };
    }
    case EventKind.DelegateVotesChanged: {
      return {
        title: 'A Delegate Changed Votes',
        description: 'A delegate changed or added votes.',
      };
    }
    case EventKind.Transfer: {
      return {
        title: 'Tranfer Occurred',
        description: 'Transfer event occurred.',
      };
    }
    // GovernorAlpha Events
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
    // Timelock events
    case EventKind.CancelTransaction: {
      return {
        title: 'Cancel transaction',
        description: 'A transaction has been cancelled.',
      };
    }
    case EventKind.ExecuteTransaction: {
      return {
        title: 'Execute transaction',
        description: 'A transaction has been executed.',
      };
    }
    case EventKind.NewAdmin: {
      return {
        title: 'New admin',
        description: 'A new admin has been confirmed.',
      };
    }
    case EventKind.NewDelay: {
      return {
        title: 'New delay',
        description: 'A new delay has been set.',
      };
    }
    case EventKind.NewPendingAdmin: {
      return {
        title: 'New pending admin',
        description: 'A new admin is pending confirmation.',
      };
    }
    case EventKind.QueueTransaction: {
      return {
        title: 'Queue transaction',
        description: 'A transaction has been added to the queue.',
      };
    }
    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      const _exhaustiveMatch: never = kind;
      throw new Error('unknown event type');
    }
  }
};