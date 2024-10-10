import { useRefreshMembershipQuery } from 'state/api/groups';
import Permissions from '../utils/Permissions';

type IuseTopicGating = {
  communityId: string;
  apiEnabled: boolean;
  userAddress: string;
  topicId?: number;
};

const useTopicGating = ({
  apiEnabled,
  communityId,
  userAddress,
  topicId,
}: IuseTopicGating) => {
  const { data: memberships = [], isLoading: isLoadingMemberships } =
    useRefreshMembershipQuery({
      communityId,
      address: userAddress,
      apiEnabled,
    });

  const isTopicGated = !!(memberships || []).find((membership) =>
    membership.topics.find((t) => t.id === topicId),
  );

  const isActionAllowedInGatedTopic = !!(memberships || []).find(
    (membership) =>
      membership.topics.find((t) => t.id === topicId) && membership.isAllowed,
  );

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  const isRestrictedMembership =
    !isAdmin && isTopicGated && !isActionAllowedInGatedTopic;

  return {
    memberships,
    isLoadingMemberships,
    ...(topicId && {
      // only return these fields if `topicId` is present, otherwise these values will be inaccurate
      isTopicGated,
      isActionAllowedInGatedTopic,
      isRestrictedMembership,
    }),
  };
};

export default useTopicGating;
