import { UserTrainingCardTypes } from 'client/scripts/views/components/UserTrainingSlider/types';
import { createBoundedUseStore } from 'state/ui/utils';
import { devtools, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface UserTrainingCardsStore {
  completedActions: UserTrainingCardTypes[];
  markTrainingActionAsComplete: (
    action: UserTrainingCardTypes,
    profileId: string | number,
  ) => void;
  clearCompletedActionsState: () => void;
  trainingActionPermanentlyHidden: {
    [profileId: string]: UserTrainingCardTypes[]; // a list of cards to hide
  };
  markTrainingActionAsPermanentlyHidden: (
    action: UserTrainingCardTypes,
    profileId: string | number,
  ) => void;
}

export const UserTrainingCardsStore = createStore<UserTrainingCardsStore>()(
  devtools(
    persist(
      (set) => ({
        completedActions: [],
        markTrainingActionAsComplete: (action, profileId) => {
          set((state) => {
            return {
              ...state,
              // once an action is complete, it should show us with a completed checkmark
              completedActions: [
                ...state.completedActions,
                ...(state.completedActions?.includes(action) ? [] : [action]),
              ],
              // and the next time, the page is reloaded it shouldn't be visible
              trainingActionPermanentlyHidden: {
                ...state.trainingActionPermanentlyHidden,
                [profileId]: [
                  ...(state.trainingActionPermanentlyHidden[profileId] || []),
                  ...(state.trainingActionPermanentlyHidden?.[
                    profileId
                  ]?.includes(action)
                    ? []
                    : [action]),
                ],
              },
            };
          });
        },
        clearCompletedActionsState: () => {
          set((state) => {
            return {
              ...state,
              completedActions: [],
            };
          });
        },
        trainingActionPermanentlyHidden: {},
        markTrainingActionAsPermanentlyHidden: (action, profileId) => {
          // hide the action card even if it is showed with a completed checkmark
          set((state) => {
            return {
              ...state,
              completedActions: [...state.completedActions].filter(
                (name) => name !== action,
              ),
              trainingActionPermanentlyHidden: {
                ...state.trainingActionPermanentlyHidden,
                [profileId]: [
                  ...(state.trainingActionPermanentlyHidden[profileId] || []),
                  ...(state.trainingActionPermanentlyHidden?.[
                    profileId
                  ]?.includes(action)
                    ? []
                    : [action]),
                ],
              },
            };
          });
        },
      }),
      {
        name: 'user-training-cards-store', // unique name
        partialize: (state) => ({
          trainingActionPermanentlyHidden:
            state.trainingActionPermanentlyHidden,
        }), // persist trainingActionPermanentlyHidden
      },
    ),
  ),
);

const useUserTrainingCardsStore = createBoundedUseStore(UserTrainingCardsStore);

export default useUserTrainingCardsStore;
