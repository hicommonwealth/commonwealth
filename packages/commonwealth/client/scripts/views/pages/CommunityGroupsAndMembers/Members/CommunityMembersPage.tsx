import { DEFAULT_NAME } from '@hicommonwealth/shared';
import { APIOrderDirection } from 'helpers/constants';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import {
  MixpanelPageViewEvent,
  MixpanelPageViewEventPayload,
} from 'shared/analytics/types';
import app from 'state';
import { ApiEndpoints, queryClient } from 'state/api/config';
import {
  useFetchGroupsQuery,
  useRefreshMembershipQuery,
} from 'state/api/groups';
import { SearchProfilesResponse } from 'state/api/profiles/searchProfiles';
import useGroupMutationBannerStore from 'state/ui/group';
import useUserStore from 'state/ui/user';
import { useDebounce } from 'usehooks-ts';
import Permissions from 'utils/Permissions';
import { trpc } from 'utils/trpcClient';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { getClasses } from 'views/components/component_kit/helpers';
import CWBanner from 'views/components/component_kit/new_designs/CWBanner';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTableColumnInfo } from 'views/components/component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import useAppStatus from '../../../../hooks/useAppStatus';
import './CommunityMembersPage.scss';
import GroupsSection from './GroupsSection';
import MembersSection from './MembersSection';
import { Member } from './MembersSection/MembersSection';

const TABS = [
  { value: 'all-members', label: 'All members' },
  { value: 'groups', label: 'Groups' },
];

const GROUP_AND_MEMBER_FILTERS = [
  { label: 'All groups', value: 'all-community' },
  { label: 'Ungrouped', value: 'not-in-group' },
];

