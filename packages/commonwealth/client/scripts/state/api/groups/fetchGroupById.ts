import { trpcClient } from 'client/scripts/utils/trpcClient';

export const fetchGroupById = async (groupId: number) => {
  return trpcClient.community.getGroups.query({
    group_id: groupId,
    include_topics: true,
  });
};
