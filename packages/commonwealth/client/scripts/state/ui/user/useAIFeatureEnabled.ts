import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useUserAiSettingsStore } from 'state/ui/user';

/**
 * Hook to determine if AI features are enabled for the current user and community.
 * Checks both the global feature flag, community-level setting, and user preferences.
 * Community-level setting overrides user preferences.
 */
export const useAIFeatureEnabled = () => {
  const { aiInteractionsToggleEnabled } = useUserAiSettingsStore();

  const communityId = app.activeChainId() || '';
  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });

  // Community-level setting overrides everything
  const communityAIEnabled = community?.ai_features_enabled;

  // AI is enabled if community allows AI and user has AI interactions enabled.
  const isAIEnabled = communityAIEnabled && aiInteractionsToggleEnabled;

  return {
    isAIEnabled,
    communityAIEnabled,
    aiInteractionsToggleEnabled,
  };
};
