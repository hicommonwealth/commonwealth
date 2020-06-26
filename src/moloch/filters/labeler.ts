import { LabelerFilter, IEventLabel } from '../../interfaces';
import { IMolochEventData, MolochEventKind } from '../types';

function fmtAddr(addr : string) {
  if (!addr) return;
  if (addr.length < 16) return addr;
  return `${addr.slice(0, 7)}…${addr.slice(addr.length - 3)}`;
}

/**
 * This a labeler function, which takes event data and describes it in "plain english",
 * such that we can display a notification regarding its contents.
 */
const labelMolochEvent: LabelerFilter = (
  blockNumber: number,
  chainId: string,
  data: IMolochEventData,
): IEventLabel => {
  switch (data.kind) {
    case MolochEventKind.SubmitProposal: return {
      heading: 'Proposal Submitted',
      label: `Member ${fmtAddr(data.member)} submitted proposal with index ${data.proposalIndex}.`,
      linkUrl: chainId ? `/${chainId}/proposal/molochproposal/${data.proposalIndex}` : null,
    };
    case MolochEventKind.SubmitVote: return {
      heading: 'Vote Submitted',
      label: `A vote was received on proposal ${data.proposalIndex}.`,
      linkUrl: chainId ? `/${chainId}/proposal/molochproposal/${data.proposalIndex}` : null,
    };
    case MolochEventKind.ProcessProposal: return {
      heading: 'Proposal Processed',
      label: `Proposal ${data.proposalIndex} was processed.`,
      linkUrl: chainId ? `/${chainId}/proposal/molochproposal/${data.proposalIndex}` : null,
    };
    case MolochEventKind.Ragequit: return {
      heading: 'Member Ragequit',
      label: `Member ${fmtAddr(data.member)} ragequit and burned ${data.sharesToBurn} shares.`,
      linkUrl: chainId ? `/${chainId}/account/${data.member}` : null,
    };
    case MolochEventKind.Abort: return {
      heading: 'Proposal Aborted',
      label: `Proposal ${data.proposalIndex} was aborted by applicant ${fmtAddr(data.applicant)}.`,
      linkUrl: chainId ? `/${chainId}/proposal/molochproposal/${data.proposalIndex}` : null,
    };
    case MolochEventKind.UpdateDelegateKey: return {
      heading: 'Delegate Key Updated',
      label: `Member ${fmtAddr(data.member)} updated their delegate to ${fmtAddr(data.newDelegateKey)}.`,
      linkUrl: chainId ? `/${chainId}/account/${data.member}` : null,
    };
    // this event should never appear
    case MolochEventKind.SummonComplete: return {
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

export default labelMolochEvent;
