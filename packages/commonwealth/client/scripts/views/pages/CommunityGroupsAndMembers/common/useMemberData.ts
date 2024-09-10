import app from 'state';
import { useFetchGroupsQuery } from 'state/api/groups';
import { Memberships } from 'state/api/groups/refreshMembership';
import useUserStore from 'state/ui/user';
import { CWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import useGetMembersQuery from '../../../../state/api/members/getMembers';
import { AllowListGroupFilters } from '../Groups/common/GroupForm/Allowlist/index.types';

interface UseMemberDataProps {
  memberships?: Memberships[];
  tableState?: CWTableState;
  groupFilter?: AllowListGroupFilters;
  debouncedSearchTerm?: string;
  membersPerPage: number;
  page: number;
  allowedAddresses: string[];
  isStakedEnabled: boolean;
}

export const useMemberData = ({
  memberships,
  tableState,
  groupFilter,
  debouncedSearchTerm,
  membersPerPage,
  page,
  allowedAddresses,
  isStakedEnabled,
}: UseMemberDataProps) => {
  const user = useUserStore();
  const communityId = app.activeChainId() || '';
  const membershipsFilter = (() => {
    if (!groupFilter || groupFilter === 'all-community') return undefined;
    return (
      !isNaN(groupFilter as unknown as number)
        ? `in-group:${groupFilter}`
        : groupFilter
    ) as Omit<AllowListGroupFilters, 'all-community'>;
  })();

  const { data: members, isLoading: isLoadingMembers } = useGetMembersQuery({
    limit: membersPerPage,
    // @ts-expect-error StrictNullChecks
    order_by: tableState.orderBy,
    // @ts-expect-error StrictNullChecks
    order_direction: tableState.orderDirection as 'ASC' | 'DESC',
    search: debouncedSearchTerm,
    community_id: communityId,
    include_roles: true,
    ...(membershipsFilter && {
      memberships: membershipsFilter,
    }),
    include_group_ids: true,
    cursor: page,
    allowedAddresses: allowedAddresses.join(', '),
    // only include stake balances if community has staking enabled
    include_stake_balances: isStakedEnabled,
  });

  const { data: groups } = useFetchGroupsQuery({
    communityId,
    includeTopics: true,
    enabled:
      (user.activeAccount?.address ? !!memberships : true) && !!communityId,
  });

  return {
    groups,
    members,
    isLoadingMembers,
    debouncedSearchTerm,
  };
};
