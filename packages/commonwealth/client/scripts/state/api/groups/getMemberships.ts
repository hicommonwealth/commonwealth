import { MembershipRejectReason } from '@hicommonwealth/schemas';
import { GatedActionEnum } from '@hicommonwealth/shared';
import { trpc } from 'client/scripts/utils/trpcClient';
import { z } from 'node_modules/zod';

const GET_MEMBERSHIPS_STALE_TIME = 5 * 60 * 1_000; // 5 min

interface GetMembershipsProps {
  community_id: string;
  address: string;
  topic_id?: number;
  enabled?: boolean;
}

export interface Memberships {
  groupId: number;
  topics: { id: number; permissions: GatedActionEnum[] }[];
  isAllowed: boolean;
  rejectReason?: z.infer<typeof MembershipRejectReason>;
}

export const useGetMembershipsQuery = ({
  community_id,
  address,
  topic_id,
  enabled = true,
}: GetMembershipsProps) => {
  return trpc.community.getMemberships.useQuery(
    {
      community_id,
      address,
      topic_id,
    },
    {
      enabled,
      //cacheTime: GET_MEMBERSHIPS_STALE_TIME,
      staleTime: GET_MEMBERSHIPS_STALE_TIME,
    },
  );
};