const CommunityMembersPage = () => {
  const location = useLocation();
  const navigate = useCommonNavigate();
  const user = useUserStore();

  const [selectedTab, setSelectedTab] = useState(TABS[0].value);
  const [searchFilters, setSearchFilters] = useState({
    searchText: '',
    groupFilter: GROUP_AND_MEMBER_FILTERS[0].value,
  });

  const { isAddedToHomeScreen } = useAppStatus();

  const {
    shouldShowGroupMutationBannerForCommunities,
    setShouldShowGroupMutationBannerForCommunity,
  } = useGroupMutationBannerStore();

  const { trackAnalytics } =
    useBrowserAnalyticsTrack<MixpanelPageViewEventPayload>({
      onAction: true,
    });

  const { data: memberships = null } = useRefreshMembershipQuery({
    communityId: app.activeChainId(),
    address: user?.activeAccount?.address || '',
    apiEnabled: !!user?.activeAccount?.address,
  });

  const debouncedSearchTerm = useDebounce<string>(
    searchFilters.searchText,
    500,
  );

  const isStakedCommunity = !!app.config.chains.getById(app.activeChainId())
    .namespace;

  const columns: CWTableColumnInfo[] = [
    {
      key: 'name',
      header: 'Name',
      hasCustomSortValue: true,
      numeric: false,
      sortable: true,
    },
    {
      key: 'groups',
      header: 'Groups',
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
      key: 'lastActive',
      header: 'Last Active',
      hasCustomSortValue: true,
      numeric: false,
      sortable: true,
    },
  ];

  const tableState = useCWTableState({
    columns,
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
      // @ts-expect-error <StrictNullChecks/>
      order_direction: tableState.orderDirection,
      search: debouncedSearchTerm,
      community_id: app.activeChainId(),
      include_roles: true,
      ...(!['all-community', 'not-in-group'].includes(
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
      getNextPageParam: (lastPage) => {
        const nextPageNum = lastPage.page + 1;
        if (nextPageNum <= lastPage.totalPages) {
          return nextPageNum;
        }
        return undefined;
      },
      enabled: user.activeAccount?.address ? !!memberships : true,
    },
  );

  const { data: groups, refetch } = useFetchGroupsQuery({
    communityId: app.activeChainId(),
    includeTopics: true,
    enabled: user.activeAccount?.address ? !!memberships : true,
  });

  const filterOptions = useMemo(
    () => [
      {
        // base filters
        label: 'Filters',
        options: GROUP_AND_MEMBER_FILTERS,
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
        userId: p.user_id,
        avatarUrl: p.avatar_url,
        name: p.profile_name || DEFAULT_NAME,
        role: p.addresses[0].role,
        groups: (p.group_ids || [])
          .map(
            (groupId) =>
              (groups || []).find((group) => group.id === groupId)?.name,
          )
          .filter(Boolean)
          // @ts-expect-error <StrictNullChecks/>
          .sort((a, b) => a.localeCompare(b)),
        stakeBalance: p.addresses[0].stake_balance,
        lastActive: p.last_active,
      }))
      .filter((p) =>
        debouncedSearchTerm
          ? p.groups.find((g) =>
              // @ts-expect-error <StrictNullChecks/>
              g.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
            ) ||
            p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          : true,
      );

    return results;
  }, [members, groups, debouncedSearchTerm]);

  const filteredGroups = useMemo(() => {
    const modifiedGroupsArr = (groups || []).map((group) => ({
      ...group,
      // add is group joined flag based on membership
      isJoined: (memberships || []).find(
        (membership) => membership.groupId === group.id,
      )?.isAllowed,
    }));

    const filteredGroupsArr = (modifiedGroupsArr || [])
      .filter((group) =>
        searchFilters.searchText
          ? group.name
              .toLowerCase()
              .includes(searchFilters.searchText.toLowerCase())
          : true,
      )
      .filter((group) => {
        if (searchFilters.groupFilter === 'all-community') return true;
        if (searchFilters.groupFilter === 'not-in-group')
          return !group.isJoined;
        return group.id === parseInt(`${searchFilters.groupFilter}`);
      });

    const clonedFilteredGroups = [...filteredGroupsArr];

    clonedFilteredGroups.sort((a, b) => a.name.localeCompare(b.name));

    return clonedFilteredGroups;
  }, [groups, searchFilters, memberships]);

  const totalResults = members?.pages?.[0]?.totalResults || 0;

  const updateActiveTab = (activeTab: string) => {
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    navigate(`${window.location.pathname}?${params.toString()}`, {}, null);
    setSelectedTab(activeTab);

    let eventType;
    if (activeTab === TABS[0].value) {
      eventType = MixpanelPageViewEvent.MEMBERS_PAGE_VIEW;
    } else {
      eventType = MixpanelPageViewEvent.GROUPS_PAGE_VIEW;
    }

    trackAnalytics({
      event: eventType,
      isPWA: isAddedToHomeScreen,
    });
  };

  useEffect(() => {
    // Invalidate group memberships cache
    queryClient.cancelQueries([ApiEndpoints.FETCH_GROUPS]);
    refetch().catch((e) => console.log(e));
  }, [refetch]);

  useEffect(() => {
    // Set the active tab based on URL
    const params = new URLSearchParams(window.location.search.toLowerCase());
    const activeTab = params.get('tab')?.toLowerCase();

    if (!activeTab || activeTab === TABS[0].value) {
      updateActiveTab(TABS[0].value);
      return;
    }

    updateActiveTab(TABS[1].value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const navigateToCreateGroupPage = () => {
    navigate(`/members/groups/create`);
  };

  const isAdmin = Permissions.isCommunityAdmin() || Permissions.isSiteAdmin();

  const extraColumns = (member: Member) => {
    return {
      lastActive: {
        sortValue: moment(member.lastActive).unix(),
        customElement: (
          <div className="table-cell">
            {moment(member.lastActive).fromNow()}
          </div>
        ),
      },
    };
  };

  return (
    <CWPageLayout>
      <section className="CommunityMembersPage">
        {/* Header */}
        <CWText type="h2">Members ({totalResults})</CWText>

        {/* Tabs section */}
        <CWTabsRow>
          {TABS.map((tab, index) => (
            <CWTab
              key={index}
              label={tab.label}
              onClick={() => updateActiveTab(tab.value)}
              isSelected={selectedTab === tab.value}
            />
          ))}
        </CWTabsRow>

        {/* Gating group post-mutation banner */}
        {shouldShowGroupMutationBannerForCommunities.includes(
          app.activeChainId(),
        ) &&
          selectedTab === TABS[0].value && (
            <section>
              <CWBanner
                type="info"
                title="Don't see your group right away?"
                body={`
            Our app is crunching numbers, which takes some time.
            Give it a few minutes and refresh to see your group.
          `}
                onClose={() =>
                  setShouldShowGroupMutationBannerForCommunity(
                    app.activeChainId(),
                    false,
                  )
                }
              />
            </section>
          )}

        {/* Filter section */}
        {selectedTab === TABS[1].value && groups?.length === 0 ? (
          <></>
        ) : (
          <section
            className={getClasses<{
              'cols-3': boolean;
              'cols-4': boolean;
            }>(
              {
                'cols-3': !isAdmin,
                'cols-4': isAdmin,
              },
              'filters',
            )}
          >
            <CWTextInput
              size="large"
              fullWidth
              placeholder={`Search ${
                selectedTab === TABS[0].value ? 'members' : 'groups'
              }`}
              containerClassName="search-input-container"
              inputClassName="search-input"
              iconLeft={<CWIcon iconName="search" className="search-icon" />}
              onInput={(e) =>
                setSearchFilters((g) => ({
                  ...g,
                  searchText: e.target.value?.trim(),
                }))
              }
            />
            {user.activeAccount && (
              <div className="select-dropdown-container">
                <CWText type="b2" fontWeight="bold" className="filter-text">
                  Filter
                </CWText>
                <CWSelectList
                  isSearchable={false}
                  isClearable={false}
                  options={filterOptions}
                  value={[
                    ...filterOptions[0].options,
                    ...filterOptions[1].options,
                  ].find(
                    (option) => option.value === searchFilters.groupFilter,
                  )}
                  onChange={(option) => {
                    setSearchFilters((g) => ({
                      ...g,
                      // @ts-expect-error <StrictNullChecks/>
                      groupFilter: option.value as string,
                    }));
                  }}
                />
              </div>
            )}
            {isAdmin && (
              <CWButton
                buttonWidth="full"
                label="Create group"
                iconLeft="plus"
                onClick={navigateToCreateGroupPage}
              />
            )}
          </section>
        )}

        {/* Main content section: based on the selected tab */}
        {selectedTab === TABS[1].value ? (
          <GroupsSection
            filteredGroups={filteredGroups}
            canManageGroups={isAdmin}
            hasNoGroups={groups?.length === 0}
          />
        ) : (
          <MembersSection
            // @ts-expect-error <StrictNullChecks/>
            filteredMembers={formattedMembers}
            onLoadMoreMembers={() => {
              // @ts-expect-error <StrictNullChecks/>
              if (members?.pages?.[0]?.totalResults > formattedMembers.length) {
                fetchNextPage?.().catch(console.error);
              }
            }}
            isLoadingMoreMembers={isLoadingMembers}
            tableState={tableState}
            extraColumns={extraColumns}
          />
        )}
      </section>
    </CWPageLayout>
  );
};

export default CommunityMembersPage;
