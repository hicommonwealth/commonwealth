import { MagnifyingGlass } from '@phosphor-icons/react';
import React, { useEffect, useMemo, useState } from 'react';
import { APIOrderDirection } from '../../../../../../helpers/constants';
import useUserActiveAccount from '../../../../../../hooks/useUserActiveAccount';
import { ApiEndpoints, queryClient } from '../../../../../../state/api/config';
import { useRefreshMembershipQuery } from '../../../../../../state/api/groups/index';
import app from '../../../../../../state/index';
import { formatAddressCompact } from '../../../../../../utils/addressFormat';
import { Select } from '../../../../../components/Select/index';
import { CWText } from '../../../../../components/component_kit/cw_text';
import CWPagination from '../../../../../components/component_kit/new_designs/CWPagination/CWPagination';
import { CWTableColumnInfo } from '../../../../../components/component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from '../../../../../components/component_kit/new_designs/CWTable/useCWTableState';
import { CWTextInput } from '../../../../../components/component_kit/new_designs/CWTextInput/index';
import MembersSection, {
  Member,
} from '../../../Members/MembersSection/MembersSection';
import '../../../Members/MembersSection/MembersSection.scss';
import { BaseGroupFilter } from '../../../Members/index.types';
import { useMemberData } from '../../../common/memberData';

const tableColumns: (isStakedCommunity: boolean) => CWTableColumnInfo[] = (
  isStakedCommunity,
) => [
  {
    key: 'name',
    header: 'Users',
    hasCustomSortValue: true,
    numeric: false,
    sortable: true,
  },
  {
    key: 'address',
    header: 'Address',
    hasCustomSortValue: true,
    numeric: false,
    sortable: true,
  },
  {
    key: 'stakeBalance',
    header: 'Stake',
    hasCustomSortValue: true,
    numeric: true,
    sortable: true,
    hidden: !isStakedCommunity,
  },
  {
    key: 'groups',
    header: 'Groups',
    hasCustomSortValue: true,
    numeric: false,
    sortable: false,
  },
];

type AllowListProps = {
  allowedAddresses: string[];
  setAllowedAddresses: (
    value: ((prevState: string[]) => string[]) | string[],
  ) => void;
};

const baseFilterOptions = [
  { type: 'header', label: 'Filters' },
  { label: 'All community', value: 'all-community' },
  { label: 'Allowlisted', value: 'allowlisted' },
  { label: 'Not allowlisted', value: 'not-allowlisted' },
  { type: 'header-divider', label: 'Groups' },
  { label: 'All groups', value: 'in-group' },
  { label: 'Ungrouped', value: 'not-in-group' },
];

