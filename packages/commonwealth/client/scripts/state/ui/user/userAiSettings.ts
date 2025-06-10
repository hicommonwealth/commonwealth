import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { createBoundedUseStore } from '../utils';

export type AIModelOption = {
  value: string;
  label: string;
};

interface UserAiSettingsStore {
  // AI interactions toggle in Edit profile page - personal preference
  aiInteractionsToggleEnabled: boolean;
  // AI reply toggle in thread / comment creation page - personal preference
  aiCommentsToggleEnabled: boolean;
  setAIInteractionsToggleEnabled: (enabled: boolean) => void;
  setAICommentsToggleEnabled: (enabled: boolean) => void;
  selectedModels: AIModelOption[];
  setSelectedModels: (models: AIModelOption[]) => void;
}

const userAiSettingsStore = createStore<UserAiSettingsStore>()(
  persist(
    (set) => ({
      aiInteractionsToggleEnabled: true,
      aiCommentsToggleEnabled: true,
      setAIInteractionsToggleEnabled: (enabled: boolean) => {
        set({ aiInteractionsToggleEnabled: enabled });
      },
      setAICommentsToggleEnabled: (enabled: boolean) => {
        set({ aiCommentsToggleEnabled: enabled });
      },
      selectedModels: [],
      setSelectedModels: (models) => set({ selectedModels: models }),
    }),
    {
      name: 'local-ai-settings-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        aiInteractionsToggleEnabled: state.aiInteractionsToggleEnabled,
        aiCommentsToggleEnabled: state.aiCommentsToggleEnabled,
        selectedModels: state.selectedModels,
      }),
    },
  ),
);

export const useUserAiSettingsStore =
  createBoundedUseStore(userAiSettingsStore);
