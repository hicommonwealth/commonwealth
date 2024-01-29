import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app, { initAppState } from 'state';

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
  return await axios.patch(`${app.serverUrl()}/communities/${communityId}`, {
    jwt: app.user.jwt,
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
