import moment from 'moment';
import type { Contest } from '../types/contest';

type ContestRun = NonNullable<Contest['contests']>[number];
type ContestActivitySubject = {
  cancelled?: boolean;
  contests?: Array<Pick<ContestRun, 'end_time'>>;
};

const compareActiveContestRuns = (a: ContestRun, b: ContestRun) => {
  const aEndTime = moment(a.end_time);
  const bEndTime = moment(b.end_time);

  if (aEndTime.isSame(bEndTime)) {
    const aAmount = Number(a.score?.[0]?.prize) || 0;
    const bAmount = Number(b.score?.[0]?.prize) || 0;
    return bAmount - aAmount;
  }

  return aEndTime.diff(bEndTime);
};

const compareFinishedContestRuns = (a: ContestRun, b: ContestRun) => {
  const aEndTime = moment(a.end_time);
  const bEndTime = moment(b.end_time);
  return bEndTime.diff(aEndTime);
};

const buildContestRunWrapper = (contest: Contest, contestRun: ContestRun) =>
  ({
    cancelled: !!contest.cancelled,
    contests: [{ end_time: new Date(contestRun.end_time || '') }],
  }) as Contest;

const mapContestWithRuns = (contest: Contest, contestRuns: ContestRun[]) =>
  ({
    ...contest,
    contests: contestRuns,
  }) as Contest;

// checks if contest has ended or if it is cancelled
export const isContestActive = ({
  contest,
}: {
  contest: ContestActivitySubject;
}) => {
  // first item is the most recent contest
  const { end_time } = contest?.contests?.[0] || {};
  const hasEnded = moment(end_time) < moment();
  return contest?.cancelled ? false : !hasEnded;
};

export const partitionContestsByStatus = (contests: Contest[] | undefined) => {
  const active: Contest[] = [];
  const finished: Contest[] = [];

  (contests || []).forEach((contest) => {
    const activeRuns: ContestRun[] = [];
    const finishedRuns: ContestRun[] = [];

    (contest?.contests || []).forEach((contestRun) => {
      const isActive = contestRun.end_time
        ? isContestActive({
            contest: buildContestRunWrapper(contest, contestRun),
          })
        : false;

      if (isActive) {
        activeRuns.push(contestRun);
        return;
      }

      finishedRuns.push(contestRun);
    });

    activeRuns.sort(compareActiveContestRuns);
    finishedRuns.sort(compareFinishedContestRuns);

    if (activeRuns.length > 0) {
      active.push(mapContestWithRuns(contest, activeRuns));
    }

    if (finishedRuns.length > 0) {
      finished.push(mapContestWithRuns(contest, finishedRuns));
    }
  });

  return {
    activeContests: active,
    finishedContests: finished,
  };
};

export const getActiveContests = (contests: Contest[] | undefined) => {
  const active: Contest[] = [];

  (contests || []).forEach((contest) => {
    const activeRuns = (contest?.contests || []).filter((contestRun) =>
      contestRun.end_time
        ? isContestActive({
            contest: buildContestRunWrapper(contest, contestRun),
          })
        : false,
    );

    activeRuns.sort(compareActiveContestRuns);

    if (activeRuns.length > 0) {
      active.push(mapContestWithRuns(contest, activeRuns));
    }
  });

  return active;
};
