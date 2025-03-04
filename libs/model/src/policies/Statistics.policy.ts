import { Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { handleCommunityJoinedStatistic } from './handlers/handleCommunityJoinedStatistic';
import { handleThreadCreatedStatistic } from './handlers/handleThreadCreatedStatistic';
import { handleThreadDeletedStatistic } from './handlers/handleThreadDeletedStatistic';
import { handleThreadViewedStatistic } from './handlers/handleThreadViewedStatistic';

const inputs = {
  ThreadCreated: events.ThreadCreated,
  ThreadDeleted: events.ThreadDeleted,
  ThreadViewed: events.ThreadViewed,
  // ThreadReacted: events.ThreadReacted, TODO: Implement
  CommunityJoined: events.CommunityJoined,
};

export function Statistics(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      ThreadCreated: handleThreadCreatedStatistic,
      ThreadDeleted: handleThreadDeletedStatistic,
      ThreadViewed: handleThreadViewedStatistic,
      // ThreadReacted: handleThreadReactedStatistic, TODO: implement
      CommunityJoined: handleCommunityJoinedStatistic,
    },
  };
}
