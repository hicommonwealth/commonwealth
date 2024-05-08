import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
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

const createGroup = async ({
  communityId,
  address,
  groupName,
  groupDescription,
  topicIds,
  requirementsToFulfill,
  requirements = [],
  allowListIds = [],
}: CreateGroupProps) => {
  return await axios.post(`${app.serverUrl()}/groups`, {
    jwt: app.user.jwt,
    community_id: communityId,
    author_community_id: communityId,
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
    allowList: allowListIds,
  });
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
