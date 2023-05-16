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
  chainId: string,
  data: IEventData
): IEventLabel => {
  switch (data.kind) {
    case EventKind.Approval:
      return {
        heading: 'Approval',
        label: `Owner ${fmtAddr(data.owner)} approved spender ${fmtAddr(
          data.spender
        )}
        to spend ${data.value}.`,
      };
    case EventKind.Transfer:
      return {
        heading: 'Transfer',
        label: `Transfer of ${data.value} on ${chainId} from ${data.from} to ${data.to}.`,
        icon: 'transfer',
      };
    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustiveMatch: never = data;
      throw new Error(
        `[${SupportedNetwork.ERC20}::${chainId}]: Unknown event type`
      );
    }
  }
};
