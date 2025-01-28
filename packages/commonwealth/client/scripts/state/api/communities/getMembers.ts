import { APIOrderDirection } from 'helpers/constants';
import { trpc } from 'utils/trpcClient';
import { MemberResultsOrderBy } from 'views/pages/CommunityGroupsAndMembers/Members/index.types';

export type GetMembersProps = {
  limit?: number;
  order_by?: MemberResultsOrderBy;
  order_direction?: APIOrderDirection;
  search?: string;
  community_id: string;
  include_roles?: boolean;
  memberships?: string;
  include_group_ids?: boolean;
  include_stake_balances?: boolean;
  apiEnabled?: boolean;
};

export const useGetMembersQuery = ({
  limit = 30,
  order_by,
  order_direction,
  search,
  community_id,
  include_roles = true,
  memberships,
  include_group_ids = true,
  include_stake_balances = false,
  apiEnabled = true,
}: GetMembersProps) => {
  return trpc.community.getMembers.useInfiniteQuery(
    {
      limit,
      order_by,
      order_direction,
      ...(search && { search }),
      community_id,
      include_roles,
      ...(memberships && { memberships }),
      include_group_ids,
      include_stake_balances,
    },
    {
      initialCursor: 1,
      getNextPageParam: (lastPage) => {
        const nextPageNum = lastPage.page + 1;
        if (nextPageNum <= lastPage.totalPages) {
          return nextPageNum;
        }
        return undefined;
      },
      enabled: apiEnabled,
    },
  );
};
