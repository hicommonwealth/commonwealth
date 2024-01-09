import { createBoundedUseStore } from 'state/ui/utils';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface GroupMutationBannerStore {
  shouldHideAdminOnboardingCardsForCommunities: string[];
  setShouldHideAdminOnboardingCardsForCommunity: (
    communityId: string,
    shouldHidePermanently: boolean,
  ) => void;
  readFromStorageAndSetAdminOnboardingCardVisibilityForCommunities: () => void;
  clearSetAdminOnboardingCardVisibilityForCommunities: () => void;
}

const STORAGE_KEY = 'adminOnboardingCardsVisibilityForCommunities';

export const GroupMutationBannerStore = createStore<GroupMutationBannerStore>()(
  devtools((set) => ({
    shouldHideAdminOnboardingCardsForCommunities: [],
    setShouldHideAdminOnboardingCardsForCommunity: (
      communityId,
      shouldHidePermanently,
    ) => {
      set((state) => {
        const communities = JSON.parse(
          localStorage.getItem(STORAGE_KEY) || `[]`,
        );
        if (shouldHidePermanently) {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify([...communities, communityId]),
          );
        }

        return {
          ...state,
          shouldHideAdminOnboardingCardsForCommunities: [
            ...state.shouldHideAdminOnboardingCardsForCommunities,
            communityId,
          ],
        };
      });
    },
    readFromStorageAndSetAdminOnboardingCardVisibilityForCommunities: () => {
      const communities = JSON.parse(localStorage.getItem(STORAGE_KEY) || `[]`);
      set((state) => {
        return {
          ...state,
          shouldHideAdminOnboardingCardsForCommunities: communities,
        };
      });
    },
    clearSetAdminOnboardingCardVisibilityForCommunities: () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      set((state) => {
        return {
          ...state,
          shouldHideAdminOnboardingCardsForCommunities: [],
        };
      });
    },
  })),
);

const useGroupMutationBannerStore = createBoundedUseStore(
  GroupMutationBannerStore,
);

export default useGroupMutationBannerStore;
