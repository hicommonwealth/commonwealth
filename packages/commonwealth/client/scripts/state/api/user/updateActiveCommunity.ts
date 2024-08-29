import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { SERVER_URL } from 'state/api/config';
import { userStore } from '../../ui/user';
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
  return useMutation({
    mutationFn: updateActiveCommunity,
    onError: (error) =>
      console.error(`Failed to update active community: ${error}`),
  });
};

export default useUpdateUserActiveCommunityMutation;
