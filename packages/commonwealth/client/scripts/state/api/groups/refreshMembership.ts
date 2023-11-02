import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const REFRESH_MEMBERSHIP_STALE_TIME = 30 * 1_000; // 30 s

interface RefreshMembershipProps {
  chainId: string;
  address: string;
  topicId?: string;
  apiEnabled?: boolean;
}

interface Memberships {
  topicId?: string;
  isAllowed: boolean;
  rejectReason?: string;
}

const refreshMembership = async ({
  chainId,
  address,
  topicId,
}: RefreshMembershipProps): Promise<Memberships[]> => {
  const response: any = await axios.put(
    `${app.serverUrl()}/refresh-membership`,
    {
      jwt: app.user.jwt,
      community_id: chainId,
      author_chain: chainId,
      address,
      ...(topicId && { topic_id: topicId }),
    },
  );

  return response?.data?.result?.map((r) => ({
    topicId: r.topicId,
    isAllowed: r.allowed,
    rejectReason: JSON.parse(`${r.rejectReason || {}}`),
  }));
};

const useRefreshMembershipQuery = ({
  chainId,
  address,
  topicId,
  apiEnabled = true,
}: RefreshMembershipProps) => {
  return useQuery({
    queryKey: [ApiEndpoints.REFRESH_MEMBERSHIP, chainId, address, topicId],
    queryFn: () => refreshMembership({ chainId, address, topicId }),
    enabled: apiEnabled,
    staleTime: REFRESH_MEMBERSHIP_STALE_TIME,
  });
};

export default useRefreshMembershipQuery;
