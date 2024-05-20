import { z } from 'zod';

import { GetCommunityMembers } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import app from '../../index';

type UseGetMembersQueryProps = z.infer<typeof GetCommunityMembers.input>;

const useGetMembersQuery = ({
  limit,
  order_by,
  order_direction,
  search,
  community_id,
  include_roles,
  memberships,
  include_group_ids,
  cursor,
  allowedAddresses,
  include_stake_balances,
}: UseGetMembersQueryProps) => {
  return trpc.community.getMembers.useQuery(
    {
      limit,
      order_by,
      order_direction: order_direction as 'ASC' | 'DESC',
      search,
      community_id,
      include_roles,
      memberships,
      include_group_ids,
      cursor,
      allowedAddresses,
      // only include stake balances if community has staking enabled
      include_stake_balances,
    },
    {
      enabled: app?.user?.activeAccount?.address ? !!memberships : true,
    },
  );
};

export default useGetMembersQuery;
