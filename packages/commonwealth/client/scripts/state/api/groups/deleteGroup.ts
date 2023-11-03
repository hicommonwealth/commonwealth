import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints, queryClient } from '../config';

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
      address
    }
  });
};

const useDeleteGroupMutation = ({ chainId }: { chainId: string }) => {
  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: async () => {
      const key = [ApiEndpoints.FETCH_GROUPS, chainId];
      queryClient.cancelQueries(key);
      queryClient.refetchQueries(key);
    }
  });
};

export default useDeleteGroupMutation;
