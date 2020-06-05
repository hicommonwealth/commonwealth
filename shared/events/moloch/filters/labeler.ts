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
      label: '',
    };
    case MolochEventKind.SubmitVote: return {
      heading: 'Vote Submitted',
      label: '',
    };
    case MolochEventKind.ProcessProposal: return {
      heading: 'Proposal Processed',
      label: '',
    };
    case MolochEventKind.Ragequit: return {
      heading: 'Member Ragequit',
      label: '',
    };
    case MolochEventKind.Abort: return {
      heading: 'Proposal Aborted',
      label: '',
    };
    case MolochEventKind.UpdateDelegateKey: return {
      heading: 'Delegate Key Updated',
      label: '',
    };
    // this event should never appear
    case MolochEventKind.SummonComplete: return {
      heading: 'Summon Complete',
      label: `Moloch is summoned, by user ${fmtAddr(data.summoner)} with ${data.shares}!`,
    };
    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      const _exhaustiveMatch: never = data;
      throw new Error('unknown event type');
    }
  }
};

export default labelMolochEvent;