const AllowList = ({
  allowedAddresses,
  setAllowedAddresses,
}: AllowListProps) => {
  useUserActiveAccount();

  const [searchFilters, setSearchFilters] = useState({
    searchText: '',
    groupFilter: 'all-community',
  });

  const [currentPage, setCurrentPage] = useState<number>(1);

  const { data: memberships = null } = useRefreshMembershipQuery({
    communityId: app.activeChainId(),
    address: app?.user?.activeAccount?.address,
    apiEnabled: !!app?.user?.activeAccount?.address,
  });

  const isStakedCommunity = !!app.config.chains.getById(app.activeChainId())
    .namespace;

  const tableState = useCWTableState({
    columns: tableColumns(isStakedCommunity),
    initialSortDirection: APIOrderDirection.Desc,
  });

  const membersPerPage = 10;
  const { fetchNextMembersPage, groups, isLoadingMembers, members } =
    useMemberData({
      tableState,
      searchFilters,
      memberships,
      membersPerPage,
    });

  const handleChange = async (_e, page: number) => {
    setCurrentPage(page);
    await fetchNextMembersPage({ pageParam: page });
  };
  let totalPages = members?.pages?.[0].totalPages ?? 0;

  if (searchFilters.groupFilter === 'allowlisted') {
    totalPages = Math.ceil(allowedAddresses.length / membersPerPage);
  } else if (searchFilters.groupFilter === 'not-allowlisted') {
    totalPages =
      totalPages - Math.ceil(allowedAddresses.length / membersPerPage);
  }

  const formattedMembers: Member[] = useMemo(() => {
    if (!members?.pages?.length) {
      return [];
    }

    let memberResults =
      members?.pages?.find((p) => p.page === currentPage)?.results ?? [];

    if (
      searchFilters.groupFilter === 'allowlisted' ||
      searchFilters.groupFilter === 'not-allowlisted'
    ) {
      memberResults = members.pages
        .flatMap((p) => p.results)
        .filter((r) => {
          if (allowedAddresses.includes(r.addresses[0].address)) {
            return searchFilters.groupFilter === 'allowlisted';
          }
          return searchFilters.groupFilter === 'not-allowlisted';
        });

      memberResults = memberResults.slice(
        (currentPage - 1) * membersPerPage,
        currentPage * membersPerPage,
      );

      const uniqueMembers = new Map();
      memberResults.forEach((m) => {
        uniqueMembers.set(m.id, m);
      });

      memberResults = Array.from(uniqueMembers.values());
    }

    return memberResults.map((p) => ({
      id: p.id,
      avatarUrl: p.avatar_url,
      name: p.profile_name || 'Anonymous',
      role: p.roles[0],
      groups: (p.group_ids || [])
        .map(
          (groupId) =>
            (groups || []).find((group) => group.id === groupId)?.name,
        )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
      stakeBalance: p.addresses[0].stake_balance,
      address: p.addresses[0].address,
    })) as Member[];
    // we disable the exhaustive-deps because we don't want to refresh on changed allowedAddresses because it will
    // update the displayed list while the boxes are being checked which is a bit jarring from a UI perspective
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchFilters.groupFilter, members?.pages, currentPage, groups]);

  useEffect(() => {
    // Invalidate group memberships cache
    void queryClient.cancelQueries([ApiEndpoints.FETCH_GROUPS]);
    void queryClient.refetchQueries([ApiEndpoints.FETCH_GROUPS]);
  }, []);

  const handleCheckboxChange = (address: string) => {
    if (allowedAddresses.includes(address)) {
      setAllowedAddresses((prevItems) =>
        prevItems.filter((item) => item !== address),
      );
    } else {
      setAllowedAddresses((prevItems) => [...prevItems, address]);
    }
  };

  const extraColumns = (member: Member) => {
    return {
      address: {
        sortValue: member.address,
        customElement: (
          <div className="table-cell">
            {formatAddressCompact(member.address)}
          </div>
        ),
      },
    };
  };

  return (
    <section className="form-section">
      <div className="header-row">
        <CWText type="h4" fontWeight="semiBold">
          Allow List
        </CWText>
        <CWText type="b2">
          You can bypass the conditions and add members directly to the group
          using the table below
        </CWText>
      </div>

      <div className="header-column">
        <CWText type="h5" fontWeight="semiBold">
          Filter & Search
        </CWText>
        <Select
          options={[
            ...baseFilterOptions,
            ...(groups || []).map((group) => {
              return {
                label: group.name,
                value: group.id,
              };
            }),
          ]}
          placeholder={baseFilterOptions[1].label}
          onSelect={async (option) => {
            await handleChange(null, 1);
            setSearchFilters((g) => ({
              ...g,
              groupFilter: (
                option as {
                  value: number | BaseGroupFilter;
                }
              ).value as string,
            }));
          }}
          selected={searchFilters.groupFilter.toString()}
        />
        <CWTextInput
          fullWidth={true}
          placeholder="Search members"
          iconLeft={<MagnifyingGlass size={24} weight="regular" />}
          onInput={(e) =>
            setSearchFilters((g) => ({
              ...g,
              searchText: e.target.value?.trim(),
            }))
          }
        />
      </div>
      <MembersSection
        filteredMembers={formattedMembers}
        isLoadingMoreMembers={isLoadingMembers}
        tableState={tableState}
        extraColumns={extraColumns}
        selectedAccounts={allowedAddresses}
        handleCheckboxChange={handleCheckboxChange}
      />
      <div className="pagination-buttons">
        <CWPagination totalCount={totalPages} onChange={handleChange} />
      </div>
    </section>
  );
};

export default AllowList;
