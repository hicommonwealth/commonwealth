import { MagnifyingGlass } from '@phosphor-icons/react';
import { formatAddressShort } from 'helpers';
import { APIOrderDirection } from 'helpers/constants';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import React, { useMemo, useState } from 'react';
import app from 'state';
import { useRefreshMembershipQuery } from 'state/api/groups';
import { useDebounce } from 'usehooks-ts';
import { Select } from 'views/components/Select';
import { CWText } from 'views/components/component_kit/cw_text';
import CWPagination from 'views/components/component_kit/new_designs/CWPagination';
import { CWTableColumnInfo } from 'views/components/component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import MembersSection, {
  Member,
} from '../../../../Members/MembersSection/MembersSection';
import { BaseGroupFilter } from '../../../../Members/index.types';
import { useMemberData } from '../../../../common/useMemberData';
import '/views/pages/CommunityGroupsAndMembers/Groups/common/GroupForm/Allowlist/Allowlist.scss';

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

const getTotalPages = (members, allowedAddresses: string[], filter: string) => {
  let totalPages = members?.pages?.[0].totalPages ?? 0;

  if (filter === 'allowlisted') {
    totalPages = Math.ceil(allowedAddresses.length / MEMBERS_PER_PAGE);
  } else if (filter === 'not-allowlisted') {
    totalPages =
      totalPages - Math.ceil(allowedAddresses.length / MEMBERS_PER_PAGE);
  }

  return totalPages;
};

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

const MEMBERS_PER_PAGE = 10;

const Allowlist = ({
  allowedAddresses,
  setAllowedAddresses,
}: AllowListProps) => {
  useUserActiveAccount();

  const [searchFilters, setSearchFilters] = useState({
    searchText: '',
    groupFilter: 'all-community',
  });

  const [currentPage, setCurrentPage] = useState<number>(1);

  const { data: memberships } = useRefreshMembershipQuery({
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

  const debouncedSearchTerm = useDebounce<string>(
    searchFilters.searchText,
    500,
  );

  const { fetchNextMembersPage, groups, isLoadingMembers, members } =
    useMemberData({
      tableState,
      groupFilter: searchFilters.groupFilter,
      debouncedSearchTerm,
      memberships,
      membersPerPage: MEMBERS_PER_PAGE,
    });

  const handlePageChange = async (_e, page: number) => {
    setCurrentPage(page);
    await fetchNextMembersPage({ pageParam: page });
  };
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

      const uniqueMembers = new Map();
      memberResults.forEach((m) => {
        uniqueMembers.set(m.id, m);
      });

      memberResults = Array.from(uniqueMembers.values());

      memberResults = memberResults.slice(
        (currentPage - 1) * MEMBERS_PER_PAGE,
        currentPage * MEMBERS_PER_PAGE,
      );
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
            {formatAddressShort(member.address, 5, 6)}
          </div>
        ),
      },
    };
  };

  return (
    <section className="AllowList">
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
            await handlePageChange(null, 1);
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
          onInput={async (e) => {
            await handlePageChange(null, 1);
            setSearchFilters((g) => ({
              ...g,
              searchText: e.target.value?.trim(),
            }));
          }}
        />
      </div>
      {searchFilters.searchText !== '' && formattedMembers.length === 0 ? (
        <div className="inline">
          <CWText type="b2">No search results found matching</CWText>
          &nbsp;
          <CWText type="b2" fontWeight="bold">
            {searchFilters.searchText}
          </CWText>
        </div>
      ) : (
        <>
          <MembersSection
            filteredMembers={formattedMembers}
            isLoadingMoreMembers={isLoadingMembers}
            tableState={tableState}
            extraColumns={extraColumns}
            selectedAccounts={allowedAddresses}
            handleCheckboxChange={handleCheckboxChange}
          />
          <div className="pagination-buttons">
            <CWPagination
              totalCount={getTotalPages(
                members,
                allowedAddresses,
                searchFilters.groupFilter,
              )}
              onChange={handlePageChange}
            />
          </div>
        </>
      )}
    </section>
  );
};

export default Allowlist;
