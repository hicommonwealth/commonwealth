import { Community, GetCommunities } from '@hicommonwealth/schemas';
import { ALL_COMMUNITIES } from '@hicommonwealth/shared';
import { InfiniteData } from '@tanstack/react-query';
import React, {
  MutableRefObject,
  ReactNode,
  RefObject,
  useCallback,
} from 'react';
import { useFetchGlobalActivityQuery } from 'state/api/feeds/fetchUserActivity';
import useSearchThreadsQuery from 'state/api/threads/searchThreads';
import { ThreadResult } from 'views/pages/search/helpers';
import { z } from 'zod';
import { APIOrderBy, APIOrderDirection } from '../../../helpers/constants';
import Tag from '../../../models/Tag';
import { QuestFilterOption } from '../../../state/ui/communitiesPage';
import { Feed } from '../../components/feed';
import XPTable from '../Leaderboard/XPTable/XPTable';
import AllTabContent from './AllTabContent';
import CommunitiesTabContent from './CommunitiesTabContent';
import ExploreContestList from './ExploreContestList';
import { ContestStage as ExploreContestStage } from './ExploreContestList/ExploreContestList';
import {
  createSelectFilter,
  createSortFilter,
  createToggleFilter,
} from './filters';
import {
  CommunityFilters,
  CommunitySortDirections,
  CommunitySortOptions,
} from './FiltersDrawer';
import { safeScrollParent } from './helpers';
import QuestList from './QuestList';
import { SearchableThreadsFeed } from './SearchableThreadsFeed';
import { FilterTag, InlineFilter, ViewType } from './SearchFilterRow';
import TokensList from './TokensList';

// Define constants
export const CONTEST_STAGE = {
  ALL: 'all',
  ACTIVE: 'active',
  PAST: 'past',
} as const;

export type ContestStageType =
  (typeof CONTEST_STAGE)[keyof typeof CONTEST_STAGE];

export const QUEST_STAGE = {
  ALL: 'all',
  ACTIVE: 'active',
  PAST: 'past',
} as const;

export type QuestStageType = (typeof QUEST_STAGE)[keyof typeof QUEST_STAGE];

// Define the type for a single community item
type CommunityItem = z.infer<typeof Community>;

// Define the type for a pair of community items (or one item and undefined)
type CommunityPair = [CommunityItem, CommunityItem | undefined];

// Define types for tab configuration
export interface TabConfig {
  key: string;
  label: string;
  featureFlag?: string; // Optional feature flag to enable/disable the tab
  getInlineFilters?: (props: TabContentProps) => InlineFilter<unknown>[];
  getFilterClickHandler?: (props: TabContentProps) => (() => void) | undefined;
  getFilterTags?: (props: TabContentProps) => FilterTag[];
  showViewToggle?: boolean;
  getContent: (props: TabContentProps) => ReactNode;
}

// Define a generic type for Select options
interface SelectOption {
  value: string;
  label: string;
  fullLabel?: string;
}

