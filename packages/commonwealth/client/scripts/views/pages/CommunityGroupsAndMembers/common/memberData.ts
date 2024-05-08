import { useDebounce } from 'usehooks-ts';
import { useFetchGroupsQuery } from '../../../../state/api/groups/index';
import { Memberships } from '../../../../state/api/groups/refreshMembership';
import app from '../../../../state/index';
import { trpc } from '../../../../utils/trpcClient';
import { CWTableState } from '../../../components/component_kit/new_designs/CWTable/useCWTableState';
import { SearchFilters } from '../Members/index.types';

interface useMemberDataProps {
  memberships?: Memberships[];
  tableState?: CWTableState;
  searchFilters?: SearchFilters;
}

export const useMemberData = ({ memberships, tableState, searchFilters }) => {
  const debouncedSearchTerm = useDebounce<string>(
    searchFilters.searchText,
    500,
  );

  const {
    data: members,
    fetchNextPage: fetchNextMembersPage,
    isLoading: isLoadingMembers,
  } = trpc.community.getMembers.useInfiniteQuery(
    {
      limit: 30,
      order_by: tableState.orderBy,
      order_direction: tableState.orderDirection,
      search: debouncedSearchTerm,
      community_id: app.activeChainId(),
      include_roles: true,
      ...(!['All groups', 'Ungrouped'].includes(
        `${searchFilters.groupFilter}`,
      ) &&
        searchFilters.groupFilter && {
          memberships: `in-group:${searchFilters.groupFilter}`,
        }),
      ...(searchFilters.groupFilter === 'Ungrouped' && {
        memberships: 'not-in-group',
      }),
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

  return { groups, members, fetchNextMembersPage, isLoadingMembers };
};
