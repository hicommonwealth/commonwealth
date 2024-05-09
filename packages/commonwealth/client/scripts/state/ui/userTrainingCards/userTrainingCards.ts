import { UserTrainingCardTypes } from 'client/scripts/views/components/UserTrainingSlider/types';
import { createBoundedUseStore } from 'state/ui/utils';
import { devtools, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface UserTrainingCardsStore {
  cardTempMarkedAsCompleted: UserTrainingCardTypes[];
  setCardTempMarkedAsCompleted: (cardName: UserTrainingCardTypes) => void;
  unsetCardTempMarkedAsCompleted: (cardName: UserTrainingCardTypes) => void;
  clearCardsTempMarkedAsCompleted: () => void;
  shouldHideTrainingCardsPermanently: {
    [profileId: string]: UserTrainingCardTypes[]; // a list of cards to hide
  };
  setShouldHideTrainingCardsPermanently: (
    profileId: number,
    cardName: UserTrainingCardTypes,
  ) => void;
}

export const UserTrainingCardsStore = createStore<UserTrainingCardsStore>()(
  devtools(
    persist(
      (set) => ({
        cardTempMarkedAsCompleted: [],
        setCardTempMarkedAsCompleted: (cardName) => {
          set((state) => {
            if (state.cardTempMarkedAsCompleted?.includes(cardName)) {
              return state;
            }

            return {
              ...state,
              cardTempMarkedAsCompleted: [
                ...state.cardTempMarkedAsCompleted,
                cardName,
              ],
            };
          });
        },
        unsetCardTempMarkedAsCompleted: (cardName) => {
          set((state) => {
            return {
              ...state,
              cardTempMarkedAsCompleted: [
                ...state.cardTempMarkedAsCompleted,
              ].filter((name) => name !== cardName),
            };
          });
        },
        clearCardsTempMarkedAsCompleted: () => {
          set((state) => {
            return {
              ...state,
              cardTempMarkedAsCompleted: [],
            };
          });
        },
        shouldHideTrainingCardsPermanently: {},
        setShouldHideTrainingCardsPermanently: (profileId, cardName) => {
          set((state) => {
            if (
              state.shouldHideTrainingCardsPermanently?.[profileId]?.includes(
                cardName,
              )
            ) {
              return state;
            }

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
