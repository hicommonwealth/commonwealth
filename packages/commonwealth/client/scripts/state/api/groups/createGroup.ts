import { trpc } from 'client/scripts/utils/trpcClient';
import { ApiEndpoints, queryClient } from 'state/api/config';

interface CreateGroupProps {
  communityId: string;
  address: string;
  groupName: string;
  topicIds: number[];
  groupDescription?: string;
  requirementsToFulfill: number | undefined;
  requirements?: any[];
}

export const buildCreateGroupInput = ({
  communityId,
  groupName,
  groupDescription,
  topicIds,
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
      ...(finalRequirementsToFulfill && {
        required_requirements: finalRequirementsToFulfill,
      }),
    },
    requirements,
    topics: topicIds,
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
