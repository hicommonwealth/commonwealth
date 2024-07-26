import { ThreadStage } from 'models/types';
import { EXCEPTION_CASE_threadCountersStore } from '../../../ui/thread';
import { ApiEndpoints, queryClient } from '../../config';

export const updateThreadCountsByStageChange = (currentStage, updatedStage) => {
  let incBy = 0;
  if (currentStage === ThreadStage.Voting) incBy--;
  if (updatedStage === ThreadStage.Voting) incBy++;
  EXCEPTION_CASE_threadCountersStore.setState(
    ({ totalThreadsInCommunityForVoting }) => ({
      totalThreadsInCommunityForVoting:
        totalThreadsInCommunityForVoting + incBy,
    }),
  );
};

export const updateCommunityThreadCount = (
  communityId: string,
  type: 'increment' | 'decrement',
) => {
  const key = [ApiEndpoints.FETCH_ACTIVE_COMMUNITIES];
  const existingCommunities: { communities } | undefined =
    queryClient.getQueryData(key);
  const foundCommunity = (existingCommunities?.communities || []).find(
    (x) => x.id === communityId,
  );
  if (foundCommunity && foundCommunity?.thread_count >= 0) {
    foundCommunity.thread_count += type === 'increment' ? 1 : -1;
    queryClient.setQueryData(key, { ...existingCommunities });
  }
};
