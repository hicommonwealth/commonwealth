import { useFlag } from 'hooks/useFlag';
import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useLocalAISettingsStore } from 'state/ui/user';

/**
 * Hook to determine if AI features are enabled for the current user and community.
 * Checks both the global feature flag, community-level setting, and user preferences.
 * Community-level setting overrides user preferences.
 */
export const useAIFeatureEnabled = () => {
  const aiCommentsFeatureEnabled = useFlag('aiComments');
  const { aiInteractionsToggleEnabled } = useLocalAISettingsStore();

  const communityId = app.activeChainId() || '';
  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });

  // Community-level setting overrides everything
  const communityAIEnabled = community?.ai_features_enabled;

  // AI is enabled if:
  // 1. Feature flag is on AND
  // 2. Community allows AI AND
  // 3. User has AI interactions enabled
  const isAIEnabled =
    aiCommentsFeatureEnabled &&
    communityAIEnabled &&
    aiInteractionsToggleEnabled;

  return {
    isAIEnabled,
    communityAIEnabled,
    aiCommentsFeatureEnabled,
    aiInteractionsToggleEnabled,
  };
};
