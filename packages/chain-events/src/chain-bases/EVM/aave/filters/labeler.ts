import moment from 'moment';

import type { LabelerFilter, IEventLabel } from '../../../../interfaces';
import { SupportedNetwork } from '../../../../interfaces';
import type { IEventData } from '../types';
import { EventKind } from '../types';

function fmtAddr(addr: string) {
  if (!addr) return '';
  if (addr.length < 16) return addr;
  return `${addr.slice(0, 7)}…${addr.slice(addr.length - 3)}`;
}

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
          ? `/${communityId}/proposal/onchainproposal/${data.id}`
          : null,
      };
    }
    case EventKind.ProposalCreated: {
      return {
        heading: 'Proposal Created',
        label: `Proposal ${data.id} was created.`,
        linkUrl: communityId
          ? `/${communityId}/proposal/onchainproposal/${data.id}`
          : null,
      };
    }
    case EventKind.ProposalExecuted: {
      return {
        heading: 'Proposal Executed',
        label: `Proposal ${data.id} was executed.`,
        linkUrl: communityId
          ? `/${communityId}/proposal/onchainproposal/${data.id}`
          : null,
      };
    }
    case EventKind.ProposalQueued: {
      return {
        heading: 'Proposal Queued',
        label: `Proposal ${data.id} queued up. Execution time: ${moment
          .unix(data.executionTime)
          .format()}.`,
        linkUrl: communityId
          ? `/${communityId}/proposal/onchainproposal/${data.id}`
          : null,
      };
    }
    case EventKind.VoteEmitted: {
      return {
        heading: 'Vote Emitted',
        label: `Voter (${data.voter}) voted with weight ${data.votingPower} ${
          data.support ? 'against' : 'for'
        } proposal ${data.id}.`,
        linkUrl: communityId
          ? `/${communityId}/proposal/onchainproposal/${data.id}`
          : null,
        icon: 'vote',
      };
    }
    case EventKind.DelegateChanged: {
      return {
        heading: 'Delegate Changed',
        label: `User ${fmtAddr(data.delegator)} delegated to ${fmtAddr(
          data.delegatee
        )}.`,
        linkUrl: communityId
          ? `/${communityId}/account/${data.delegator}`
          : null,
        icon: 'delegate',
      };
    }
    case EventKind.DelegatedPowerChanged: {
      return {
        heading: 'Delegated Power Changed',
        label: `User ${fmtAddr(data.who)} updated their delegation power.`,
        linkUrl: communityId ? `/${communityId}/account/${data.who}` : null,
        icon: 'delegate',
      };
    }
    case EventKind.Transfer: {
      return {
        heading: 'Token Transfer',
        label: `Transfer of ${data.amount} tokens from ${data.from} to ${data.to}.`,
        icon: 'transfer',
      };
    }
    case EventKind.Approval: {
      return {
        heading: 'Approval',
        label: `${data.spender} approved ${data.amount} to ${data.owner}.`,
      };
    }
    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustiveMatch: never = data;
      throw new Error(
        `[${SupportedNetwork.Aave}${
          origin ? `::${origin}` : ''
        }]: Unknown event type!`
      );
    }
  }
};
