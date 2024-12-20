import { trpc } from 'utils/trpcClient';
import { GroupFormTopicSubmitValues } from 'views/pages/CommunityGroupsAndMembers/Groups/common/GroupForm/index.types';
import { userStore } from '../../ui/user';
import { ApiEndpoints, queryClient } from '../config';

interface EditGroupProps {
  groupId: string;
  communityId: string;
  address: string;
  groupName: string;
  groupDescription?: string;
  groupImageUrl?: string;
  topics: GroupFormTopicSubmitValues[];
  requirementsToFulfill: number | undefined;
  requirements?: any[];
}

export const buildUpdateGroupInput = ({
  groupId,
  communityId,
  address,
  groupName,
  groupDescription,
  groupImageUrl,
  topics,
  requirementsToFulfill,
  requirements,
}: EditGroupProps) => {
  return {
    jwt: userStore.getState().jwt,
    community_id: communityId,
    group_id: +groupId,
    author_community_id: communityId,
    address,
    metadata: {
      name: groupName,
      description: groupDescription ?? '',
      groupImageUrl: groupImageUrl ?? '',
      ...(requirementsToFulfill && {
        required_requirements: requirementsToFulfill,
      }),
    },
    ...(requirements && { requirements }),
    topics,
  };
};

const useEditGroupMutation = ({ communityId }: { communityId: string }) => {
  return trpc.community.updateGroup.useMutation({
    onSuccess: () => {
      const key = [ApiEndpoints.FETCH_GROUPS, communityId];
      queryClient.cancelQueries(key);
      queryClient.refetchQueries(key);
    },
  });
};

export default useEditGroupMutation;
