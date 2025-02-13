import { OpenFeature } from '@openfeature/web-sdk';
import {
  LocalStorageKeys,
  getLocalStorageItem,
  setLocalStorageItem,
} from 'helpers/localStorage';
import { devtools, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { createBoundedUseStore } from '../utils';
interface LocalAISettingsStore {
  aiCommentsFeatureEnabled: boolean;
  aiInteractionsToggleEnabled: boolean;
  aiCommentsToggleEnabled: boolean;
  setAIInteractionsToggleEnabled: (enabled: boolean) => void;
  setAICommentsToggleEnabled: (enabled: boolean) => void;
  updateFeatureFlags: (
    aiCommentsFeatureEnabled: boolean,
    aiInteractionsToggleEnabled: boolean,
  ) => void;
}

const client = OpenFeature.getClient();

export const LocalAISettingsStore = createStore<LocalAISettingsStore>()(
  devtools(
    persist(
      (set) => ({
        aiCommentsFeatureEnabled: client.getBooleanValue('aiComments', false),
        aiInteractionsToggleEnabled:
          getLocalStorageItem(LocalStorageKeys.AIInteractionsEnabled) ===
          'true',
        aiCommentsToggleEnabled:
          getLocalStorageItem(LocalStorageKeys.AICommentsEnabled) === 'true',

        setAIInteractionsToggleEnabled: (enabled) => {
          set(() => {
            setLocalStorageItem(
              LocalStorageKeys.AIInteractionsEnabled,
              String(enabled),
            );
            if (!enabled) {
              setLocalStorageItem(LocalStorageKeys.AICommentsEnabled, 'false');
            }
            return { aiInteractionsToggleEnabled: enabled };
          });
        },

        setAICommentsToggleEnabled: (enabled) => {
          set(() => {
            setLocalStorageItem(
              LocalStorageKeys.AICommentsEnabled,
              String(enabled),
            );
            return { aiCommentsToggleEnabled: enabled };
          });
        },

        updateFeatureFlags: (
          aiCommentsFeatureEnabled,
          aiInteractionsToggleEnabled,
        ) => {
          set(() => {
            if (!aiCommentsFeatureEnabled || !aiInteractionsToggleEnabled) {
              setLocalStorageItem(LocalStorageKeys.AICommentsEnabled, 'false');
              set({ aiCommentsToggleEnabled: false });
            }
            return {
              aiCommentsFeatureEnabled,
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
