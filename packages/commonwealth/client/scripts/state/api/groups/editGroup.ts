import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints, queryClient } from '../config';

interface EditGroupProps {
  groupId: string;
  chainId: string;
  address: string;
  groupName: string;
  groupDescription?: string;
  topicIds: number[];
  requirementsToFulfill: number | undefined;
  requirements?: any[];
}

const editGroup = async ({
  groupId,
  chainId,
  address,
  groupName,
  groupDescription,
  topicIds,
  requirementsToFulfill,
  requirements,
}: EditGroupProps) => {
  return await axios.put(`${app.serverUrl()}/groups/${groupId}`, {
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
    ...(requirements && { requirements }),
    topics: topicIds,
  });
};

const useEditGroupMutation = ({ chainId }: { chainId: string }) => {
  return useMutation({
    mutationFn: editGroup,
    onSuccess: async () => {
      const key = [ApiEndpoints.FETCH_GROUPS, chainId];
      queryClient.cancelQueries(key);
      queryClient.refetchQueries(key);
    },
  });
};

export default useEditGroupMutation;
