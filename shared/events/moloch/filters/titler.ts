import { MolochEventKind } from '../types';
import { IEventTitle, TitlerFilter } from '../../interfaces';

/**
 * This a titler function, not to be confused with the labeler -- it takes a particular
 * kind of event, and returns a "plain english" description of that type. This is used
 * on the client to present a list of subscriptions that a user might want to subscribe to.
 */
const titlerFunc: TitlerFilter = (kind: MolochEventKind): IEventTitle => {
  switch (kind) {
    case MolochEventKind.SubmitProposal: return {
      title: 'Proposal Submitted',
      description: 'A new proposal is submitted.',
    };
    case MolochEventKind.SubmitVote: return {
      title: 'Vote Submitted',
      description: 'A proposal is voted on.',
    };
    case MolochEventKind.ProcessProposal: return {
      title: 'Proposal Processed',
      description: 'A proposal is completed and processed.',
    };
    case MolochEventKind.Ragequit: return {
      title: 'Member Ragequit',
      description: 'A member ragequits.',
    };
    case MolochEventKind.Abort: return {
      title: 'Proposal Aborted',
      description: 'A proposal is aborted by its applicant.',
    };
    case MolochEventKind.UpdateDelegateKey: return {
      title: 'Delegate Key Updated',
      description: 'A member updates their delegate key.',
    };
    case MolochEventKind.SummonComplete: return {
      title: 'Summon Complete',
      description: 'The contract is summoned (never emitted).',
    };
    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      const _exhaustiveMatch: never = kind;
      throw new Error('unknown event type');
    }
  }
};

export default titlerFunc;
