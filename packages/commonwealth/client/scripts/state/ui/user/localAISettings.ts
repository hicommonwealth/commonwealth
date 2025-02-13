import { devtools, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { createBoundedUseStore } from '../utils';
interface LocalAISettingsStore {
  aiInteractionsToggleEnabled: boolean;
  aiCommentsToggleEnabled: boolean;
  setAIInteractionsToggleEnabled: (enabled: boolean) => void;
  setAICommentsToggleEnabled: (enabled: boolean) => void;
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
        }), // persist only these states
      },
    ),
  ),
);

const useLocalAISettingsStore = createBoundedUseStore(LocalAISettingsStore);

export { useLocalAISettingsStore };
export default useLocalAISettingsStore;
