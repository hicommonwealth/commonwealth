import React, { MutableRefObject, ReactNode, RefObject } from 'react';
import { useFetchGlobalActivityQuery } from 'state/api/feeds/fetchUserActivity';
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
import { CommunityFilters, FiltersDrawer } from './FiltersDrawer';
import QuestList from './QuestList';
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

// Define types for tab configuration
export interface TabConfig {
  key: string;
  label: string;
  featureFlag?: string; // Optional feature flag to enable/disable the tab
  getInlineFilters?: (props: TabContentProps) => InlineFilter[];
  getFilterClickHandler?: (props: TabContentProps) => (() => void) | undefined;
  getFilterTags?: (props: TabContentProps) => FilterTag[];
  showViewToggle?: boolean;
  getContent: (props: TabContentProps) => ReactNode;
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
  communitiesList: any[];
  filteredCommunitiesList: any[];
  isLoading: boolean;
  isInitialCommunitiesLoading: boolean;
  hasNextPage?: boolean;
  fetchMoreCommunities?: () => Promise<void>;
  historicalPrices?: any;
  ethUsdRate?: number;
  selectedCommunityId?: string;
  setSelectedCommunityId?: (id: string) => void;
  communities?: any;
  tags?: any[];
  // Tab-specific states
  selectedQuestFilter?: any;
  setSelectedQuestFilter?: (filter: any) => void;
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
  contestCommunityOptions?: any[];
  questOptions?: any[];
}

// Helper component for threads tab
const FilteredThreadsFeed = ({
  communityId,
  sortOption,
  customScrollParent,
  filterKey,
}: {
  communityId?: string;
  sortOption?: string;
  customScrollParent?: any;
  filterKey?: number;
}) => {
  // Use the global feed query
  const query = ({ limit }: { limit: number }) => {
    return useFetchGlobalActivityQuery({ limit });
  };

  return (
    <Feed
      key={`threads-feed-${filterKey}`}
      query={query}
      customScrollParent={customScrollParent}
    />
  );
};

// Helper function to safely cast container reference
const safeContainerRef = (
  ref: RefObject<HTMLDivElement>,
): MutableRefObject<HTMLElement | undefined> => {
  return ref as unknown as MutableRefObject<HTMLElement | undefined>;
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
      getFilterClickHandler: (props) => () => props.setIsFilterDrawerOpen(true),
      getFilterTags: (props) => {
        const filterTags: FilterTag[] = [];

        if (props.searchValue) {
          filterTags.push({
            label: `Search: ${props.searchValue}`,
            onRemove: () => props.setSearchValue(''),
          });
        }

        if (props.filters.withCommunitySortBy) {
          filterTags.push({
            label: `${props.filters.withCommunitySortBy}${
              props.filters.withCommunitySortOrder &&
              props.filters.withCommunitySortBy !== 'Newest'
                ? ` : ${props.filters.withCommunitySortOrder}`
                : ''
            }`,
            onRemove: () =>
              props.setFilters({
                ...props.filters,
                withCommunitySortBy: undefined,
                withCommunitySortOrder: undefined,
              }),
          });
        }

        // Add more filter tags as needed
        if (props.filters.withCommunityType) {
          filterTags.push({
            label: String(props.filters.withCommunityType),
            onRemove: () =>
              props.setFilters({
                ...props.filters,
                withCommunityType: undefined,
              }),
          });
        }

        if (props.filters.withNetwork) {
          filterTags.push({
            label: String(props.filters.withNetwork),
            onRemove: () =>
              props.setFilters({
                ...props.filters,
                withNetwork: undefined,
              }),
          });
        }

        if (props.filters.withCommunityEcosystem) {
          filterTags.push({
            label: String(props.filters.withCommunityEcosystem),
            onRemove: () =>
              props.setFilters({
                ...props.filters,
                withCommunityEcosystem: undefined,
              }),
          });
        }

        if (props.filters.withStakeEnabled) {
          filterTags.push({
            label: 'Stake',
            onRemove: () =>
              props.setFilters({
                ...props.filters,
                withStakeEnabled: false,
              }),
          });
        }

        if (props.filters.withTagsIds) {
          props.filters.withTagsIds.forEach((id) => {
            const tagName = (props.tags || []).find((t) => t.id === id)?.name;
            if (tagName) {
              filterTags.push({
                label: tagName,
                onRemove: () =>
                  props.setFilters({
                    ...props.filters,
                    withTagsIds: [...(props.filters.withTagsIds || [])].filter(
                      (tagId) => tagId !== id,
                    ),
                  }),
              });
            }
          });
        }

        return filterTags;
      },
      getContent: (props) => {
        // Ensure setSelectedCommunityId is defined
        const setCommunityId = props.setSelectedCommunityId || (() => {});

        return (
          <>
            <FiltersDrawer
              isOpen={props.isFilterDrawerOpen}
              onClose={() => props.setIsFilterDrawerOpen(false)}
              filters={props.filters}
              onFiltersChange={(newFilters) => props.setFilters(newFilters)}
            />
            <CommunitiesTabContent
              isLoading={props.isLoading}
              isInitialCommunitiesLoading={props.isInitialCommunitiesLoading}
              communitiesList={
                props.searchValue
                  ? props.filteredCommunitiesList
                  : props.communitiesList
              }
              containerRef={safeContainerRef(props.containerRef)}
              filters={props.filters}
              historicalPrices={props.historicalPrices}
              ethUsdRate={Number(props.ethUsdRate)}
              setSelectedCommunityId={setCommunityId}
              hasNextPage={props.hasNextPage || false}
              fetchMoreCommunities={
                props.fetchMoreCommunities || (async () => {})
              }
            />
          </>
        );
      },
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
            onChange: (option) => props.setSelectedQuestFilter?.(option),
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
              selectedQuest={props.selectedQuestFilter}
              onQuestChange={props.setSelectedQuestFilter}
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
        const tags = [...(props.threadsFilterTags || [])];
        if (props.searchValue) {
          tags.push({
            label: `Search: ${props.searchValue}`,
            onRemove: () => props.setSearchValue(''),
          });
        }
        return tags;
      },
      getContent: (props) => (
        <div className="threads-tab">
          <FilteredThreadsFeed
            communityId={props.threadsFilterCommunityId}
            sortOption={props.threadsSortOption}
            customScrollParent={props.containerRef.current}
            filterKey={props.threadFilterKey}
          />
        </div>
      ),
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
        <QuestList hideHeader stage={props.selectedQuestStage} />
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
          createSelectFilter({
            label: 'Sort by:',
            placeholder: 'Sort Tokens',
            options: tokenSortOptions,
            state: {
              selectedValue: props.tokensSortOption || 'mostRecent',
              setSelectedValue: props.setTokensSortOption || (() => {}),
              filterTags: props.tokensFilterTags || [],
              setFilterTags: props.setTokensFilterTags,
            },
            getTagLabel: (option) => option.label,
            tagPrefix: 'Sort',
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
