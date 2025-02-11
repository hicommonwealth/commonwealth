import {
  LocalStorageKeys,
  getLocalStorageItem,
  setLocalStorageItem,
} from 'helpers/localStorage';
import { useCallback, useEffect, useState } from 'react';
import { useFlag } from './useFlag';

export const useAiToggleState = () => {
  const aiCommentsFeatureEnabled = useFlag('aiComments');
  const [aiInteractionsToggleEnabled, setAIInteractionsToggleEnabled] =
    useState(
      getLocalStorageItem(LocalStorageKeys.AIInteractionsEnabled) === 'true',
    );

  const [aiCommentsToggleEnabled, setAICommentsToggleEnabled] = useState(
    getLocalStorageItem(LocalStorageKeys.AICommentsEnabled) === 'true',
  );

  const handleAiToggle = useCallback((newValue: boolean) => {
    setAICommentsToggleEnabled(newValue);
    setLocalStorageItem(LocalStorageKeys.AICommentsEnabled, String(newValue));
  }, []);

  // Update localStorage when feature flag changes
  useEffect(() => {
    if (!aiCommentsFeatureEnabled || !aiInteractionsToggleEnabled) {
      setAICommentsToggleEnabled(false);
      setLocalStorageItem(LocalStorageKeys.AICommentsEnabled, 'false');
    }
  }, [aiCommentsFeatureEnabled, aiInteractionsToggleEnabled]);

  const setAIInteractionsToggleEnabledPreference = useCallback(
    (enabled: boolean) => {
      setAIInteractionsToggleEnabled(enabled);
      setLocalStorageItem(
        LocalStorageKeys.AIInteractionsEnabled,
        String(enabled),
      );
      if (!enabled) {
        // If user disables AI, also disable streaming
        setAICommentsToggleEnabled(false);
        setLocalStorageItem(LocalStorageKeys.AICommentsEnabled, 'false');
      }
    },
    [],
  );

  const isAiAvailable = aiCommentsFeatureEnabled && aiInteractionsToggleEnabled;

  return {
    aiCommentsToggleEnabled,
    setAICommentsToggleEnabled: handleAiToggle,
    aiCommentsFeatureEnabled: isAiAvailable, // This is what components will check for availability
    aiInteractionsToggleEnabled,
    setAIInteractionsToggleEnabled: setAIInteractionsToggleEnabledPreference,
  };
};
