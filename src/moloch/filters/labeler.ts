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
    case EventKind.SubmitProposal: return {
      heading: 'Proposal Submitted',
      label: `Member ${fmtAddr(data.member)} submitted proposal with index ${data.proposalIndex}.`,
      linkUrl: chainId ? `/${chainId}/proposal/molochproposal/${data.proposalIndex}` : null,
    };
    case EventKind.SubmitVote: return {
      heading: 'Vote Submitted',
      label: `A vote was received on proposal ${data.proposalIndex}.`,
      linkUrl: chainId ? `/${chainId}/proposal/molochproposal/${data.proposalIndex}` : null,
    };
    case EventKind.ProcessProposal: return {
      heading: 'Proposal Processed',
      label: `Proposal ${data.proposalIndex} was processed.`,
      linkUrl: chainId ? `/${chainId}/proposal/molochproposal/${data.proposalIndex}` : null,
    };
    case EventKind.Ragequit: return {
      heading: 'Member Ragequit',
      label: `Member ${fmtAddr(data.member)} ragequit and burned ${data.sharesToBurn} shares.`,
      linkUrl: chainId ? `/${chainId}/account/${data.member}` : null,
    };
    case EventKind.Abort: return {
      heading: 'Proposal Aborted',
      label: `Proposal ${data.proposalIndex} was aborted by applicant ${fmtAddr(data.applicant)}.`,
      linkUrl: chainId ? `/${chainId}/proposal/molochproposal/${data.proposalIndex}` : null,
    };
    case EventKind.UpdateDelegateKey: return {
      heading: 'Delegate Key Updated',
      label: `Member ${fmtAddr(data.member)} updated their delegate to ${fmtAddr(data.newDelegateKey)}.`,
      linkUrl: chainId ? `/${chainId}/account/${data.member}` : null,
    };
    // this event should never appear
    case EventKind.SummonComplete: return {
      heading: 'Summon Complete',
      label: `Moloch is summoned, by user ${fmtAddr(data.summoner)} with ${data.shares}!`,
      linkUrl: chainId ? `/${chainId}/account/${data.summoner}` : null,
    };
    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      const _exhaustiveMatch: never = data;
      throw new Error('unknown event type');
    }
  }
};
