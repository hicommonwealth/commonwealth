import app from 'state';
import { useFetchGroupsQuery } from 'state/api/groups/index';
import { Memberships } from 'state/api/groups/refreshMembership';
import { trpc } from 'utils/trpcClient';
import { CWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';

interface UseMemberDataProps {
  memberships?: Memberships[];
  tableState?: CWTableState;
  groupFilter?: string;
  debouncedSearchTerm?: string;
  membersPerPage: number;
}

export const useMemberData = ({
  memberships,
  tableState,
  groupFilter,
  debouncedSearchTerm,
  membersPerPage,
}: UseMemberDataProps) => {
  const parseMembership = !isNaN(<number>groupFilter)
    ? `in-group:${groupFilter}`
    : groupFilter;

  const membershipsFilter = [
    'all-community',
    'allowlisted',
    'not-allowlisted',
  ].includes(groupFilter.toString())
    ? undefined
    : parseMembership;

  const {
    data: members,
    fetchNextPage: fetchNextMembersPage,
    isLoading: isLoadingMembers,
  } = trpc.community.getMembers.useInfiniteQuery(
    {
      limit: membersPerPage,
      order_by: tableState.orderBy,
      order_direction: tableState.orderDirection,
      search: debouncedSearchTerm,
      community_id: app.activeChainId(),
      include_roles: true,
      memberships: membershipsFilter,
      include_group_ids: true,
      // only include stake balances if community has staking enabled
      include_stake_balances: !!app.config.chains.getById(app.activeChainId())
        .namespace,
    },
    {
      initialCursor: 1,
      getNextPageParam: (lastPage) => lastPage.page + 1,
      enabled: app?.user?.activeAccount?.address ? !!memberships : true,
    },
  );

  const { data: groups } = useFetchGroupsQuery({
    communityId: app.activeChainId(),
    includeTopics: true,
    enabled: app?.user?.activeAccount?.address ? !!memberships : true,
  });

  return {
    groups,
    members,
    fetchNextMembersPage,
    isLoadingMembers,
    debouncedSearchTerm,
  };
};
