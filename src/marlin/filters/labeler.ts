import { LabelerFilter, IEventLabel } from '../../interfaces';
import { IEventData, EventKind } from '../types';

function fmtAddr(addr : string) {
  if (!addr) return;
  if (addr.length < 16) return addr;
  return `${addr.slice(0, 7)}…${addr.slice(addr.length - 3)}`;
}

/**
 * This a labeler function, which takes event data and describes it in "plain english",
 * such that we can display a notification regarding its contents.
 */
export const Label: LabelerFilter = (
  blockNumber: number,
  chainId: string,
  data: IEventData,
): IEventLabel => {
  switch (data.kind) {
    // MPond events
    case EventKind.Approval: {
      return {
        heading: 'Approval',
        label: `${data.spender} approved ${data.amount} to ${data.owner}.`,
      };
    }
    case EventKind.DelegateChanged: {
      return {
        heading: 'Delegate Changed',
        label: `Delegate (${data.fromDelegate}) has changed to delegate (${data.toDelegate}).`,
      };
    }
    case EventKind.DelegateVotesChanged: {
      return {
        heading: 'Delegate Votes Changed',
        label: `Delegate (${data.delegate}) changed votes from ${data.previousBalance} to ${data.newBalance}.`,
      };
    }
    case EventKind.Transfer: {
      return {
        heading: 'Transfer Occurred',
        label: `Transfer of ${data.amount}LIN from ${data.from} to ${data.to}.`,
      };
    }
    // GovernorAlpha Events
    case EventKind.ProposalCanceled: {
      return {
        heading: 'Proposal Canceled',
        label: `Proposal ${data.id} was cancelled.`,
        linkUrl: chainId ? `/${chainId}/proposal/marlinproposal/${data.id}` : null,
      };
    }
    case EventKind.ProposalCreated: {
      return {
        heading: 'Proposal Created',
        label: `Proposal ${data.id} was created.`,
        linkUrl: chainId ? `/${chainId}/proposal/marlinproposal/${data.id}` : null,
      };
    }
    case EventKind.ProposalExecuted: {
      return {
        heading: 'Proposal Executed',
        label: `Proposal ${data.id} was executed.`,
        linkUrl: chainId ? `/${chainId}/proposal/marlinproposal/${data.id}` : null,
      };
    }
    case EventKind.ProposalQueued: {
      return {
        heading: 'Proposal Queued',
        label: `Proposal ${data.id} queued up. ETA: Block ${data.eta}.`,
        linkUrl: chainId ? `/${chainId}/proposal/marlinproposal/${data.id}` : null,
      };
    }
    case EventKind.VoteCast: {
      return {
        heading: 'Vote Cast',
        label: `Voter (${data.voter}) cast ${data.votes} votes ${data.support ? 'not' : null} in support of proposal ${data.id}.`,
        linkUrl: chainId ? `/${chainId}/proposal/marlinproposal/${data.id}` : null,
      };
    }
    // Timelock events
    case EventKind.CancelTransaction: {
      return {
        heading: 'Transaction Cancelled',
        label: `Transaction ${data.txHash} was cancelled.`,
      };
    }
    case EventKind.ExecuteTransaction: {
      return {
        heading: 'Transaction Executed',
        label: `Transaction ${data.txHash} was executed. ${data.value}LIN was transfered to ${data.target}.`,
      };
    }
    case EventKind.NewAdmin: {
      return {
        heading: 'New Admin',
        label: `New admin: ${data.newAdmin}.`,
      };
    }
    case EventKind.NewDelay: {
      return {
        heading: 'New Delay',
        label: `New delay of ${data.newDelay} length.`,
      };
    }
    case EventKind.NewPendingAdmin: {
      return {
        heading: 'New Pending Admin',
        label: `New pending admin (${data.newPendingAdmin}).`,
      };
    }
    case EventKind.QueueTransaction: {
      return {
        heading: 'Transaction Queued',
        label: `Transaction ${data.txHash} was queued. ETA: Block #${data.eta}.`,
      };
    }
    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      const _exhaustiveMatch: never = data;
      throw new Error('unknown event type');
    }
  }
};