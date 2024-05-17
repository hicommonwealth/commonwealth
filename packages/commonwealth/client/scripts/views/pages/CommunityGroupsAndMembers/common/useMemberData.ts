import app from 'state';
import { useFetchGroupsQuery } from 'state/api/groups/index';
import { Memberships } from 'state/api/groups/refreshMembership';
import { useDebounce } from 'usehooks-ts';
import { trpc } from '../../../../utils/trpcClient';
import { CWTableState } from '../../../components/component_kit/new_designs/CWTable/useCWTableState';

interface UseMemberDataProps {
  memberships?: Memberships[];
  tableState?: CWTableState;
  searchFilters?: { groupFilter: string | number; searchText: string };
  membersPerPage: number;
}

export const useMemberData = ({
  memberships,
  tableState,
  searchFilters,
  membersPerPage,
}: UseMemberDataProps) => {
  const debouncedSearchTerm = useDebounce<string>(
    searchFilters.searchText,
    500,
  );

  const parseMembership = !isNaN(<number>searchFilters.groupFilter)
    ? `in-group:${searchFilters.groupFilter}`
    : searchFilters.groupFilter;

  const membershipsFilter = [
    'all-community',
    'allowlisted',
    'not-allowlisted',
  ].includes(searchFilters.groupFilter.toString())
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
