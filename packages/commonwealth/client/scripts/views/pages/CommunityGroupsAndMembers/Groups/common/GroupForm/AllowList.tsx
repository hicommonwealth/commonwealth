import { MagnifyingGlass } from '@phosphor-icons/react';
import React, { useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'usehooks-ts';
import { APIOrderDirection } from '../../../../../../helpers/constants';
import useUserActiveAccount from '../../../../../../hooks/useUserActiveAccount';
import { ApiEndpoints, queryClient } from '../../../../../../state/api/config';
import { useRefreshMembershipQuery } from '../../../../../../state/api/groups/index';
import { SearchProfilesResponse } from '../../../../../../state/api/profiles/searchProfiles';
import app from '../../../../../../state/index';
import { CWText } from '../../../../../components/component_kit/cw_text';
import { CWSelectList } from '../../../../../components/component_kit/new_designs/CWSelectList/index';
import { CWTableColumnInfo } from '../../../../../components/component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from '../../../../../components/component_kit/new_designs/CWTable/useCWTableState';
import { CWTextInput } from '../../../../../components/component_kit/new_designs/CWTextInput/index';
import MembersSection, {
  Member,
} from '../../../Members/MembersSection/MembersSection';
import '../../../Members/MembersSection/MembersSection.scss';
import { BaseGroupFilter, SearchFilters } from '../../../Members/index.types';
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

const GROUP_AND_MEMBER_FILTERS: BaseGroupFilter[] = ['All groups', 'Ungrouped'];

type AllowListProps = {
  allowListIds: number[];
  setAllowListIds: (
    value: ((prevState: number[]) => number[]) | number[],
  ) => void;
};

const AllowList = ({ allowListIds, setAllowListIds }: AllowListProps) => {
  useUserActiveAccount();

  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchText: '',
    groupFilter: GROUP_AND_MEMBER_FILTERS[0],
  });

  const { data: memberships = null } = useRefreshMembershipQuery({
    communityId: app.activeChainId(),
    address: app?.user?.activeAccount?.address,
    apiEnabled: !!app?.user?.activeAccount?.address,
  });

  const debouncedSearchTerm = useDebounce<string>(
    searchFilters.searchText,
    500,
  );

  const isStakedCommunity = !!app.config.chains.getById(app.activeChainId())
    .namespace;

  const tableState = useCWTableState({
    columns: tableColumns(isStakedCommunity),
    initialSortDirection: APIOrderDirection.Desc,
  });

  const { fetchNextMembersPage, groups, isLoadingMembers, members } =
    useMemberData({
      tableState,
      searchFilters,
      memberships,
      membersPerPage: 10,
    });

  // TODO: Hook this up to the pagination buttons
  const totalPages = members?.pages?.[0].totalPages ?? 0;

  const filterOptions = [
    { type: 'header', label: 'Filters' },
    { label: 'All community', value: 'All groups' },
    { label: 'Allowlisted', value: 'allowlisted' },
    { label: 'Not allowlisted', value: 'notAllowlisted' },
    { type: 'header-divider', label: 'Groups' },
    { label: 'All groups', value: 'All groups' },
    { label: 'Ungrouped', value: 'Ungrouped' },
    ...(groups || []).map((group) => {
      return {
        label: group.name,
        value: group.id,
      };
    }),
  ];

  const formattedMembers = useMemo(() => {
    if (!members?.pages?.length) {
      return [];
    }

    const clonedMembersPages = [...members.pages];

    const results = clonedMembersPages
      .reduce((acc, page) => {
        return [...acc, ...page.results];
      }, [] as SearchProfilesResponse['results'])
      .map((p) => ({
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
      }))
      .filter((p) =>
        debouncedSearchTerm
          ? p.groups.find((g) =>
              g.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
            ) ||
            p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          : true,
      );

    return results;
  }, [members, groups, debouncedSearchTerm]);

  useEffect(() => {
    // Invalidate group memberships cache
    queryClient.cancelQueries([ApiEndpoints.FETCH_GROUPS]);
    queryClient.refetchQueries([ApiEndpoints.FETCH_GROUPS]);
  }, []);

  const handleCheckboxChange = (id: number) => {
    if (allowListIds.includes(id)) {
      setAllowListIds((prevItems) => prevItems.filter((item) => item !== id));
    } else {
      setAllowListIds((prevItems) => [...prevItems, id]);
    }
  };

  const extraRows = (member: Member) => {
    return {
      address: {
        sortValue: member.address,
        customElement: (
          <div className="table-cell">
            {`${member.address.substring(0, 6)}...${member.address.substring(
              member.address.length - 6,
              member.address.length,
            )}`}
          </div>
        ),
      },
    };
  };

  return (
    <section className="form-section">
      <div className="header-row">
        <CWText type="h4" fontWeight="semiBold" className="header-text">
          Allow List
        </CWText>
        <CWText type="b2">
          You can bypass the conditions and add members directly to the group
          using the table below
        </CWText>
      </div>

      <div className="header-row">
        <CWText type="h4" fontWeight="semiBold" className="header-text">
          Filter & Search
        </CWText>
        <div className="filter-section-right">
          <CWSelectList
            isSearchable={false}
            isClearable={false}
            options={filterOptions}
            placeholder={filterOptions[0].label}
            onChange={(option) => {
              setSearchFilters((g) => ({
                ...g,
                groupFilter: option.value,
              }));
            }}
          />
        </div>
        <div className="community-search">
          <CWTextInput
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
      </div>
      <MembersSection
        filteredMembers={formattedMembers}
        isLoadingMoreMembers={isLoadingMembers}
        tableState={tableState}
        extraRows={extraRows}
        selectedAccounts={allowListIds}
        handleCheckboxChange={handleCheckboxChange}
      />
    </section>
  );
};

export default AllowList;
