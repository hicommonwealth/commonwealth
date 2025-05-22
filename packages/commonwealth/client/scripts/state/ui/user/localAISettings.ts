import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { createBoundedUseStore } from '../utils';

// Define AIModelOption type
export type AIModelOption = {
  value: string; // e.g., 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet'
  label: string; // e.g., 'GPT-4o', 'Claude 3.5 Sonnet'
  description?: string;
  pricing?: any; // Or a more specific type
};

interface LocalAISettingsStore {
  aiInteractionsToggleEnabled: boolean;
  aiCommentsToggleEnabled: boolean;
  setAIInteractionsToggleEnabled: (enabled: boolean) => void;
  setAICommentsToggleEnabled: (enabled: boolean) => void;
  preferredModel?: string;
  setPreferredModel: (model?: string) => void;
  showSuggestions?: boolean;
  setShowSuggestions: (show: boolean) => void;
  selectedModels: AIModelOption[];
  setSelectedModels: (models: AIModelOption[]) => void;
}

const localAISettingsStore = createStore<LocalAISettingsStore>()(
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
      preferredModel: undefined,
      setPreferredModel: (model) => set({ preferredModel: model }),
      showSuggestions: true,
      setShowSuggestions: (show) => set({ showSuggestions: show }),
      selectedModels: [],
      setSelectedModels: (models) => set({ selectedModels: models }),
    }),
    {
      name: 'local-ai-settings-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        aiInteractionsToggleEnabled: state.aiInteractionsToggleEnabled,
        aiCommentsToggleEnabled: state.aiCommentsToggleEnabled,
        preferredModel: state.preferredModel,
        showSuggestions: state.showSuggestions,
        selectedModels: state.selectedModels,
      }),
    },
  ),
);

export const useLocalAISettingsStore =
  createBoundedUseStore(localAISettingsStore);
