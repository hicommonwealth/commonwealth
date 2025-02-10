import { useCallback, useEffect, useState } from 'react';
import { useFlag } from './useFlag';

const AI_TOGGLE_STORAGE_KEY = 'ai-comments-toggle-state';

export const useAiToggleState = () => {
  const aiCommentsEnabled = useFlag('aiComments');
  const [useAiStreaming, setUseAiStreaming] = useState(() => {
    // Initialize from localStorage, defaulting to true if feature is enabled
    const stored = localStorage.getItem(AI_TOGGLE_STORAGE_KEY);
    return stored ? stored === 'true' : aiCommentsEnabled;
  });

  const handleAiToggle = useCallback((newValue: boolean) => {
    setUseAiStreaming(newValue);
    localStorage.setItem(AI_TOGGLE_STORAGE_KEY, String(newValue));
  }, []);

  // Update localStorage when feature flag changes
  useEffect(() => {
    if (!aiCommentsEnabled) {
      setUseAiStreaming(false);
      localStorage.setItem(AI_TOGGLE_STORAGE_KEY, 'false');
    }
  }, [aiCommentsEnabled]);

  return {
    useAiStreaming,
    setUseAiStreaming: handleAiToggle,
    aiCommentsEnabled,
  };
};
