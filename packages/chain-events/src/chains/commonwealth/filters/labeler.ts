import moment from 'moment';

import {
  LabelerFilter,
  IEventLabel,
  SupportedNetwork,
} from '../../../interfaces';
import { IEventData, EventKind } from '../types';

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
  data: IEventData,
  chain?: string
): IEventLabel => {
  switch (data.kind) {
    // TODO: snag link URLs from Created
    // TODO: improve these
    case EventKind.ProjectCreated: {
      return {
        heading: 'Project Created',
        label: `Project "${data.name}" was created.`,
      };
    }
    case EventKind.ProjectBacked: {
      return {
        heading: 'Project Backed',
        label: `Project backed by ${fmtAddr(data.sender)}.`,
      };
    }
    case EventKind.ProjectCurated: {
      return {
        heading: 'Project Curated',
        label: `Project curated by ${fmtAddr(data.sender)}.`,
      };
    }
    case EventKind.ProjectSucceeded: {
      return {
        heading: 'Project Succeeded',
        label: `Project ${fmtAddr(data.id)} succeeded!.`,
      };
    }
    case EventKind.ProjectFailed: {
      return {
        heading: 'Project Failed',
        label: `Project ${fmtAddr(data.id)} failed.`,
      };
    }
    case EventKind.ProjectWithdraw: {
      return {
        heading: 'Project Withdraw',
        label: `Project withdrawal by ${fmtAddr(data.sender)}, for reason: "${
          data.withdrawalType
        }"`,
      };
    }
    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustiveMatch: never = data;
      throw new Error(
        `[${SupportedNetwork.Commonwealth}${
          chain ? `::${chain}` : ''
        }]: Unknown event type!`
      );
    }
  }
};
