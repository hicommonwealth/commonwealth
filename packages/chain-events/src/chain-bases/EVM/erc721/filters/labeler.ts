import { BigNumber } from 'ethers';

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
    case EventKind.Approval: {
      // check to see if owner disapproves all addresses
      let label = '';
      if (!BigNumber.from(data.approved).isZero()) {
        label = `Owner ${fmtAddr(data.owner)} approved ${fmtAddr(data.approved)}
        to transfer token ${data.tokenId}.`;
      } else {
        label = `Owner ${fmtAddr(data.owner)} disapproved any address
          previously able to transfer token ${data.tokenId}.`;
      }
      return {
        heading: 'Approval',
        label,
      };
    }
    case EventKind.ApprovalForAll: {
      // check to see if owner disapproves all addresses
      let label = '';
      if (data.approved) {
        label = `Owner ${fmtAddr(data.owner)} approved operator ${fmtAddr(
          data.operator
        )}
        to transfer all of their tokens.`;
      } else {
        label = `Owner ${fmtAddr(data.owner)} has disapproved ${fmtAddr(
          data.operator
        )}
          from transferring any of their tokens.`;
      }
      return {
        heading: 'Approval For All',
        label,
      };
    }
    case EventKind.Transfer:
      return {
        heading: 'Transfer',
        label: `Transfer of ${data.tokenId} on ${chainId} from ${data.from} to ${data.to}.`,
        icon: 'transfer',
      };
    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustiveMatch: never = data;
      throw new Error(
        `[${SupportedNetwork.ERC721}::${chainId}]: Unknown event type`
      );
    }
  }
};
