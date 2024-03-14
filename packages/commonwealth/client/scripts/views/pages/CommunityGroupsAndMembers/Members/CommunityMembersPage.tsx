import { APIOrderBy, APIOrderDirection } from 'helpers/constants';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import app from 'state';
import { ApiEndpoints, queryClient } from 'state/api/config';
import {
  useFetchGroupsQuery,
  useRefreshMembershipQuery,
} from 'state/api/groups';
import useGetCommunityMembersQuery from 'state/api/profiles/getCommunityMembers';
import { SearchProfilesResponse } from 'state/api/profiles/searchProfiles';
import useGroupMutationBannerStore from 'state/ui/group';
import { useDebounce } from 'usehooks-ts';
import Permissions from 'utils/Permissions';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { getClasses } from 'views/components/component_kit/helpers';
import CWBanner from 'views/components/component_kit/new_designs/CWBanner';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import {
  MixpanelPageViewEvent,
  MixpanelPageViewEventPayload,
} from '../../../../../../shared/analytics/types';
import './CommunityMembersPage.scss';
import GroupsSection from './GroupsSection';
import MembersSection from './MembersSection';
import { BaseGroupFilter, SearchFilters } from './index.types';

const TABS = [
  { value: 'all-members', label: 'All members' },
  { value: 'groups', label: 'Groups' },
];

const GROUP_AND_MEMBER_FILTERS: BaseGroupFilter[] = ['All groups', 'Ungrouped'];

const CommunityMembersPage = () => {
  useUserActiveAccount();
  const location = useLocation();
  const navigate = useCommonNavigate();

  const [selectedTab, setSelectedTab] = useState(TABS[0].value);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchText: '',
    groupFilter: GROUP_AND_MEMBER_FILTERS[0],
  });
  const {
    shouldShowGroupMutationBannerForCommunities,
    setShouldShowGroupMutationBannerForCommunity,
  } = useGroupMutationBannerStore();

  const { trackAnalytics } =
    useBrowserAnalyticsTrack<MixpanelPageViewEventPayload>({
      onAction: true,
    });

  const { data: memberships = null } = useRefreshMembershipQuery({
    chainId: app.activeChainId(),
    address: app?.user?.activeAccount?.address,
    apiEnabled: !!app?.user?.activeAccount?.address,
  });

  const debouncedSearchTerm = useDebounce<string>(
    searchFilters.searchText,
    500,
  );

  const {
    data: members,
    fetchNextPage,
    isLoading: isLoadingMembers,
  } = useGetCommunityMembersQuery({
    communityId: app.activeChainId(),
    searchTerm: '',
    limit: 30,
    orderBy: APIOrderBy.LastActive,
    orderDirection: APIOrderDirection.Desc,
    includeRoles: true,
    includeGroupIds: true,
    enabled: app?.user?.activeAccount?.address ? !!memberships : true,
    ...(searchFilters.groupFilter === 'Ungrouped' && {
      includeMembershipTypes: 'not-in-group',
    }),
    ...(!['All groups', 'Ungrouped'].includes(`${searchFilters.groupFilter}`) &&
      searchFilters.groupFilter && {
        includeMembershipTypes: `in-group:${searchFilters.groupFilter}`,
      }),
    // only include stake balances if community has staking enabled
    includeStakeBalances: !!app.config.chains.getById(app.activeChainId())
      .namespace,
  });

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
        role: p.roles.find(
          (role) =>
            role.chain_id === app.activeChainId() &&
            [Permissions.ROLES.ADMIN, Permissions.ROLES.MODERATOR].includes(
              role.permission,
            ),
        )?.permission,
        groups: (p.group_ids || [])
          .map(
            (groupId) =>
              (groups || []).find((group) => group.id === groupId)?.name,
          )
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b)),
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
        if (searchFilters.groupFilter === 'All groups') return true;
        if (searchFilters.groupFilter === 'Ungrouped') return !group.isJoined;
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
    });
  };

  useEffect(() => {
    // Invalidate group memberships cache
    queryClient.cancelQueries([ApiEndpoints.FETCH_GROUPS]);
    queryClient.refetchQueries([ApiEndpoints.FETCH_GROUPS]);
  }, []);

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

  return (
    <section className="CommunityMembersPage">
      {/* TODO: add breadcrums here */}

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
          {app.user.activeAccount && (
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
                ].find((option) => option.value === searchFilters.groupFilter)}
                onChange={(option) => {
                  setSearchFilters((g) => ({
                    ...g,
                    groupFilter: option.value,
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
          filteredMembers={formattedMembers}
          onLoadMoreMembers={() => {
            if (members?.pages?.[0]?.totalResults > formattedMembers.length) {
              fetchNextPage();
            }
          }}
          isLoadingMoreMembers={isLoadingMembers}
        />
      )}
    </section>
  );
};

export default CommunityMembersPage;
