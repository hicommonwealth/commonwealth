import { APIOrderBy, APIOrderDirection } from 'helpers/constants';
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

const isGatingEnabled = process.env.GATING_API_ENABLED || true;
const TABS = ['All members'];
isGatingEnabled && TABS.push('Groups');
const GROUP_FILTERS: GroupCategory[] = [
  'All groups',
  'In group',
  'Not in group',
];

const CommunityMembersPage = () => {
  const navigate = useCommonNavigate();

  const [selectedTab, setSelectedTab] = useState(TABS[0]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchText: '',
    category: GROUP_FILTERS[0],
  });

  const debouncedSearchTerm = useDebounce<string>(
    searchFilters.searchText,
    500
  );

  const { data: members, fetchNextPage } = useSearchProfilesQuery({
    chainId: app.activeChainId(),
    searchTerm: '',
    limit: 10,
    orderBy: APIOrderBy.LastActive,
    orderDirection: APIOrderDirection.Desc,
    includeRoles: true,
  });

  const { data: groups } = useFetchGroupsQuery({
    chainId: app.activeChainId(),
    shouldIncludeMembers: true,
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
        name: p.profile_name || 'Anonymous',
        address: p.addresses?.[0]?.address,
        chain: p.addresses?.[0]?.chain,
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
          .map((x) => x.name),
      }))
      .filter((p) =>
        debouncedSearchTerm
          ? p.groups.find((g) =>
              g.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
            ) ||
            p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          : true
      );
  }, [members, groups, debouncedSearchTerm]);

  const totalResults = members?.pages?.[0]?.totalResults || 0;

  // fixes bug that prevents scrolling on initial page load
  useEffect(() => {
    const shouldFetchMore = formattedMembers.length < 50 && totalResults > 50;
    if (!shouldFetchMore) {
      return;
    }
    fetchNextPage();
  }, [formattedMembers, totalResults, fetchNextPage]);

  useEffect(() => {
    // Set the active tab based on URL
    if (
      window.location.search.includes(
        `tab=${TABS[0].split(' ').join('-').toLowerCase()}`
      )
    ) {
      setSelectedTab(TABS[0]);
    } else if (
      isGatingEnabled &&
      window.location.search.includes(
        `tab=${TABS[1].split(' ').join('-').toLowerCase()}`
      )
    ) {
      setSelectedTab(TABS[1]);
    } else {
      setSelectedTab(TABS[0]);
    }
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
            label={tab}
            onClick={() => setSelectedTab(tab)}
            isSelected={selectedTab.toLowerCase() === tab.toLowerCase()}
          />
        ))}
      </CWTabsRow>

      {/* Filter section */}
      <section
        className={getClasses<{
          'cols-3': boolean;
          'cols-4': boolean;
        }>(
          {
            'cols-3': !isAdmin,
            'cols-4': isAdmin,
          },
          'filters'
        )}
      >
        <CWTextInput
          size="large"
          fullWidth
          placeholder={`Search ${
            selectedTab === TABS[0] ? 'members' : 'groups'
          }`}
          iconLeft={<CWIcon iconName="search" className="search-icon" />}
          onInput={(e) =>
            setSearchFilters((g) => ({
              ...g,
              searchText: e.target.value?.trim(),
            }))
          }
        />
        {isGatingEnabled && (
          <div className="select-dropdown-container">
            <CWText type="b2" fontWeight="bold" className="filter-text">
              Filter
            </CWText>
            <Select
              containerClassname="select-dropdown"
              options={GROUP_FILTERS.map((x) => ({
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
        {isAdmin && (
          <CWButton
            buttonWidth="full"
            label="Create group"
            iconLeft="plus"
            onClick={navigateToCreateGroupPage}
          />
        )}
      </section>

      {/* Main content section: based on the selected tab */}
      {selectedTab === TABS[1] ? (
        <GroupsSection />
      ) : (
        <MembersSection members={formattedMembers} />
      )}
    </section>
  );
};

export default CommunityMembersPage;
