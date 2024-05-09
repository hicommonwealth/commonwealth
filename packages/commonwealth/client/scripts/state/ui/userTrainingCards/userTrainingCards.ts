import { createBoundedUseStore } from 'state/ui/utils';
import { devtools, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface UserTrainingCardsStore {
  shouldHideTrainingCardsPermanently: {
    [profileId: string]: string[]; // a list of cards to hide
  };
  setShouldHideTrainingCardsPermanently: (
    profileId: number,
    cardName: string,
  ) => void;
}

export const UserTrainingCardsStore = createStore<UserTrainingCardsStore>()(
  devtools(
    persist(
      (set) => ({
        shouldHideTrainingCardsPermanently: {},
        shouldHideAdminCardsPermanently: [],
        setShouldHideTrainingCardsPermanently: (profileId, cardName) => {
          set((state) => {
            return {
              ...state,
              shouldHideTrainingCardsPermanently: {
                ...state.shouldHideTrainingCardsPermanently,
                [profileId]: [
                  ...(state.shouldHideTrainingCardsPermanently[profileId] ||
                    []),
                  cardName,
                ],
              },
            };
          });
        },
      }),
      {
        name: 'user-training-cards-store', // unique name
        partialize: (state) => ({
          shouldHideTrainingCardsPermanently:
            state.shouldHideTrainingCardsPermanently,
        }), // persist shouldHideTrainingCardsPermanently
      },
    ),
  ),
);

const useUserTrainingCardsStore = createBoundedUseStore(UserTrainingCardsStore);

export default useUserTrainingCardsStore;
