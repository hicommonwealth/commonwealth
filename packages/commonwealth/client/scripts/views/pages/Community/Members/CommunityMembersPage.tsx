import { APIOrderBy, APIOrderDirection } from 'helpers/constants';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import app from 'state';
import { useFetchGroupsQuery } from 'state/api/groups';
import { useSearchProfilesQuery } from 'state/api/profiles';
import { SearchProfilesResponse } from 'state/api/profiles/searchProfiles';
import { useDebounce } from 'usehooks-ts';
import Permissions from 'utils/Permissions';
import { Select } from 'views/components/Select';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWTab, CWTabBar } from 'views/components/component_kit/cw_tabs';
import { CWText } from 'views/components/component_kit/cw_text';
import { getClasses } from 'views/components/component_kit/helpers';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import './CommunityMembersPage.scss';
import GroupsSection from './GroupsSection';
import MembersSection from './MembersSection';
import { GroupCategory, SearchFilters } from './index.types';

// TEMP: consider it a feature flag, remove this after https://github.com/hicommonwealth/commonwealth/issues/4989
const FEATURE_FLAGS = {
  GATING: true,
};

const TABS = ['All members'];
FEATURE_FLAGS.GATING && TABS.push('Groups');
const GROUP_FILTERS: GroupCategory[] = [
  'All groups',
  'In group',
  'Not in group',
];

const CommunityMembersPage = () => {
  const navigate = useNavigate();

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
    searchTerm: debouncedSearchTerm,
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
      }));
  }, [members, groups]);

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
      FEATURE_FLAGS.GATING &&
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
    navigate({ pathname: `${app.activeChainId()}/members/groups/create` });
  };

  return (
    <section className="CommunityMembersPage">
      {/* TODO: add breadcrums here */}

      {/* Header */}
      <CWText type="h2">Members ({totalResults})</CWText>

      {/* Tabs section */}
      <CWTabBar>
        {TABS.map((tab) => (
          <CWTab
            label={tab}
            onClick={() => setSelectedTab(tab)}
            isSelected={selectedTab.toLowerCase() === tab.toLowerCase()}
          />
        ))}
      </CWTabBar>

      {/* Filter section */}
      <section
        className={getClasses<{
          'cols-3': boolean;
          'cols-4': boolean;
        }>(
          {
            'cols-3': !Permissions.isCommunityAdmin(),
            'cols-4': Permissions.isCommunityAdmin(),
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
        <CWText type="b2" fontWeight="bold" className="filter-text">
          Filter
        </CWText>
        <Select
          containerClassname="select-dropdown"
          options={GROUP_FILTERS.map((x) => ({ id: x, label: x, value: x }))}
          selected={searchFilters.category}
          dropdownPosition="bottom-end"
          onSelect={(item: any) => {
            setSearchFilters((g) => ({ ...g, category: item.value }));
          }}
        />
        {Permissions.isCommunityAdmin() && (
          <CWButton
            buttonWidth="full"
            label="Create group"
            iconLeft={'plus'}
            onClick={navigateToCreateGroupPage}
          />
        )}
      </section>

      {/* Main content section: based on the selected tab */}
      {selectedTab === TABS[1] ? (
        <GroupsSection searchFilters={searchFilters} />
      ) : (
        <MembersSection members={formattedMembers} />
      )}
    </section>
  );
};

export default CommunityMembersPage;
