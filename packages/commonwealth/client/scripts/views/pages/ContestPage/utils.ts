import moment from 'moment';
import { Contest } from 'views/pages/CommunityManagement/Contests/ContestsList';

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
