import { ContestView } from 'models/Thread';
import moment from 'moment/moment';

export const getWinnersFromAssociatedContests = (
  associatedContests?: ContestView[],
) => {
  if (!associatedContests) {
    return [];
  }

  // Deduplicate contests based on content_id and contest_id
  const uniqueContests = Array.from(
    new Map(
      associatedContests.map((contest) => [
        `${contest.content_id}-${contest.contest_id}`,
        contest,
      ]),
    ).values(),
  );

  return uniqueContests
    .map((contest) => {
      const hasEnded = moment(contest.end_time) < moment();
      const isActive = contest.contest_cancelled ? false : !hasEnded;

      if (isActive) {
        return null;
      }

      const prize = contest.score
        ? contest.score.findIndex(
            (s) => s.content_id === String(contest.content_id),
          )
        : 0;

      return {
        date: moment(contest.end_time).format('DD/MM/YYYY'),
        prize: Math.min(0, prize),
        // show only for recurring
        round:
          (contest.contest_interval ?? 0) > 0 ? contest.contest_id + 1 : null,
        title: contest.contest_name,
      };
    })
    .filter((el) => el !== null);
};
