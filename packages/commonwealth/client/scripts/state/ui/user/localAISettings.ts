import { devtools, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { createBoundedUseStore } from '../utils';

export type AIModelOption = {
  value: string;
  label: string;
  description?: string;
  pricing?: any;
};

interface LocalAISettingsStore {
  aiInteractionsToggleEnabled: boolean;
  aiCommentsToggleEnabled: boolean;
  selectedModels: AIModelOption[];
  setAIInteractionsToggleEnabled: (enabled: boolean) => void;
  setAICommentsToggleEnabled: (enabled: boolean) => void;
  setSelectedModels: (models: AIModelOption[]) => void;
  updateFeatureFlags: (
    aiCommentsToggleEnabled: boolean,
    aiInteractionsToggleEnabled: boolean,
  ) => void;
}

export const LocalAISettingsStore = createStore<LocalAISettingsStore>()(
  devtools(
    persist(
      (set) => ({
        aiInteractionsToggleEnabled: false,
        aiCommentsToggleEnabled: false,
        selectedModels: [],
        setAIInteractionsToggleEnabled: (enabled) => {
          set(() => {
            return {
              aiInteractionsToggleEnabled: enabled,
              ...(!enabled && { aiCommentsToggleEnabled: false }),
            };
          });
        },

        setAICommentsToggleEnabled: (enabled) => {
          set(() => {
            return { aiCommentsToggleEnabled: enabled };
          });
        },

        setSelectedModels: (models) => {
          set(() => {
            return { selectedModels: models };
          });
        },

        updateFeatureFlags: (
          aiCommentsToggleEnabled,
          aiInteractionsToggleEnabled,
        ) => {
          set(() => {
            return {
              aiCommentsToggleEnabled,
              aiInteractionsToggleEnabled,
            };
          });
        },
      }),
      {
        name: 'local-ai-settings-store', // unique name
        partialize: (state) => ({
          aiInteractionsToggleEnabled: state.aiInteractionsToggleEnabled,
          aiCommentsToggleEnabled: state.aiCommentsToggleEnabled,
          selectedModels: state.selectedModels,
        }), // persist these states
      },
    ),
  ),
);

const useLocalAISettingsStore = createBoundedUseStore(LocalAISettingsStore);

export { useLocalAISettingsStore };
export default useLocalAISettingsStore;
