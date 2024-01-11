import { createBoundedUseStore } from 'state/ui/utils';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface GroupMutationBannerStore {
  shouldShowGroupMutationBannerForCommunities: string[];
  setShouldShowGroupMutationBannerForCommunity: (
    communityId: string,
    shouldShow: boolean,
  ) => void;
  readFromStorageAndSetGatingGroupBannerForCommunities: () => void;
  clearSetGatingGroupBannerForCommunities: () => void;
}

const STORAGE_KEY = 'groupMutationForCommunities';

export const GroupMutationBannerStore = createStore<GroupMutationBannerStore>()(
  devtools((set) => ({
    shouldShowGroupMutationBannerForCommunities: [],
    setShouldShowGroupMutationBannerForCommunity: (communityId, shouldShow) => {
      set((state) => {
        const communities = JSON.parse(
          localStorage.getItem(STORAGE_KEY) || `[]`,
        );
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            shouldShow
              ? [...communities, communityId]
              : [...communities].filter((id) => id !== communityId),
          ),
        );

        return {
          ...state,
          shouldShowGroupMutationBannerForCommunities: shouldShow
            ? [
                ...state.shouldShowGroupMutationBannerForCommunities,
                communityId,
              ]
            : [...state.shouldShowGroupMutationBannerForCommunities].filter(
                (val) => val !== communityId,
              ),
        };
      });
    },
    readFromStorageAndSetGatingGroupBannerForCommunities: () => {
      const communities = JSON.parse(localStorage.getItem(STORAGE_KEY) || `[]`);
      set((state) => {
        return {
          ...state,
          shouldShowGroupMutationBannerForCommunities: communities,
        };
      });
    },
    clearSetGatingGroupBannerForCommunities: () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      set((state) => {
        return {
          ...state,
          shouldShowGroupMutationBannerForCommunities: [],
        };
      });
    },
  })),
);

const useGroupMutationBannerStore = createBoundedUseStore(
  GroupMutationBannerStore,
);

export default useGroupMutationBannerStore;
