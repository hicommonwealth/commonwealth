import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints, queryClient } from 'state/api/config';

interface CreateGroupProps {
  chainId: string;
  address: string;
  groupName: string;
  topicIds: number[];
  groupDescription?: string;
  requirementsToFulfill: number | undefined;
  requirements?: any[];
}

const createGroup = async ({
  chainId,
  address,
  groupName,
  groupDescription,
  topicIds,
  requirementsToFulfill,
  requirements = [],
}: CreateGroupProps) => {
  return await axios.post(`${app.serverUrl()}/groups`, {
    jwt: app.user.jwt,
    community_id: chainId,
    author_community_id: chainId,
    address,
    metadata: {
      name: groupName,
      description: groupDescription,
      ...(requirementsToFulfill && {
        required_requirements: requirementsToFulfill,
      }),
    },
    requirements,
    topics: topicIds,
  });
};

const useCreateGroupMutation = ({ chainId }: { chainId: string }) => {
  return useMutation({
    mutationFn: createGroup,
    onSuccess: async () => {
      const key = [ApiEndpoints.FETCH_GROUPS, chainId];
      queryClient.cancelQueries(key);
      queryClient.refetchQueries(key);
    },
  });
};

export default useCreateGroupMutation;
