import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';

interface CreateGroupProps {
  chainId: string;
  address: string;
  groupName: string;
  topicIds: string[];
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
    chain: chainId,
    author_chain: chainId,
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

const useCreateGroupMutation = () => {
  return useMutation({
    mutationFn: createGroup,
    onSuccess: async () => {
      // TODO: manage cache if any
    },
  });
};

export default useCreateGroupMutation;