// Common props passed to all tab-related functions
export interface TabContentProps {
  searchValue: string;
  setSearchValue: (value: string) => void;
  selectedViewType: ViewType;
  containerRef: RefObject<HTMLDivElement>;
  filters: CommunityFilters;
  setFilters: (filters: CommunityFilters) => void;
  isFilterDrawerOpen: boolean;
  setIsFilterDrawerOpen: (isOpen: boolean) => void;
  communitiesList: CommunityPair[];
  filteredCommunitiesList: CommunityPair[];
  isLoading: boolean;
  isInitialCommunitiesLoading: boolean;
  hasNextPage?: boolean;
  fetchMoreCommunities?: () => Promise<void>;
  historicalPrices?:
    | { community_id: string; old_price?: string | null }[]
    | undefined;
  ethUsdRate: number;
  selectedCommunityId?: string;
  setSelectedCommunityId: (id: string) => void;
  communities?: InfiniteData<z.infer<typeof GetCommunities.output>>;
  tags?: Tag[];
  selectedQuestFilter?: QuestFilterOption | null;
  setSelectedQuestFilter?: (filter: QuestFilterOption | null) => void;
  selectedQuestStage?: QuestStageType;
  setSelectedQuestStage?: (stage: QuestStageType) => void;
  questFilterTags?: FilterTag[];
  setQuestFilterTags?: (tags: FilterTag[]) => void;
  selectedContestStage?: ContestStageType;
  setSelectedContestStage?: (stage: ContestStageType) => void;
  selectedContestCommunityId?: string;
  setSelectedContestCommunityId?: (id: string) => void;
  contestFilterTags?: FilterTag[];
  setContestFilterTags?: (tags: FilterTag[]) => void;
  threadsFilterCommunityId?: string;
  setThreadsFilterCommunityId?: (id: string) => void;
  threadsSortOption?: string;
  setThreadsSortOption?: (option: string) => void;
  threadsFilterTags?: FilterTag[];
  setThreadsFilterTags?: (tags: FilterTag[]) => void;
  threadFilterKey?: number;
  setThreadFilterKey?: (key: number) => void;
  tokensFilterTag?: string;
  setTokensFilterTag?: (tag: string) => void;
  tokensSortOption?: string;
  setTokensSortOption?: (option: string) => void;
  tokensFilterTags?: FilterTag[];
  setTokensFilterTags?: (tags: FilterTag[]) => void;
  contestCommunityOptions?: SelectOption[];
  questOptions?: SelectOption[];
}

// Helper function to safely cast container reference
const safeContainerRef = (
  ref: RefObject<HTMLDivElement>,
): MutableRefObject<HTMLElement | undefined> => {
  return ref as unknown as MutableRefObject<HTMLElement | undefined>;
};

// FilteredThreadsFeed component that conditionally renders feed or search results
const FilteredThreadsFeed = ({
  communityId,
  sortOption,
  customScrollParent,
  filterKey,
  searchTerm,
}: {
  communityId?: string;
  sortOption?: string;
  customScrollParent?: HTMLElement | null;
  filterKey?: number;
  searchTerm?: string;
}) => {
  // Hook for standard feed
  const fetchGlobalActivity = useFetchGlobalActivityQuery;
  const getQuery = useCallback(
    ({ limit }: { limit: number }) => {
      return fetchGlobalActivity({ limit });
    },
    [fetchGlobalActivity],
  );

  // Hook for searchable feed
  const orderBy =
    sortOption === 'upvotes' ? APIOrderBy.Rank : APIOrderBy.CreatedAt;
  const orderDirection = APIOrderDirection.Desc;

  const searchResults = useSearchThreadsQuery({
    communityId: communityId || ALL_COMMUNITIES,
    searchTerm: searchTerm || '',
    limit: 20,
    orderBy,
    orderDirection,
    threadTitleOnly: false,
    includeCount: true,
    enabled: !!searchTerm && searchTerm.length > 0,
  });

  // Determine if we need to use search or standard feed
  const searchResultsLength = searchResults.data?.pages.flatMap(
    (page) => page.results,
  ).length;
  if (searchResultsLength && searchResultsLength > 0) {
    const rawThreads: ThreadResult[] =
      searchResults.data?.pages.flatMap((page) => page.results) || [];

    return (
      <SearchableThreadsFeed
        customScrollParent={customScrollParent}
        threads={rawThreads}
        isLoading={searchResults.isLoading}
        error={searchResults.error as Error | null}
        hasNextPage={searchResults.hasNextPage}
        fetchNextPage={searchResults.fetchNextPage}
        isFetchingNextPage={searchResults.isFetchingNextPage}
      />
    );
  }

  // If no search term, use the standard Feed component
  return (
    <Feed
      key={`threads-feed-${filterKey}`}
      query={getQuery}
      customScrollParent={safeScrollParent(customScrollParent)}
    />
  );
};

