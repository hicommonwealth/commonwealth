import moment from 'moment';
import { useMemo } from 'react';
import app from 'state';
import { useGetContestsQuery } from 'state/api/contests';
import { useCommunityStake } from 'views/components/CommunityStake';
import { Contest } from 'views/pages/CommunityManagement/Contests/ContestsList';
import { isContestActive } from './utils';

type UseCommunityContestsProps =
  | {
      shouldPolling?: boolean;
      fetchAll?: boolean;
    }
  | undefined;

const useCommunityContests = (props?: UseCommunityContestsProps) => {
  const { shouldPolling = false, fetchAll = false } = props || {};
  const { stakeEnabled } = useCommunityStake();

  const { data: contestsData, isLoading: isContestDataLoading } =
    useGetContestsQuery({
      community_id: app.activeChainId() || '',
      shouldPolling,
      fetchAll,
    });

  const { finishedContests, activeContests } = useMemo(() => {
    const finished: Contest[] = [];
    const active: Contest[] = [];

    (contestsData || []).forEach((contest) => {
      const tempFinishedContests: Pick<Contest, 'contests'>[] = [];
      const tempActiveContests: Pick<Contest, 'contests'>[] = [];

      (contest?.contests || []).map((c) => {
        const end_time = c.end_time || null;

        const isActive = end_time
          ? isContestActive({
              contest: {
                cancelled: !!contest.cancelled,
                contests: [{ end_time: new Date(end_time) }],
              },
            })
          : false;

        if (!isActive) {
          tempFinishedContests.push(c as Pick<Contest, 'contests'>);
        } else {
          tempActiveContests.push(c as Pick<Contest, 'contests'>);
        }
      });

      // Sort active contests by end_date and prize amount
      tempActiveContests.sort((a, b) => {
        const aEndTime = moment(a.contests?.[0]?.end_time);
        const bEndTime = moment(b.contests?.[0]?.end_time);

        if (aEndTime.isSame(bEndTime)) {
          const aAmount = Number(a.contests?.[0]?.score?.[0]?.prize) || 0;
          const bAmount = Number(b.contests?.[0]?.score?.[0]?.prize) || 0;
          return bAmount - aAmount;
        }

        return aEndTime.diff(bEndTime);
      });

      // Sort finished contests by end date (descending)
      tempFinishedContests.sort((a, b) => {
        const aEndTime = moment(a.contests?.[0]?.end_time);
        const bEndTime = moment(b.contests?.[0]?.end_time);
        return bEndTime.diff(aEndTime);
      });

      if (tempActiveContests.length > 0) {
        active.push({
          ...contest,
          contests: tempActiveContests,
        } as unknown as Contest);
      }

      if (tempFinishedContests.length > 0) {
        finished.push({
          ...contest,
          contests: tempFinishedContests,
        } as unknown as Contest);
      }
    });

    return {
      finishedContests: finished,
      activeContests: active,
    };
  }, [contestsData]);

  // @ts-expect-error StrictNullChecks
  const isContestAvailable = !isContestDataLoading && contestsData?.length > 0;

  const getContestByAddress = (contestAddress: string) => {
    return contestsData?.find(
      (contest) => contest.contest_address === contestAddress,
    );
  };

  return {
    stakeEnabled,
    isContestAvailable,
    contestsData: {
      all: contestsData as unknown as Contest[],
      finished: finishedContests,
      active: activeContests,
    },
    isContestDataLoading: isContestDataLoading,
    getContestByAddress,
  };
};

export default useCommunityContests;
