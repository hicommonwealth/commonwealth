import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { userStore } from '../../ui/user';

interface EditCommunityStakeProps {
  communityId: string;
  stakeId: number;
}

const editCommunityStake = async ({
  communityId,
  stakeId,
}: EditCommunityStakeProps) => {
  return await axios.post(
    `${app.serverUrl()}/communityStakes/${communityId}/${stakeId}`,
    {
      jwt: userStore.getState().jwt,
      community_id: communityId,
      stake_id: stakeId,
    },
  );
};

const useUpdateCommunityMutation = () => {
  return useMutation({
    mutationFn: editCommunityStake,
  });
};

export default useUpdateCommunityMutation;
