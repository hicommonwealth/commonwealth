import { createBoundedUseStore } from 'state/ui/utils';
import { UserTrainingCardTypes } from 'views/components/UserTrainingSlider/types';
import { devtools, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface UserTrainingCardsStore {
  completedActions: UserTrainingCardTypes[];
  markTrainingActionAsComplete: (
    action: UserTrainingCardTypes,
    userId: string | number,
  ) => void;
  clearCompletedActionsState: () => void;
  trainingActionPermanentlyHidden: {
    [userId: string]: UserTrainingCardTypes[]; // a list of cards to hide
  };
  markTrainingActionAsPermanentlyHidden: (
    action: UserTrainingCardTypes,
    userId: string | number,
  ) => void;
}

export const UserTrainingCardsStore = createStore<UserTrainingCardsStore>()(
  devtools(
    persist(
      (set) => ({
        completedActions: [],
        markTrainingActionAsComplete: (action, userId) => {
          set((state) => {
            const isAlreadyCompleted = (
              state?.trainingActionPermanentlyHidden?.[userId] || []
            )?.includes(action);

            return {
              ...state,
              // once an action is complete, it should show us with a completed checkmark
              completedActions: [
                ...state.completedActions,
                ...(state.completedActions?.includes(action) ||
                isAlreadyCompleted
                  ? []
                  : [action]),
              ],
              // and the next time, the page is reloaded it shouldn't be visible
              trainingActionPermanentlyHidden: {
                ...state.trainingActionPermanentlyHidden,
                [userId]: [
                  ...(state.trainingActionPermanentlyHidden[userId] || []),
                  ...(state.trainingActionPermanentlyHidden?.[userId]?.includes(
                    action,
                  )
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
        markTrainingActionAsPermanentlyHidden: (action, userId) => {
          // hide the action card even if it is showed with a completed checkmark
          set((state) => {
            return {
              ...state,
              completedActions: [...state.completedActions].filter(
                (name) => name !== action,
              ),
              trainingActionPermanentlyHidden: {
                ...state.trainingActionPermanentlyHidden,
                [userId]: [
                  ...(state.trainingActionPermanentlyHidden[userId] || []),
                  ...(state.trainingActionPermanentlyHidden?.[userId]?.includes(
                    action,
                  )
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
