import app from 'state';
import { useFetchGroupsQuery } from 'state/api/groups';
import { Memberships } from 'state/api/groups/refreshMembership';
import { CWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import useGetMembersQuery from '../../../../state/api/members/getMembers';

interface UseMemberDataProps {
  memberships?: Memberships[];
  tableState?: CWTableState;
  groupFilter?: string;
  debouncedSearchTerm?: string;
  membersPerPage: number;
  page: number;
  allowedAddresses: string[];
}

export const useMemberData = ({
  memberships,
  tableState,
  groupFilter,
  debouncedSearchTerm,
  membersPerPage,
  page,
  allowedAddresses,
}: UseMemberDataProps) => {
  const parseMembership = !isNaN(groupFilter as unknown as number)
    ? `in-group:${groupFilter}`
    : groupFilter;

  const membershipsFilter = ['all-community'].includes(groupFilter.toString())
    ? undefined
    : parseMembership;

  const { data: members, isLoading: isLoadingMembers } = useGetMembersQuery({
    limit: membersPerPage,
    order_by: tableState.orderBy,
    order_direction: tableState.orderDirection as 'ASC' | 'DESC',
    search: debouncedSearchTerm,
    community_id: app.activeChainId(),
    include_roles: true,
    memberships: membershipsFilter,
    include_group_ids: true,
    cursor: page,
    allowedAddresses: allowedAddresses.join(', '),
    // only include stake balances if community has staking enabled
    include_stake_balances: !!app.config.chains.getById(app.activeChainId())
      .namespace,
    enabled: app?.user?.activeAccount?.address ? !!memberships : true,
  });

  const { data: groups } = useFetchGroupsQuery({
    communityId: app.activeChainId(),
    includeTopics: true,
    enabled: app?.user?.activeAccount?.address ? !!memberships : true,
  });

  return {
    groups,
    members,
    isLoadingMembers,
    debouncedSearchTerm,
  };
};