// Export the function to create tabs configuration
export function createTabsConfig() {
  // Define tabs configuration
  const tabsConfig: TabConfig[] = [
    {
      key: 'all',
      label: 'All',
      showViewToggle: true,
      getContent: (props) => (
        <div className="section-container">
          <AllTabContent
            containerRef={safeContainerRef(props.containerRef)}
            filters={props.filters}
          />
        </div>
      ),
    },
    {
      key: 'communities',
      label: 'Communities',
      showViewToggle: true,
      getInlineFilters: (props) => {
        return [
          createSortFilter({
            label: 'Sort by',
            placeholder: '',
            options: [
              {
                value: CommunitySortOptions.MemberCount,
                label: 'Members',
              },
              {
                value: CommunitySortOptions.MostRecent,
                label: 'Newest',
              },
              {
                value: CommunitySortOptions.MarketCap,
                label: 'Market Cap',
              },
              {
                value: CommunitySortOptions.Price,
                label: 'Price',
              },
              {
                value: CommunitySortOptions.ThreadCount,
                label: 'Activity',
              },
            ],
            state: {
              selectedValue:
                props.filters.withCommunitySortBy ||
                CommunitySortOptions.MemberCount,
              setSelectedValue: (value) =>
                props.setFilters({
                  ...props.filters,
                  withCommunitySortBy: value as
                    | CommunitySortOptions
                    | undefined,
                }),
              filterTags: [], // Managed separately
              setFilterTags: () => {},
            },
            tagPrefix: 'Sort',
            defaultValue: CommunitySortOptions.MemberCount,
          }),
        ];
      },
      getFilterClickHandler: (props) => {
        return () => props.setIsFilterDrawerOpen(true);
      },
      getFilterTags: (props) => {
        const tags: FilterTag[] = [];

        if (props.filters.withCommunityEcosystem) {
          tags.push({
            label: `Ecosystem: ${props.filters.withCommunityEcosystem}`,
            onRemove: () =>
              props.setFilters({
                ...props.filters,
                withCommunityEcosystem: undefined,
                withEcosystemChainId: undefined,
              }),
          });
        }

        if (props.filters.withNetwork) {
          tags.push({
            label: `Network: ${props.filters.withNetwork}`,
            onRemove: () =>
              props.setFilters({ ...props.filters, withNetwork: undefined }),
          });
        }

        if (props.filters.withStakeEnabled) {
          tags.push({
            label: 'Stake Enabled',
            onRemove: () =>
              props.setFilters({
                ...props.filters,
                withStakeEnabled: undefined,
              }),
          });
        }

        if (props.filters.withTagsIds && props.filters.withTagsIds.length > 0) {
          props.filters.withTagsIds.forEach((tagId) => {
            const tag = props.tags?.find((t) => t.id === tagId);
            if (tag) {
              tags.push({
                label: `Tag: ${tag.name}`,
                onRemove: () =>
                  props.setFilters({
                    ...props.filters,
                    withTagsIds: props.filters.withTagsIds?.filter(
                      (id) => id !== tagId,
                    ),
                  }),
              });
            }
          });
        }

        if (props.filters.withCommunityType) {
          tags.push({
            label: `Type: ${props.filters.withCommunityType}`,
            onRemove: () =>
              props.setFilters({
                ...props.filters,
                withCommunityType: undefined,
              }),
          });
        }

        if (
          props.filters.withCommunitySortBy &&
          props.filters.withCommunitySortBy !== CommunitySortOptions.MemberCount // Don't show default sort
        ) {
          tags.push({
            label: `Sort: ${props.filters.withCommunitySortBy}`,
            onRemove: () =>
              props.setFilters({
                ...props.filters,
                withCommunitySortBy: CommunitySortOptions.MemberCount,
                withCommunitySortOrder: CommunitySortDirections.Descending,
              }),
          });
        }

        return tags;
      },
      getContent: (props) => (
        <CommunitiesTabContent
          {...props}
          communitiesList={props.filteredCommunitiesList}
          containerRef={safeContainerRef(props.containerRef)}
        />
      ),
    },
    {
      key: 'users',
      label: 'Users',
      getInlineFilters: (props) => {
        if (!props.questOptions) return [];

        return [
          {
            type: 'select',
            label: 'Filter by:',
            placeholder: 'Select Quest',
            value: props.selectedQuestFilter,
            onChange: (option) =>
              props.setSelectedQuestFilter?.(
                option as QuestFilterOption | null,
              ),
            options: props.questOptions,
            isClearable: true,
            isSearchable: true,
          },
        ];
      },
      getFilterTags: (props) => {
        const tags: FilterTag[] = [];
        if (props.searchValue) {
          tags.push({
            label: `Search: ${props.searchValue}`,
            onRemove: () => props.setSearchValue(''),
          });
        }
        return tags;
      },
      getContent: (props) => (
        <div className="users-tab">
          <div
            className={`users-xp-table ${props.selectedViewType === ViewType.Cards ? 'cards-view' : 'list-view'}`}
          >
            <XPTable
              hideHeader={true}
              selectedQuest={{
                value: props.selectedQuestFilter?.value.toString() || '',
                label: props.selectedQuestFilter?.label.name || '',
              }}
              onQuestChange={(quest) => {
                const filterOption: QuestFilterOption | null = quest
                  ? {
                      value: parseInt(quest.value, 10),
                      label: { name: quest.label },
                    }
                  : null;
                props.setSelectedQuestFilter?.(filterOption);
              }}
              searchTerm={props.searchValue}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'contests',
      label: 'Contests',
      getInlineFilters: (props) => {
        if (!props.setSelectedContestStage || !props.setContestFilterTags)
          return [];

        return [
          createToggleFilter({
            label: 'Filter by:',
            placeholder: 'Select Contest Stage',
            options: [
              { value: CONTEST_STAGE.ALL, label: 'All' },
              { value: CONTEST_STAGE.ACTIVE, label: 'Active' },
              { value: CONTEST_STAGE.PAST, label: 'Past' },
            ],
            state: {
              selectedValue: props.selectedContestStage || CONTEST_STAGE.ALL,
              setSelectedValue: props.setSelectedContestStage,
              filterTags: props.contestFilterTags || [],
              setFilterTags: props.setContestFilterTags,
            },
            getLabel: (value) =>
              value === CONTEST_STAGE.ALL
                ? 'All'
                : value === CONTEST_STAGE.ACTIVE
                  ? 'Active'
                  : 'Past',
            getRemoveTagsFilter: (tags) =>
              tags.filter(
                (tag) =>
                  !tag.label.startsWith('All') &&
                  !tag.label.startsWith('Active') &&
                  !tag.label.startsWith('Past'),
              ),
            defaultValue: CONTEST_STAGE.ALL,
            tagPrefix: 'Contests',
          }),
          createSelectFilter({
            label: 'Community:',
            placeholder: 'Select Community',
            className: 'community-filter',
            options: props.contestCommunityOptions || [
              { value: '', label: 'All' },
            ],
            state: {
              selectedValue: props.selectedContestCommunityId || '',
              setSelectedValue:
                props.setSelectedContestCommunityId || (() => {}),
              filterTags: props.contestFilterTags || [],
              setFilterTags: props.setContestFilterTags,
            },
            getTagLabel: (option) => option.fullLabel || option.label,
            tagPrefix: 'Community',
          }),
        ];
      },
      getFilterTags: (props) => {
        const tags = [...(props.contestFilterTags || [])];
        if (props.searchValue) {
          tags.push({
            label: `Search: ${props.searchValue}`,
            onRemove: () => props.setSearchValue(''),
          });
        }
        return tags;
      },
      getContent: (props) => (
        <ExploreContestList
          hideHeader
          contestStage={
            props.selectedContestStage === CONTEST_STAGE.ALL
              ? undefined
              : props.selectedContestStage === CONTEST_STAGE.ACTIVE
                ? ExploreContestStage.Active
                : ExploreContestStage.Past
          }
          selectedCommunityId={props.selectedContestCommunityId}
          searchValue={props.searchValue}
        />
      ),
    },
    {
      key: 'threads',
      label: 'Threads',
      getInlineFilters: (props) => {
        if (
          !props.communities ||
          !props.setThreadsFilterCommunityId ||
          !props.setThreadsFilterTags
        )
          return [];

        // Create community options for threads filter
        const threadsCommunityOptions = [
          { value: '', label: 'All' },
          ...(props.communities?.pages || [])
            .flatMap((page) => page.results)
            .map((community) => ({
              value: community.id || '',
              label: community.name || 'Unknown Community',
              fullLabel: community.name || 'Unknown Community',
            })),
        ];

        return [
          createSelectFilter({
            label: 'Community:',
            placeholder: 'Select Community',
            className: 'community-filter',
            options: threadsCommunityOptions,
            state: {
              selectedValue: props.threadsFilterCommunityId || '',
              setSelectedValue: props.setThreadsFilterCommunityId,
              filterTags: props.threadsFilterTags || [],
              setFilterTags: props.setThreadsFilterTags,
              forceRefreshKey: props.threadFilterKey,
              setForceRefreshKey: props.setThreadFilterKey,
            },
            tagPrefix: 'Community',
          }),
          createSortFilter({
            label: 'Sort by:',
            placeholder: 'Sort Threads',
            options: [
              { value: 'newest', label: 'Newest' },
              { value: 'upvotes', label: 'Most Upvotes' },
            ],
            state: {
              selectedValue: props.threadsSortOption || 'newest',
              setSelectedValue: props.setThreadsSortOption || (() => {}),
              filterTags: props.threadsFilterTags || [],
              setFilterTags: props.setThreadsFilterTags,
              forceRefreshKey: props.threadFilterKey,
              setForceRefreshKey: props.setThreadFilterKey,
            },
            tagPrefix: 'Sort',
            defaultValue: 'newest',
          }),
        ];
      },
      getFilterTags: (props) => {
        // Ensure props.threadsFilterTags is an array before spreading
        const baseTags = Array.isArray(props.threadsFilterTags)
          ? props.threadsFilterTags
          : [];
        const tags = [...baseTags];
        if (props.searchValue) {
          tags.push({
            label: `Search: ${props.searchValue}`,
            onRemove: () => props.setSearchValue(''),
          });
        }
        return tags;
      },
      getContent: (props) => {
        // Generate a stable key for the filtered thread feed
        const baseKey = props.threadFilterKey || 0;
        const searchKey = props.searchValue || '';
        const communityKey = props.threadsFilterCommunityId || '';
        const sortKey = props.threadsSortOption || 'newest';
        const refreshKey = `${baseKey}-${searchKey}-${communityKey}-${sortKey}`;

        return (
          <div className="threads-tab">
            <FilteredThreadsFeed
              key={refreshKey}
              communityId={props.threadsFilterCommunityId}
              sortOption={props.threadsSortOption}
              customScrollParent={props.containerRef.current}
              filterKey={Number(refreshKey)}
              searchTerm={props.searchValue}
            />
          </div>
        );
      },
    },
    {
      key: 'quests',
      label: 'Quests',
      featureFlag: 'xp',
      getInlineFilters: (props) => {
        if (!props.setSelectedQuestStage || !props.setQuestFilterTags)
          return [];

        return [
          createToggleFilter({
            label: 'Filter by:',
            placeholder: 'Select Quest Stage',
            options: [
              { value: QUEST_STAGE.ALL, label: 'All' },
              { value: QUEST_STAGE.ACTIVE, label: 'Active' },
              { value: QUEST_STAGE.PAST, label: 'Past' },
            ],
            state: {
              selectedValue: props.selectedQuestStage || QUEST_STAGE.ALL,
              setSelectedValue: props.setSelectedQuestStage,
              filterTags: props.questFilterTags || [],
              setFilterTags: props.setQuestFilterTags,
            },
            getLabel: (value) =>
              value === QUEST_STAGE.ALL
                ? 'All'
                : value === QUEST_STAGE.ACTIVE
                  ? 'Active'
                  : 'Past',
            getRemoveTagsFilter: (tags) =>
              tags.filter(
                (tag) =>
                  !tag.label.startsWith('All') &&
                  !tag.label.startsWith('Active') &&
                  !tag.label.startsWith('Past'),
              ),
            defaultValue: QUEST_STAGE.ALL,
            tagPrefix: 'Quests',
          }),
        ];
      },
      getFilterTags: (props) => {
        const tags = [...(props.questFilterTags || [])];
        if (props.searchValue) {
          tags.push({
            label: `Search: ${props.searchValue}`,
            onRemove: () => props.setSearchValue(''),
          });
        }
        return tags;
      },
      getContent: (props) => (
        <QuestList
          hideHeader
          stage={props.selectedQuestStage}
          searchValue={props.searchValue}
        />
      ),
    },
    {
      key: 'tokens',
      label: 'Tokens',
      featureFlag: 'launchpad',
      getInlineFilters: (props) => {
        if (
          !props.tags ||
          !props.setTokensFilterTag ||
          !props.setTokensFilterTags
        )
          return [];

        // Create token sort options
        const tokenSortOptions = [
          { value: 'mostRecent', label: 'Most Recent' },
          { value: 'marketCap', label: 'Market Cap' },
          { value: 'oldest', label: 'Oldest' },
          { value: 'gain24h', label: '24h Gain' },
          { value: 'lastActivity', label: 'Latest Activity' },
        ];

        // Create tag options for tokens filter
        const tokenTagOptions = [
          { value: '', label: 'All Tags' },
          ...(props.tags || []).map((tag) => ({
            value: String(tag.id),
            label: tag.name,
          })),
        ];

        return [
          createSelectFilter({
            label: 'Filter by:',
            placeholder: 'Select Tag',
            className: 'tag-filter',
            options: tokenTagOptions,
            state: {
              selectedValue: props.tokensFilterTag || '',
              setSelectedValue: props.setTokensFilterTag,
              filterTags: props.tokensFilterTags || [],
              setFilterTags: props.setTokensFilterTags,
            },
            tagPrefix: 'Tag',
          }),
          createSortFilter({
            label: 'Sort by:',
            placeholder: 'Sort Tokens',
            options: tokenSortOptions,
            state: {
              selectedValue: props.tokensSortOption || 'mostRecent',
              setSelectedValue: props.setTokensSortOption || (() => {}),
              filterTags: props.tokensFilterTags || [],
              setFilterTags: props.setTokensFilterTags,
              forceRefreshKey: props.threadFilterKey,
              setForceRefreshKey: props.setThreadFilterKey,
            },
            tagPrefix: 'Sort',
            defaultValue: 'mostRecent',
          }),
        ];
      },
      getFilterTags: (props) => {
        const tags = [...(props.tokensFilterTags || [])];
        if (props.searchValue) {
          tags.push({
            label: `Search: ${props.searchValue}`,
            onRemove: () => props.setSearchValue(''),
          });
        }
        return tags;
      },
      getContent: (props) => (
        <TokensList
          filters={{
            ...props.filters,
            withTagsIds: props.tokensFilterTag
              ? [parseInt(props.tokensFilterTag, 10)]
              : [],
            sortBy: props.tokensSortOption,
          }}
          hideHeader
          searchValue={props.searchValue}
        />
      ),
    },
  ];

  // Return tabs with helper functions
  return {
    tabs: tabsConfig,
    getEnabledTabs: (flags: Record<string, boolean>) => {
      return tabsConfig.filter(
        (tab) => !tab.featureFlag || flags[tab.featureFlag],
      );
    },
  };
}
