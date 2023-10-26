import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';

interface DeleteGroupProps {
  groupId: number;
  chainId: string;
  address: string;
}

const deleteGroup = async ({ groupId, chainId, address }: DeleteGroupProps) => {
  return await axios.delete(`${app.serverUrl()}/groups/${groupId}`, {
    data: {
      jwt: app.user.jwt,
      chain: chainId,
      author_chain: chainId,
      address,
    },
  });
};

const useDeleteGroupMutation = () => {
  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: async () => {
      // TODO: manage cache if any
    },
  });
};

export default useDeleteGroupMutation;
