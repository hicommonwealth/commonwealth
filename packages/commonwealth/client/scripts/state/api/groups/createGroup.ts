import { ApiEndpoints, queryClient } from 'state/api/config';
import { trpc } from 'utils/trpcClient';
import { GroupFormTopicSubmitValues } from 'views/pages/CommunityGroupsAndMembers/Groups/common/GroupForm/index.types';

interface CreateGroupProps {
  communityId: string;
  address: string;
  groupName: string;
  topics: GroupFormTopicSubmitValues[];
  groupDescription?: string;
  groupImageUrl?: string;
  requirementsToFulfill: number | undefined;
  requirements?: any[];
}

export const buildCreateGroupInput = ({
  communityId,
  groupName,
  groupDescription,
  groupImageUrl,
  topics,
  requirementsToFulfill,
  requirements = [],
}: CreateGroupProps) => {
  const finalRequirementsToFulfill =
    requirementsToFulfill === 0 ? requirements.length : requirementsToFulfill;
  return {
    community_id: communityId,
    metadata: {
      name: groupName,
      description: groupDescription ?? '',
      groupImageUrl: groupImageUrl ?? '',
      ...(finalRequirementsToFulfill && {
        required_requirements: finalRequirementsToFulfill,
      }),
    },
    requirements,
    topics,
  };
};

const useCreateGroupMutation = ({ communityId }: { communityId: string }) => {
  return trpc.community.createGroup.useMutation({
    onSuccess: async () => {
      const key = [ApiEndpoints.FETCH_GROUPS, communityId];
      queryClient.cancelQueries(key);
      queryClient.refetchQueries(key);
    },
  });
};

export default useCreateGroupMutation;
