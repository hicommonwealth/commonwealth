import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { SERVER_URL } from 'state/api/config';
import { userStore } from '../../ui/user';
import { ApiEndpoints, queryClient } from '../config';

interface DeleteGroupProps {
  groupId: number;
  communityId: string;
  address: string;
}

const deleteGroup = async ({
  groupId,
  communityId,
  address,
}: DeleteGroupProps) => {
  return await axios.delete(`${SERVER_URL}/groups/${groupId}`, {
    data: {
      jwt: userStore.getState().jwt,
      community_id: communityId,
      author_community_id: communityId,
      address,
    },
  });
};

const useDeleteGroupMutation = ({ communityId }: { communityId: string }) => {
  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: async () => {
      const key = [ApiEndpoints.FETCH_GROUPS, communityId];
      queryClient.cancelQueries(key);
      queryClient.refetchQueries(key);
    },
  });
};

export default useDeleteGroupMutation;
