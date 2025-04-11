import { createStore } from 'zustand/vanilla';
import {
  CommunityFilters,
  CommunitySortDirections,
  CommunitySortOptions,
} from '../../../views/pages/Communities/FiltersDrawer';
import {
  FilterTag,
  ViewType,
} from '../../../views/pages/Communities/SearchFilterRow';
import {
  CONTEST_STAGE,
  ContestStageType,
  QUEST_STAGE,
  QuestStageType,
} from '../../../views/pages/Communities/tabConfig';
import { createBoundedUseStore } from '../utils';

// Define the type for the quest filter option
interface QuestFilterOption {
  label: {
    name: string;
    imageURL?: string;
  };
  value: number; // Assuming quest ID is a number
}

interface CommunitiesPageState {
  // Common state
  searchValue: string;
  setSearchValue: (value: string) => void;
  selectedViewType: ViewType;
  setSelectedViewType: (viewType: ViewType) => void;

  // Communities tab state
  filters: CommunityFilters;
  setFilters: (filters: CommunityFilters) => void;
  isFilterDrawerOpen: boolean;
  setIsFilterDrawerOpen: (isOpen: boolean) => void;

  // Users tab
  selectedQuestFilter: QuestFilterOption | null;
  setSelectedQuestFilter: (filter: QuestFilterOption | null) => void;

  // Quests tab
  selectedQuestStage: QuestStageType;
  setSelectedQuestStage: (stage: QuestStageType) => void;
  questFilterTags: FilterTag[];
  setQuestFilterTags: (tags: FilterTag[]) => void;

  // Contest tab
  selectedContestStage: ContestStageType;
  setSelectedContestStage: (stage: ContestStageType) => void;
  selectedContestCommunityId: string;
  setSelectedContestCommunityId: (id: string) => void;
  contestFilterTags: FilterTag[];
  setContestFilterTags: (tags: FilterTag[]) => void;

  // Threads tab
  threadsFilterCommunityId: string;
  setThreadsFilterCommunityId: (id: string) => void;
  threadsSortOption: string;
  setThreadsSortOption: (option: string) => void;
  threadsFilterTags: FilterTag[];
  setThreadsFilterTags: (tags: FilterTag[]) => void;
  threadFilterKey: number;
  setThreadFilterKey: (key: number) => void;

  // Tokens tab
  tokensFilterTag: string;
  setTokensFilterTag: (tag: string) => void;
  tokensSortOption: string;
  setTokensSortOption: (option: string) => void;
  tokensFilterTags: FilterTag[];
  setTokensFilterTags: (tags: FilterTag[]) => void;

  // Reset function for tab switching
  resetTabState: (exceptSearchValue?: boolean) => void;
}

export const communitiesPageStore = createStore<CommunitiesPageState>()(
  (set) => ({
    // Common state
    searchValue: '',
    setSearchValue: (value) => set({ searchValue: value }),
    selectedViewType: ViewType.Cards,
    setSelectedViewType: (viewType) => set({ selectedViewType: viewType }),

    // Communities tab state
    filters: {
      withCommunityEcosystem: undefined,
      withStakeEnabled: undefined,
      withTagsIds: [],
      withCommunitySortBy: CommunitySortOptions.MemberCount,
      withCommunitySortOrder: CommunitySortDirections.Descending,
      withCommunityType: undefined,
      withEcosystemChainId: undefined,
      withNetwork: undefined,
    },
    setFilters: (filters) => set({ filters }),
    isFilterDrawerOpen: false,
    setIsFilterDrawerOpen: (isOpen) => set({ isFilterDrawerOpen: isOpen }),

    // Users tab
    selectedQuestFilter: null,
    setSelectedQuestFilter: (filter) => set({ selectedQuestFilter: filter }),

    // Quests tab
    selectedQuestStage: QUEST_STAGE.ALL,
    setSelectedQuestStage: (stage) => set({ selectedQuestStage: stage }),
    questFilterTags: [],
    setQuestFilterTags: (tags) => set({ questFilterTags: tags }),

    // Contest tab
    selectedContestStage: CONTEST_STAGE.ALL,
    setSelectedContestStage: (stage) => set({ selectedContestStage: stage }),
    selectedContestCommunityId: '',
    setSelectedContestCommunityId: (id) =>
      set({ selectedContestCommunityId: id }),
    contestFilterTags: [],
    setContestFilterTags: (tags) => set({ contestFilterTags: tags }),

    // Threads tab
    threadsFilterCommunityId: '',
    setThreadsFilterCommunityId: (id) => set({ threadsFilterCommunityId: id }),
    threadsSortOption: 'newest',
    setThreadsSortOption: (option) => set({ threadsSortOption: option }),
    threadsFilterTags: [],
    setThreadsFilterTags: (tags) => set({ threadsFilterTags: tags }),
    threadFilterKey: 0,
    setThreadFilterKey: (key) => set({ threadFilterKey: key }),

    // Tokens tab
    tokensFilterTag: '',
    setTokensFilterTag: (tag) => set({ tokensFilterTag: tag }),
    tokensSortOption: 'mostRecent',
    setTokensSortOption: (option) => set({ tokensSortOption: option }),
    tokensFilterTags: [],
    setTokensFilterTags: (tags) => set({ tokensFilterTags: tags }),

    // Reset function for tab switching
    resetTabState: (exceptSearchValue = false) =>
      set((state) => ({
        ...state,
        ...(exceptSearchValue ? {} : { searchValue: '' }),
        selectedQuestFilter: null,
        questFilterTags: [],
        contestFilterTags: [],
        threadsFilterTags: [],
        tokensFilterTags: [],
        threadFilterKey: state.threadFilterKey + 1,
      })),
  }),
);

const useCommunitiesPageStore = createBoundedUseStore(communitiesPageStore);
export default useCommunitiesPageStore;
