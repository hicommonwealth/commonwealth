import { PermissionEnum } from '@hicommonwealth/schemas';
import { useRefreshMembershipQuery } from 'state/api/groups';
import Permissions from '../utils/Permissions';

type TopicPermission = { id: number; permissions: PermissionEnum[] };

type UseTopicGatingProps = {
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
}: UseTopicGatingProps) => {
  const { data: memberships = [], isLoading: isLoadingMemberships } =
    useRefreshMembershipQuery({
      communityId,
      address: userAddress,
      apiEnabled,
    });

  const topicPermissions = memberships
    .map((m) => m.topics)
    .flat()
    .reduce<TopicPermission[]>((acc, current) => {
      const existing = acc.find((item) => item.id === current.id);
      if (!existing) {
        acc.push(current);
        // IMP: this logic can break if `PermissionEnum` or the `GroupPermissions`
        // schema is changed substantially and might not give off a ts issue.
      } else if (current.permissions.length > existing.permissions.length) {
        // Replace with the current item if it has a longer permission string
        const index = acc.indexOf(existing);
        acc[index] = current;
      }
      return acc;
    }, []);

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

  const foundTopicPermissions = topicPermissions.find(
    (tp) => tp.id === topicId,
  );

  return {
    memberships,
    isLoadingMemberships,
    topicPermissions,
    ...(topicId && {
      // only return these fields if `topicId` is present, otherwise these values will be inaccurate
      isTopicGated,
      isActionAllowedInGatedTopic,
      isRestrictedMembership,
      foundTopicPermissions,
    }),
  };
};

export default useTopicGating;
