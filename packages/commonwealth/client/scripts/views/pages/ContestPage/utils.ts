import type { Contest } from 'features/contests/types/contest';
import moment from 'moment';

export const getSortedContests = (contests: Contest[] | undefined) => {
  return [...(contests || [])].sort(
    (a, b) => moment(a.created_at).valueOf() - moment(b.created_at).valueOf(),
  );
};

export const getCurrentContestIndex = (
  sortedContests: Contest[],
  contestAddress: string,
) => {
  return sortedContests.findIndex((c) => c.contest_address === contestAddress);
};
