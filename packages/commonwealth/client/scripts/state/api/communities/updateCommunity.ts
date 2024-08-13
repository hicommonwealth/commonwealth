import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { initAppState } from 'state';
import { SERVER_URL } from 'state/api/config';
import { userStore } from '../../ui/user';

interface UpdateCommunityProps {
  communityId: string;
  namespace: string;
  symbol: string;
  transactionHash: string;
}

const updateCommunity = async ({
  communityId,
  namespace,
  symbol,
  transactionHash,
}: UpdateCommunityProps) => {
  return await axios.patch(`${SERVER_URL}/communities/${communityId}`, {
    jwt: userStore.getState().jwt,
    id: communityId,
    namespace,
    default_symbol: symbol,
    transactionHash,
  });
};

const useUpdateCommunityMutation = () => {
  return useMutation({
    mutationFn: updateCommunity,
    onSuccess: async () => {
      await initAppState(false);
    },
  });
};

export default useUpdateCommunityMutation;
