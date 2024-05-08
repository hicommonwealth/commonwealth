import { MagnifyingGlass } from '@phosphor-icons/react';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDebounce } from 'usehooks-ts';
import { APIOrderDirection } from '../../../../../../helpers/constants';
import useUserActiveAccount from '../../../../../../hooks/useUserActiveAccount';
import { ApiEndpoints, queryClient } from '../../../../../../state/api/config';
import {
  useFetchGroupsQuery,
  useRefreshMembershipQuery,
} from '../../../../../../state/api/groups/index';
import { SearchProfilesResponse } from '../../../../../../state/api/profiles/searchProfiles';
import app from '../../../../../../state/index';
import Permissions from '../../../../../../utils/Permissions';
import { trpc } from '../../../../../../utils/trpcClient';
import { Avatar } from '../../../../../components/Avatar/index';
import { Select } from '../../../../../components/Select';
import { CWCheckbox } from '../../../../../components/component_kit/cw_checkbox';
import { CWText } from '../../../../../components/component_kit/cw_text';
import {
  CWTable,
  CWTableColumnInfo,
} from '../../../../../components/component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from '../../../../../components/component_kit/new_designs/CWTable/useCWTableState';
import { CWTag } from '../../../../../components/component_kit/new_designs/CWTag';
import { CWTextInput } from '../../../../../components/component_kit/new_designs/CWTextInput/index';
import '../../../Members/MembersSection/MembersSection.scss';
import { BaseGroupFilter, SearchFilters } from '../../../Members/index.types';

const filterOptions = [
  { type: 'header', label: 'Filters' },
  { label: 'All community', value: 'all' },
  { label: 'Allowlisted', value: 'all' },
  { label: 'Not allowlisted', value: 'all' },
  { type: 'header-divider', label: 'Groups' },
  { label: 'Admins', value: 'all' },
  { label: 'Moderators', value: 'all' },
  { label: 'Hedgies', value: 'all' },
];

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
    sortable: false,
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

const AllowList = () => {
  useUserActiveAccount();

  const [selectedAccounts, setSelectedAccounts] = useState([]);

  console.log(selectedAccounts);

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
    initialSortColumn: 'lastActive',
    initialSortDirection: APIOrderDirection.Desc,
  });

  const {
    data: members,
    fetchNextPage,
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

  const filterOptions = useMemo(
    () => [
      {
        // base filters
        label: 'Filters',
        options: GROUP_AND_MEMBER_FILTERS.map((x) => ({
          id: x,
          label: x,
          value: x,
        })),
      },
      {
        // filters by group name
        label: 'Groups',
        options: (groups || []).map((group) => ({
          id: group.id,
          label: group.name,
          value: group.id,
        })),
      },
    ],
    [groups],
  );

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
        lastActive: p.last_active,
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
    if (selectedAccounts.includes(id)) {
      setSelectedAccounts((prevItems) =>
        prevItems.filter((item) => item !== id),
      );
    } else {
      setSelectedAccounts((prevItems) => [...prevItems, id]);
    }
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
          <Select
            options={filterOptions}
            placeholder={filterOptions[0].label}
          />
        </div>
        <div className="community-search">
          <CWTextInput
            // value={communitySearch}
            // onInput={(e: any) => setCommunitySearch(e.target.value)}
            placeholder="Search communities"
            iconLeft={<MagnifyingGlass size={24} weight="regular" />}
          />
        </div>
      </div>
      <div className="MembersSection">
        <CWTable
          columnInfo={tableState.columns}
          sortingState={tableState.sorting}
          setSortingState={tableState.setSorting}
          rowData={formattedMembers.map((member) => ({
            name: {
              sortValue: member.name + (member.role || ''),
              customElement: (
                <div className="table-cell">
                  <CWCheckbox
                    checked={selectedAccounts.includes(member.id)}
                    onChange={() => handleCheckboxChange(member.id)}
                  />
                  <Link to={`/profile/id/${member.id}`} className="user-info">
                    <Avatar
                      url={member.avatarUrl}
                      size={24}
                      address={member.id}
                    />
                    <p>{member.name}</p>
                  </Link>
                  {member.role === Permissions.ROLES.ADMIN && (
                    <CWTag label="Admin" type="referendum" />
                  )}
                  {member.role === Permissions.ROLES.MODERATOR && (
                    <CWTag label="Moderator" type="referendum" />
                  )}
                </div>
              ),
            },
            groups: {
              sortValue: member.groups
                .sort((a, b) => a.localeCompare(b))
                .join(' ')
                .toLowerCase(),
              customElement: (
                <div className="table-cell">
                  {member.groups.map((group, index) => (
                    <CWTag key={index} label={group} type="referendum" />
                  ))}
                </div>
              ),
            },
            stakeBalance: {
              sortValue: parseInt(member.stakeBalance || '0', 10),
              customElement: (
                <div className="table-cell text-right">
                  {member.stakeBalance}
                </div>
              ),
            },
            lastActive: {
              sortValue: moment(member.lastActive).unix(),
              customElement: (
                <div className="table-cell">
                  {moment(member.lastActive).fromNow()}
                </div>
              ),
            },
          }))}
          onScrollEnd={() => {
            if (members?.pages?.[0]?.totalResults > formattedMembers.length) {
              fetchNextPage?.().catch(console.error);
            }
          }}
          isLoadingMoreRows={isLoadingMembers}
        />
      </div>
    </section>
  );
};

export default AllowList;
