import { SupportedNetwork } from '@hicommonwealth/shared';
import type { IEventData } from '../types/cosmos';
import { EventKind } from '../types/cosmos';
import { IEventLabel, LabelerFilter } from './util';

function fmtAddr(addr: string) {
  if (!addr) return '';
  if (addr.length < 16) return addr;
  return `${addr.slice(0, 9)}…${addr.slice(addr.length - 3)}`;
}

/**
 * This a labeler function, which takes event data and describes it in "plain english",
 * such that we can display a notification regarding its contents.
 */
export const Label: LabelerFilter = (
  chainId: string,
  data: IEventData,
): IEventLabel => {
  switch (data.kind) {
    case EventKind.SubmitProposal:
      return {
        heading: 'Proposal Submitted',
        label: `Proposal ${data.id} was submitted!`,
        linkUrl: chainId ? `/${chainId}/proposal/${data.id}` : null,
      };
    case EventKind.Deposit:
      return {
        heading: 'Deposit',
        label: `${fmtAddr(data.depositor)} made a deposit on proposal ${
          data.id
        }.`,
        linkUrl: chainId ? `/${chainId}/proposal/${data.id}` : null,
      };
    case EventKind.Vote:
      return {
        heading: 'Vote',
        label: `${fmtAddr(data.voter)} voted on proposal ${data.id}.`,
        linkUrl: chainId ? `/${chainId}/proposal/${data.id}` : null,
        icon: 'vote',
      };
    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustiveMatch: never = data;
      throw new Error(
        `[${SupportedNetwork.Cosmos}::${chainId}]: Unknown event type`,
      );
    }
  }
};
