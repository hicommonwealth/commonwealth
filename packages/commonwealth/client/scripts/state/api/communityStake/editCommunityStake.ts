import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';

interface EditCommunityStakeProps {
  communityId: string;
  stakeId: number;
}

const editCommunityStake = async ({
  communityId,
  stakeId,
}: EditCommunityStakeProps) => {
  return await axios.patch(
    `${app.serverUrl()}/communityStakes/${communityId}/${stakeId}`,
    {
      jwt: app.user.jwt,
      community_id: communityId,
      stake_id: stakeId,
    },
  );
};

const useUpdateCommunityMutation = () => {
  return useMutation({
    mutationFn: editCommunityStake,
    onSuccess: async () => {
      console.log('done');
    },
  });
};

export default useUpdateCommunityMutation;
