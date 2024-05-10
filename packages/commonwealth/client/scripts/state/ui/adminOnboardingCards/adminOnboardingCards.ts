import { createBoundedUseStore } from 'state/ui/utils';
import { devtools, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface AdminActionCardsStore {
  isVisible: boolean;
  setIsVisible: (visibility: boolean) => void;
  shouldHideAdminCardsTemporary: string[];
  shouldHideAdminCardsPermanently: string[];
  setShouldHideAdminOnboardingCardsForCommunity: (
    communityId: string,
    shouldHidePermanently: boolean,
  ) => void;
  clearSetAdminOnboardingCardVisibilityForCommunities: () => void;
}

export const AdminActionCardsStore = createStore<AdminActionCardsStore>()(
  devtools(
    persist(
      (set) => ({
        isVisible: false,
        setIsVisible: (visibility) => {
          set((state) => {
            return {
              ...state,
              isVisible: visibility,
            };
          });
        },
        shouldHideAdminCardsTemporary: [],
        shouldHideAdminCardsPermanently: [],
        setShouldHideAdminOnboardingCardsForCommunity: (
          communityId,
          shouldHidePermanently,
        ) => {
          set((state) => {
            if (shouldHidePermanently) {
              return {
                ...state,
                shouldHideAdminCardsPermanently: [
                  ...state.shouldHideAdminCardsPermanently,
                  communityId,
                ],
              };
            }

            return {
              ...state,
              shouldHideAdminCardsTemporary: [
                ...state.shouldHideAdminCardsTemporary,
                communityId,
              ],
            };
          });
        },
        clearSetAdminOnboardingCardVisibilityForCommunities: () => {
          set((state) => {
            return {
              ...state,
              shouldHideAdminCardsPermanently: [],
              shouldHideAdminCardsTemporary: [],
            };
          });
        },
      }),
      {
        name: 'admin-onboarding-cards-store', // unique name
        partialize: (state) => ({
          shouldHideAdminCardsPermanently:
            state.shouldHideAdminCardsPermanently,
        }), // persist only shouldHideAdminCardsPermanently
      },
    ),
  ),
);

const useAdminActionCardsStore = createBoundedUseStore(AdminActionCardsStore);

export default useAdminActionCardsStore;
