import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { SERVER_URL } from 'state/api/config';
import useUserStore, { userStore } from '../../ui/user';
import { ApiEndpoints } from '../config';

type UpdateActiveCommunityProps = {
  communityId: string;
};

export const updateActiveCommunity = async ({
  communityId, // assuming this is a valid community id
}: UpdateActiveCommunityProps) => {
  const res = await axios.post(
    `${SERVER_URL}/${ApiEndpoints.UPDATE_USER_ACTIVE_COMMUNTY}`,
    {
      community_id: communityId,
      jwt: userStore.getState().jwt,
      auth: true,
    },
  );

  if (res.data.status !== 'Success') throw new Error(res.data.status);

  return communityId;
};

const useUpdateUserActiveCommunityMutation = () => {
  const user = useUserStore();

  return useMutation({
    mutationFn: updateActiveCommunity,
    onSuccess: (communityId: string) => {
      // TODO: 8762: find a better way to set this
      const foundChain = app.config.chains
        .getAll()
        .find((c) => c.id == communityId);

      if (foundChain) {
        user.setData({
          activeCommunity: foundChain,
        });
      }
    },
    onError: (error) =>
      console.error(`Failed to update active community: ${error}`),
  });
};

export default useUpdateUserActiveCommunityMutation;
