import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ApiEndpoints, SERVER_URL, queryClient } from 'state/api/config';
import { userStore } from '../../ui/user';

interface CreateGroupProps {
  communityId: string;
  address: string;
  groupName: string;
  topicIds: number[];
  groupDescription?: string;
  requirementsToFulfill: number | undefined;
  requirements?: any[];
  isPWA?: boolean;
}

const createGroup = async ({
  communityId,
  address,
  groupName,
  groupDescription,
  topicIds,
  requirementsToFulfill,
  requirements = [],
  isPWA,
}: CreateGroupProps) => {
  const finalRequirementsToFulfill =
    requirementsToFulfill === 0 ? requirements.length : requirementsToFulfill;

  return await axios.post(
    `${SERVER_URL}/groups`,
    {
      jwt: userStore.getState().jwt,
      community_id: communityId,
      author_community_id: communityId,
      address,
      metadata: {
        name: groupName,
        description: groupDescription,
        ...(finalRequirementsToFulfill && {
          required_requirements: finalRequirementsToFulfill,
        }),
      },
      requirements,
      topics: topicIds,
    },
    {
      headers: {
        isPWA: isPWA?.toString(),
      },
    },
  );
};

const useCreateGroupMutation = ({ communityId }: { communityId: string }) => {
  return useMutation({
    mutationFn: createGroup,
    onSuccess: async () => {
      const key = [ApiEndpoints.FETCH_GROUPS, communityId];
      queryClient.cancelQueries(key);
      queryClient.refetchQueries(key);
    },
  });
};

export default useCreateGroupMutation;
