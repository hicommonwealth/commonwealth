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
  // Web search toggle for AI replies - enables real-time web search
  webSearchEnabled: boolean;
  setAIInteractionsToggleEnabled: (enabled: boolean) => void;
  setAICommentsToggleEnabled: (enabled: boolean) => void;
  setWebSearchEnabled: (enabled: boolean) => void;
  selectedModels: AIModelOption[];
  setSelectedModels: (models: AIModelOption[]) => void;
}

const userAiSettingsStore = createStore<UserAiSettingsStore>()(
  persist(
    (set) => ({
      aiInteractionsToggleEnabled: true,
      aiCommentsToggleEnabled: true,
      webSearchEnabled: false,
      setAIInteractionsToggleEnabled: (enabled: boolean) => {
        set({ aiInteractionsToggleEnabled: enabled });
      },
      setAICommentsToggleEnabled: (enabled: boolean) => {
        set({ aiCommentsToggleEnabled: enabled });
      },
      setWebSearchEnabled: (enabled: boolean) => {
        set({ webSearchEnabled: enabled });
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
        webSearchEnabled: state.webSearchEnabled,
        selectedModels: state.selectedModels,
      }),
    },
  ),
);

export const useUserAiSettingsStore =
  createBoundedUseStore(userAiSettingsStore);
