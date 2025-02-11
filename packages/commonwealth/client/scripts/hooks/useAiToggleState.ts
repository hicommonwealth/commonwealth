import {
  LocalStorageKeys,
  getLocalStorageItem,
  setLocalStorageItem,
} from 'helpers/localStorage';
import { useCallback, useEffect, useState } from 'react';
import { useFlag } from './useFlag';

export const useAiToggleState = () => {
  const aiCommentsEnabled = useFlag('aiComments');
  const [userAiEnabled, setUserAiEnabled] = useState(
    getLocalStorageItem(LocalStorageKeys.AIInteractionsEnabled) === 'true' ||
      false,
  );

  const [useAiStreaming, setUseAiStreaming] = useState(
    getLocalStorageItem(LocalStorageKeys.AICommentsEnabled) === 'true' || false,
  );

  const handleAiToggle = useCallback((newValue: boolean) => {
    setUseAiStreaming(newValue);
    setLocalStorageItem(LocalStorageKeys.AICommentsEnabled, String(newValue));
  }, []);

  // Update localStorage when feature flag changes
  useEffect(() => {
    if (!aiCommentsEnabled || !userAiEnabled) {
      setUseAiStreaming(false);
      setLocalStorageItem(LocalStorageKeys.AICommentsEnabled, 'false');
    }
  }, [aiCommentsEnabled, userAiEnabled]);

  const setUserAiEnabledPreference = useCallback((enabled: boolean) => {
    setUserAiEnabled(enabled);
    setLocalStorageItem(
      LocalStorageKeys.AIInteractionsEnabled,
      String(enabled),
    );
    if (!enabled) {
      // If user disables AI, also disable streaming
      setUseAiStreaming(false);
      setLocalStorageItem(LocalStorageKeys.AICommentsEnabled, 'false');
    }
  }, []);

  const isAiAvailable = aiCommentsEnabled && userAiEnabled;

  return {
    useAiStreaming,
    setUseAiStreaming: handleAiToggle,
    aiCommentsEnabled: isAiAvailable, // This is what components will check for availability
    userAiEnabled,
    setUserAiEnabled: setUserAiEnabledPreference,
  };
};
