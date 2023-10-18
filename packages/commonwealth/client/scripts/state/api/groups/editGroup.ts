import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';

interface EditGroupProps {
  groupId: string;
  chainId: string;
  address: string;
  groupName: string;
  groupDescription?: string;
  requirementsToFulfill: number | undefined;
  requirements?: any[];
}

const editGroup = async ({
  groupId,
  chainId,
  address,
  groupName,
  groupDescription,
  requirementsToFulfill,
  requirements = [],
}: EditGroupProps) => {
  return await axios.put(`${app.serverUrl()}/groups/${groupId}`, {
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
  });
};

const useEditGroupMutation = () => {
  return useMutation({
    mutationFn: editGroup,
    onSuccess: async () => {
      // TODO: manage cache if any
    },
  });
};

export default useEditGroupMutation;
