import { STAKE_ID } from '@hicommonwealth/chains';
import app from 'state';
import { useFetchCommunityStakeQuery } from 'state/api/communityStake';

interface UseCommunityStakeProps {
  communityId?: string;
  stakeId?: number;
}

const useCommunityStake = (props: UseCommunityStakeProps = {}) => {
  const { communityId, stakeId } = props;

  const activeCommunityId = app?.chain?.id;

  const { data: stakeData } = useFetchCommunityStakeQuery({
    communityId: communityId || activeCommunityId,
    stakeId: stakeId || STAKE_ID,
    apiEnabled: !!activeCommunityId,
  });

  const stakeEnabled = !!stakeData?.data?.result;

  return { stakeEnabled };
};

export default useCommunityStake;
