import { ContestView } from 'models/Thread';
import moment from 'moment/moment';

export const getWinnersFromAssociatedContests = (
  associatedContests?: ContestView[],
) => {
  if (!associatedContests) {
    return [];
  }

  return associatedContests
    .map((contest) => {
      const hasEnded = moment(contest.end_time) < moment();
      const isActive = contest.contest_cancelled ? false : !hasEnded;

      if (isActive) {
        return null;
      }

      return {
        date: moment(contest.end_time).format('DD/MM/YYYY'),
        prize:
          contest.score?.findIndex(
            (s) => s.content_id === String(contest.content_id),
          ) + 1,
        // show only for recurring
        round:
          (contest.contest_interval ?? 0) > 0 ? contest.contest_id + 1 : null,
        title: contest.contest_name,
      };
    })
    .filter((el) => el !== null);
};
