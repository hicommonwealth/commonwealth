import { trpc } from 'client/scripts/utils/trpcClient';
import { userStore } from '../../ui/user';
import { ApiEndpoints, queryClient } from '../config';

interface EditGroupProps {
  groupId: string;
  communityId: string;
  address: string;
  groupName: string;
  groupDescription?: string;
  topicIds: number[];
  requirementsToFulfill: number | undefined;
  requirements?: any[];
}

export const buildUpdateGroupInput = ({
  groupId,
  communityId,
  address,
  groupName,
  groupDescription,
  topicIds,
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
      ...(requirementsToFulfill && {
        required_requirements: requirementsToFulfill,
      }),
    },
    ...(requirements && { requirements }),
    topics: topicIds,
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
