import { APIOrderBy, APIOrderDirection } from 'helpers/constants';
import { featureFlags } from 'helpers/feature-flags';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useMemo, useState } from 'react';
import app from 'state';
import { useFetchGroupsQuery } from 'state/api/groups';
import { useSearchProfilesQuery } from 'state/api/profiles';
import { SearchProfilesResponse } from 'state/api/profiles/searchProfiles';
import { useDebounce } from 'usehooks-ts';
import Permissions from 'utils/Permissions';
import { Select } from 'views/components/Select';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { getClasses } from 'views/components/component_kit/helpers';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import './CommunityMembersPage.scss';
import GroupsSection from './GroupsSection';
import MembersSection from './MembersSection';
import { GroupCategory, SearchFilters } from './index.types';

const TABS = [
  { value: 'all-members', label: 'All members' },
  ...(featureFlags.gatingEnabled ? [{ value: 'groups', label: 'Groups' }] : []),
];

const GROUP_AND_MEMBER_FILTERS: GroupCategory[] = [
  'All groups',
  'In group',
  'Not in group',
];

const CommunityMembersPage = () => {
  const navigate = useCommonNavigate();

  const [selectedTab, setSelectedTab] = useState(TABS[0].value);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchText: '',
    category: GROUP_AND_MEMBER_FILTERS[0],
  });

  const debouncedSearchTerm = useDebounce<string>(
    searchFilters.searchText,
    500
  );

  const {
    data: members,
    fetchNextPage,
    isLoading: isLoadingMembers,
  } = useSearchProfilesQuery({
    chainId: app.activeChainId(),
    searchTerm: '',
    limit: 30,
    orderBy: APIOrderBy.LastActive,
    orderDirection: APIOrderDirection.Desc,
    includeRoles: true,
  });

  const { data: groups } = useFetchGroupsQuery({
    chainId: app.activeChainId(),
    includeMembers: true,
    includeTopics: true,
  });

  const formattedMembers = useMemo(() => {
    if (!members?.pages?.length) {
      return [];
    }

    return members.pages
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
              role.permission
            )
        )?.permission,
        groups: (groups || [])
          .filter((g) =>
            (g.members || []).find(
              (x) => x?.address?.address === p.addresses?.[0]?.address
            )
          )
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((x) => x.name),
      }))
      .filter((p) =>
        debouncedSearchTerm
          ? p.groups.find((g) =>
              g.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
            ) ||
            p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          : true
      )
      .filter((p) => {
        if (searchFilters.category === GROUP_AND_MEMBER_FILTERS[0]) {
          return true;
        }

        if (searchFilters.category === GROUP_AND_MEMBER_FILTERS[1]) {
          return p.groups.length > 0;
        }

        return p.groups.length === 0;
      });
  }, [members, groups, debouncedSearchTerm, searchFilters.category]);

  const filteredGroups = useMemo(() => {
    return (groups || [])
      .filter((group) =>
        searchFilters.searchText
          ? group.name
              .toLowerCase()
              .includes(searchFilters.searchText.toLowerCase())
          : true
      )
      .filter((group) =>
        searchFilters.category === 'All groups'
          ? true
          : searchFilters.category === 'In group'
          ? (group.members || []).find(
              (x) => x?.address?.address === app.user.activeAccount.address
            )
          : !(group.members || []).find(
              (x) => x?.address?.address === app.user.activeAccount.address
            )
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [groups, searchFilters]);

  const totalResults = members?.pages?.[0]?.totalResults || 0;

  const updateActiveTab = (activeTab: string) => {
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    history.pushState(
      null,
      '',
      `${window.location.pathname}?${params.toString()}`
    );
    setSelectedTab(activeTab);
  };

  useEffect(() => {
    // Set the active tab based on URL
    const params = new URLSearchParams(window.location.search.toLowerCase());
    const activeTab = params.get('tab')?.toLowerCase();

    if (!activeTab || activeTab === TABS[0].value) {
      updateActiveTab(TABS[0].value);
      return;
    }

    featureFlags.gatingEnabled && updateActiveTab(TABS[1].value);
  }, []);

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

      {/* Filter section */}
      {featureFlags.gatingEnabled &&
      selectedTab === TABS[1].value &&
      groups?.length === 0 ? (
        <></>
      ) : (
        <section
          className={getClasses<{
            'cols-3': boolean;
            'cols-4': boolean;
          }>(
            {
              'cols-3': featureFlags.gatingEnabled && !isAdmin,
              'cols-4': featureFlags.gatingEnabled && isAdmin,
            },
            'filters'
          )}
        >
          <CWTextInput
            size="large"
            fullWidth
            placeholder={`Search ${
              selectedTab === TABS[0].value ? 'members' : 'groups'
            }`}
            iconLeft={<CWIcon iconName="search" className="search-icon" />}
            onInput={(e) =>
              setSearchFilters((g) => ({
                ...g,
                searchText: e.target.value?.trim(),
              }))
            }
          />
          {featureFlags.gatingEnabled && app.user.activeAccount && (
            <div className="select-dropdown-container">
              <CWText type="b2" fontWeight="bold" className="filter-text">
                Filter
              </CWText>
              <Select
                containerClassname="select-dropdown"
                options={GROUP_AND_MEMBER_FILTERS.map((x) => ({
                  id: x,
                  label: x,
                  value: x,
                }))}
                selected={searchFilters.category}
                dropdownPosition="bottom-end"
                onSelect={(item: any) => {
                  setSearchFilters((g) => ({ ...g, category: item.value }));
                }}
              />
            </div>
          )}
          {featureFlags.gatingEnabled && isAdmin && (
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
      {featureFlags.gatingEnabled && selectedTab === TABS[1].value ? (
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
