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
  const parseMembership = !isNaN(<number>groupFilter)
    ? `in-group:${groupFilter}`
    : groupFilter;

  const membershipsFilter = ['all-community'].includes(groupFilter.toString())
    ? undefined
    : parseMembership;

  const allowedAddressesMemo = ['allowlisted', 'not-allowlisted'].includes(
    membershipsFilter,
  )
    ? allowedAddresses.join(', ')
    : undefined;

  const { data: members, isLoading: isLoadingMembers } =
    trpc.community.getMembers.useQuery(
      {
        limit: membersPerPage,
        order_by: tableState.orderBy,
        order_direction: tableState.orderDirection,
        search: debouncedSearchTerm,
        community_id: app.activeChainId(),
        include_roles: true,
        memberships: membershipsFilter,
        include_group_ids: true,
        cursor: page,
        allowedAddresses: allowedAddressesMemo,
        // only include stake balances if community has staking enabled
        include_stake_balances: !!app.config.chains.getById(app.activeChainId())
          .namespace,
      },
      {
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
    isLoadingMembers,
    debouncedSearchTerm,
  };
};
