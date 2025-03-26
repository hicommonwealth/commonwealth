import {
  MembershipRejectReason,
  PermissionEnum,
} from '@hicommonwealth/schemas';
import { trpc } from 'client/scripts/utils/trpcClient';
import { z } from 'node_modules/zod';

const REFRESH_MEMBERSHIP_STALE_TIME = 30 * 1_000; // 30 s

interface RefreshMembershipProps {
  community_id: string;
  address: string;
  topic_id?: number;
  force_refresh?: boolean;
  enabled?: boolean;
}

export interface Memberships {
  groupId: number;
  topics: { id: number; permissions: PermissionEnum[] }[];
  isAllowed: boolean;
  rejectReason?: z.infer<typeof MembershipRejectReason>;
}

export const useGetMembershipsQuery = ({
  community_id,
  address,
  topic_id,
  force_refresh = true,
  enabled = true,
}: RefreshMembershipProps) => {
  return trpc.community.getMemberships.useQuery(
    {
      community_id,
      address,
      topic_id,
      force_refresh,
    },
    { enabled, cacheTime: REFRESH_MEMBERSHIP_STALE_TIME },
  );
};
