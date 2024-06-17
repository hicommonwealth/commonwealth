import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const REFRESH_MEMBERSHIP_STALE_TIME = 30 * 1_000; // 30 s

interface RefreshMembershipProps {
  communityId: string;
  address: string;
  topicId?: string;
  apiEnabled?: boolean;
}

export interface Memberships {
  groupId: number;
  topicIds: number[];
  isAllowed: boolean;
  rejectReason?: string;
}

const refreshMembership = async ({
  communityId,
  address,
  topicId,
}: RefreshMembershipProps): Promise<Memberships[]> => {
  const response: any = await axios.put(
    `${app.serverUrl()}/refresh-membership`,
    {
      jwt: app.user.jwt,
      community_id: communityId,
      author_community_id: communityId,
      address,
      ...(topicId && { topic_id: topicId }),
    },
  );

  return response?.data?.result?.map((r) => ({
    groupId: r.groupId,
    topicIds: r.topicIds,
    isAllowed: r.allowed,
    rejectReason: r.rejectReason,
  }));
};

const useRefreshMembershipQuery = ({
  communityId,
  address,
  topicId,
  apiEnabled = true,
}: RefreshMembershipProps) => {
  return useQuery({
    queryKey: [ApiEndpoints.REFRESH_MEMBERSHIP, communityId, address, topicId],
    queryFn: () => refreshMembership({ communityId, address, topicId }),
    enabled: apiEnabled,
    staleTime: REFRESH_MEMBERSHIP_STALE_TIME,
  });
};

export default useRefreshMembershipQuery;
