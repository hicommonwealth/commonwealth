import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const COMMUNITY_STAKE_STALE_TIME = 3 * 60 * 1_000; // 3 min

type FetchCommunityStakeProps = Omit<
  UseFetchCommunityStakeQueryProps,
  'apiEnabled'
>;

const fetchCommunityStake = async ({
  communityId,
  stakeId,
}: FetchCommunityStakeProps) => {
  return await axios.get(
    `${app.serverUrl()}/${
      ApiEndpoints.FETCH_COMMUNITY_STAKES
    }/${communityId}/${stakeId}`,
  );
};

interface UseFetchCommunityStakeQueryProps {
  communityId: string;
  stakeId: number;
  apiEnabled: boolean;
}

const useFetchCommunityStakeQuery = ({
  communityId,
  stakeId,
  apiEnabled,
}: UseFetchCommunityStakeQueryProps) => {
  return useQuery({
    queryKey: [ApiEndpoints.FETCH_COMMUNITY_STAKES, communityId, stakeId],
    queryFn: () => fetchCommunityStake({ communityId, stakeId }),
    staleTime: COMMUNITY_STAKE_STALE_TIME,
    enabled: apiEnabled,
  });
};

export default useFetchCommunityStakeQuery;
