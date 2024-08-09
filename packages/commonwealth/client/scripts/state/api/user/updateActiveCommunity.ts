import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import ChainInfo from 'models/ChainInfo';
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
  const community = app.config.chains.getById(communityId);

  const res = await axios.post(
    `${SERVER_URL}/${ApiEndpoints.UPDATE_USER_ACTIVE_COMMUNTY}`,
    {
      community_id: communityId,
      jwt: userStore.getState().jwt,
      auth: true,
    },
  );

  if (res.data.status !== 'Success') throw new Error(res.data.status);

  return community;
};

const useUpdateUserActiveCommunityMutation = () => {
  const user = useUserStore();

  return useMutation({
    mutationFn: updateActiveCommunity,
    onSuccess: (community: ChainInfo) =>
      user.setData({
        activeCommunity: community,
      }),
    onError: (error) =>
      console.error(`Failed to update active community: ${error}`),
  });
};

export default useUpdateUserActiveCommunityMutation;
