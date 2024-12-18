import { TokenView } from '@hicommonwealth/schemas';
import { useFlag } from 'hooks/useFlag';
import app from 'state';
import { useGetTokenByCommunityId } from 'state/api/tokens';
import { z } from 'zod';

export const useTokenTradeWidget = () => {
  const tokenizedCommunityEnabled = useFlag('tokenizedCommunity');

  const communityId = app.activeChainId() || '';
  const { data: communityLaunchpadToken, isLoading: isLoadingLaunchpadToken } =
    useGetTokenByCommunityId({
      community_id: communityId,
      with_stats: true,
      enabled: !!communityId && tokenizedCommunityEnabled,
    });

  const isLoadingToken = isLoadingLaunchpadToken;
  const communityToken = communityLaunchpadToken as z.infer<typeof TokenView>;

  return {
    isLoadingToken,
    communityToken,
  };
};
