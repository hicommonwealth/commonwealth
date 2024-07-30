import { ForumActionsEnum } from '@hicommonwealth/schemas';
import { useRefreshMembershipQuery } from '../state/api/groups';

type UseAllowedGroupsParams = {
  communityId: string;
  address: string;
  topicId: number;
};

export const useForumActionGated = ({
  communityId,
  address,
  topicId,
}: UseAllowedGroupsParams[]) => {
  const { data: memberships = [] } = useRefreshMembershipQuery({
    communityId,
    address,
    topicId,
    apiEnabled: !!topicId && !!address,
  });

  if (memberships.length === 0) {
    return Object.values(ForumActionsEnum);
  }

  const validGroups = (memberships || []).filter(
    (membership) => membership.rejectReason.length === 0,
  );

  return Array.from(new Set(validGroups.map((g) => g.isAllowed).flat()));
};
