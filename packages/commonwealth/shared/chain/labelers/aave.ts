import moment from 'moment';

import { SupportedNetwork } from '@hicommonwealth/core';
import type { IEventData } from '../types/aave';
import { EventKind } from '../types/aave';
import { IEventLabel, LabelerFilter } from './util';

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
          ? `/${chainId}/proposal/onchainproposal/${data.id}`
          : null,
      };
    }
    case EventKind.ProposalCreated: {
      return {
        heading: 'Proposal Created',
        label: `Proposal ${data.id} was created.`,
        linkUrl: chainId
          ? `/${chainId}/proposal/onchainproposal/${data.id}`
          : null,
      };
    }
    case EventKind.ProposalExecuted: {
      return {
        heading: 'Proposal Executed',
        label: `Proposal ${data.id} was executed.`,
        linkUrl: chainId
          ? `/${chainId}/proposal/onchainproposal/${data.id}`
          : null,
      };
    }
    case EventKind.ProposalQueued: {
      return {
        heading: 'Proposal Queued',
        label: `Proposal ${data.id} queued up. Execution time: ${moment
          .unix(data.executionTime)
          .format()}.`,
        linkUrl: chainId
          ? `/${chainId}/proposal/onchainproposal/${data.id}`
          : null,
      };
    }
    case EventKind.VoteEmitted: {
      return {
        heading: 'Vote Emitted',
        label: `Voter (${data.voter}) voted with weight ${data.votingPower} ${
          data.support ? 'against' : 'for'
        } proposal ${data.id}.`,
        linkUrl: chainId
          ? `/${chainId}/proposal/onchainproposal/${data.id}`
          : null,
        icon: 'vote',
      };
    }
    case EventKind.DelegateChanged: {
      return {
        heading: 'Delegate Changed',
        label: `User ${fmtAddr(data.delegator)} delegated to ${fmtAddr(
          data.delegatee,
        )}.`,
        linkUrl: chainId ? `/${chainId}/account/${data.delegator}` : null,
        icon: 'delegate',
      };
    }
    case EventKind.DelegatedPowerChanged: {
      return {
        heading: 'Delegated Power Changed',
        label: `User ${fmtAddr(data.who)} updated their delegation power.`,
        linkUrl: chainId ? `/${chainId}/account/${data.who}` : null,
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
          chain ? `::${chain}` : ''
        }]: Unknown event type!`,
      );
    }
  }
};
