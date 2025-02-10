import { useCallback, useEffect, useState } from 'react';
import { useFlag } from './useFlag';

const AI_TOGGLE_STORAGE_KEY = 'ai-comments-toggle-state';
const USER_AI_ENABLED_KEY = 'user-ai-enabled';

export const useAiToggleState = () => {
  const aiCommentsEnabled = useFlag('aiComments');
  const [userAiEnabled, setUserAiEnabled] = useState(() => {
    const stored = localStorage.getItem(USER_AI_ENABLED_KEY);
    return stored ? stored === 'true' : false; // Default to false for new users
  });

  const [useAiStreaming, setUseAiStreaming] = useState(() => {
    // Initialize from localStorage, defaulting to false
    const stored = localStorage.getItem(AI_TOGGLE_STORAGE_KEY);
    return stored ? stored === 'true' : false;
  });

  const handleAiToggle = useCallback((newValue: boolean) => {
    setUseAiStreaming(newValue);
    localStorage.setItem(AI_TOGGLE_STORAGE_KEY, String(newValue));
  }, []);

  // Update localStorage when feature flag changes
  useEffect(() => {
    if (!aiCommentsEnabled || !userAiEnabled) {
      setUseAiStreaming(false);
      localStorage.setItem(AI_TOGGLE_STORAGE_KEY, 'false');
    }
  }, [aiCommentsEnabled, userAiEnabled]);

  const setUserAiEnabledPreference = useCallback((enabled: boolean) => {
    setUserAiEnabled(enabled);
    localStorage.setItem(USER_AI_ENABLED_KEY, String(enabled));
    if (!enabled) {
      // If user disables AI, also disable streaming
      setUseAiStreaming(false);
      localStorage.setItem(AI_TOGGLE_STORAGE_KEY, 'false');
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
