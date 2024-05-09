import { createBoundedUseStore } from 'state/ui/utils';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface UserTrainingCardsStore {
  shouldHideTrainingCardsTemporary: string[]; // a list of cards to temporarily hide
  setShouldHideTrainingCardsTemporary: (cardName: string) => void;
}

export const UserTrainingCardsStore = createStore<UserTrainingCardsStore>()(
  devtools((set) => ({
    shouldHideTrainingCardsTemporary: [],
    shouldHideAdminCardsPermanently: [],
    setShouldHideTrainingCardsTemporary: (cardName) => {
      set((state) => {
        return {
          ...state,
          shouldHideTrainingCardsTemporary: [
            ...state.shouldHideTrainingCardsTemporary,
            cardName,
          ],
        };
      });
    },
  })),
);

const useUserTrainingCardsStore = createBoundedUseStore(UserTrainingCardsStore);

export default useUserTrainingCardsStore;
