import { DEFAULT_NAME } from '@hicommonwealth/shared';
import { OpenFeature } from '@openfeature/web-sdk';
import { APIOrderDirection } from 'helpers/constants';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import useTopicGating from 'hooks/useTopicGating';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import {
  MixpanelPageViewEvent,
  MixpanelPageViewEventPayload,
} from 'shared/analytics/types';
import app from 'state';
import {
  useGetCommunityByIdQuery,
  useGetMembersQuery,
} from 'state/api/communities';
import { ApiEndpoints, queryClient } from 'state/api/config';
import { useFetchGroupsQuery } from 'state/api/groups';
import useGroupMutationBannerStore from 'state/ui/group';
import useUserStore from 'state/ui/user';
import { useDebounce } from 'usehooks-ts';
import Permissions from 'utils/Permissions';
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
import LeaderboardSection from './LeaderboardSection';
import MembersSection from './MembersSection';
import { Member } from './MembersSection/MembersSection';
import {
  BaseGroupFilter,
  MemberResultsOrderBy,
  SearchFilters,
} from './index.types';

const client = OpenFeature.getClient();
const referralsEnabled = client.getBooleanValue('referrals', false);

enum TabValues {
  AllMembers = 'all-members',
  Leaderboard = 'leaderboard',
  Groups = 'groups',
}

const TABS = [
  { value: TabValues.AllMembers, label: 'All members' },
  ...(referralsEnabled
    ? [{ value: TabValues.Leaderboard, label: 'Leaderboard' }]
    : []),
  { value: TabValues.Groups, label: 'Groups' },
];

const GROUP_AND_MEMBER_FILTERS: { label: string; value: BaseGroupFilter }[] = [
  { label: 'All groups', value: 'all-community' },
  { label: 'Ungrouped', value: 'not-in-group' },
];

const CommunityMembersPage = () => {
  const location = useLocation();
  const navigate = useCommonNavigate();
  const user = useUserStore();

  const [selectedTab, setSelectedTab] = useState<TabValues>(
    TabValues.AllMembers,
  );
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
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

  const communityId = app.activeChainId() || '';
  const { memberships } = useTopicGating({
    communityId,
    userAddress: user?.activeAccount?.address || '',
    apiEnabled: !!user?.activeAccount?.address && !!communityId,
  });

  const debouncedSearchTerm = useDebounce<string | undefined>(
    searchFilters.searchText,
    500,
  );

  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });
  const isStakedCommunity = !!community?.namespace;

  const columns: CWTableColumnInfo[] = [
    {
      key: 'name',
      header: 'Name',
      hasCustomSortValue: true,
      numeric: false,
      sortable: true,
    },
    {
      key: 'addresses',
      header: 'Address',
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
    {
      key: 'actions',
      header: 'Onchain Role',
      numeric: false,
      sortable: false,
    },
  ];

  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'lastActive',
    initialSortDirection: APIOrderDirection.Desc,
  });

  const membershipsFilter = (() => {
    const { groupFilter } = searchFilters;
    if (groupFilter === 'not-in-group') {
      return searchFilters.groupFilter;
    }
    if (typeof groupFilter === 'number') {
      return `in-group:${searchFilters.groupFilter}`;
    }
    return null;
  })();

  const {
    data: members,
    fetchNextPage,
    isLoading: isLoadingMembers,
    refetch: refetchMembers,
  } = useGetMembersQuery({
    order_by: (tableState.orderBy === 'lastActive'
      ? 'last_active'
      : tableState.orderBy) as MemberResultsOrderBy,
    order_direction: tableState.orderDirection as APIOrderDirection,
    ...(debouncedSearchTerm && {
      search: debouncedSearchTerm,
    }),
    community_id: communityId,
    include_roles: true,
    ...(membershipsFilter && {
      memberships: String(membershipsFilter),
    }),
    include_group_ids: true,
    include_stake_balances: !!community?.namespace,
    apiEnabled: user.activeAccount?.address ? !!memberships : true,
  });

  const { data: groups, refetch } = useFetchGroupsQuery({
    communityId,
    includeTopics: true,
    enabled:
      (user.activeAccount?.address ? !!memberships : true) && !!communityId,
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
      }, [])
      .map((p) => ({
        userId: p.user_id,
        avatarUrl: p.avatar_url,
        name: p.profile_name || DEFAULT_NAME,
        role: p.addresses[0].role,
        addresses: p.addresses,
        groups: (p.group_ids || [])
          .map((groupId) => {
            const matchedGroup = (groups || []).find((g) => g.id === groupId);
            return matchedGroup
              ? {
                  name: matchedGroup.name,
                  groupImageUrl: matchedGroup.groupImageUrl,
                }
              : null;
          })
          .filter(
            (
              group,
            ): group is { name: string; groupImageUrl: string | undefined } =>
              group !== null && group.name !== undefined,
          )
          .sort((a, b) => a.name.localeCompare(b.name)),
        stakeBalance: p.addresses[0].stake_balance,
        lastActive: p.last_active,
      }));

    return results;
  }, [members, groups]);

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

  const updateActiveTab = (activeTab: TabValues) => {
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    navigate(`${window.location.pathname}?${params.toString()}`, {}, null);
    setSelectedTab(activeTab);

    let eventType;
    if (activeTab === TabValues.AllMembers) {
      eventType = MixpanelPageViewEvent.MEMBERS_PAGE_VIEW;
    } else if (activeTab === TabValues.Leaderboard) {
      eventType = MixpanelPageViewEvent.LEADERBOARD_PAGE_VIEW;
    } else if (activeTab === TabValues.Groups) {
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
    const activeTab =
      TABS.find((t) => t.value === params.get('tab')?.toLowerCase())?.value ||
      TabValues.AllMembers;

    updateActiveTab(activeTab);

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
        {shouldShowGroupMutationBannerForCommunities.includes(communityId) &&
          selectedTab === TabValues.AllMembers && (
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
                    communityId,
                    false,
                  )
                }
              />
            </section>
          )}

        {/* Filter section */}
        {selectedTab === TabValues.Leaderboard ? (
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
                selectedTab === TabValues.AllMembers ? 'members' : 'groups'
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
                      groupFilter: option?.value as BaseGroupFilter,
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
        {selectedTab === TabValues.Groups ? (
          <GroupsSection
            filteredGroups={filteredGroups}
            canManageGroups={isAdmin}
            hasNoGroups={groups?.length === 0}
          />
        ) : selectedTab === TabValues.Leaderboard ? (
          <LeaderboardSection />
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
            refetch={refetchMembers}
          />
        )}
      </section>
    </CWPageLayout>
  );
};

export default CommunityMembersPage;
