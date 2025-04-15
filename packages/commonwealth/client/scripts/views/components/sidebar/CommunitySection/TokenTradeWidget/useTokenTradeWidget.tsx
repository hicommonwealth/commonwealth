import { generateBlobImageFromAlphabet } from 'helpers/image';
import { useFlag } from 'hooks/useFlag';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import { useMemo, useState } from 'react';
import app from 'state';
import { useGetPinnedTokenByCommunityId } from 'state/api/communities';
import {
  useGetTokenByCommunityId,
  useTokenMetadataQuery,
} from 'state/api/tokens';
import { LaunchpadToken } from 'views/modals/TradeTokenModel/CommonTradeModal/types';
import { ExternalToken } from 'views/modals/TradeTokenModel/UniswapTradeModal/types';

export const useTokenTradeWidget = () => {
  const launchpadEnabled = useFlag('launchpad');
  const [
    generatedFallbackImageForPinnedToken,
    setGeneratedFallbackImageForPinnedToken,
  ] = useState('');

  const communityId = app.activeChainId() || '';
  const { data: communityLaunchpadToken, isLoading: isLoadingLaunchpadToken } =
    useGetTokenByCommunityId({
      community_id: communityId,
      with_stats: true,
      enabled: !!communityId && launchpadEnabled,
    });

  const { data: communityPinnedTokens, isLoading: isLoadingPinnedToken } =
    useGetPinnedTokenByCommunityId({
      community_ids: [communityId],
      with_chain_node: true,
      with_price: true,
      enabled: !!communityId,
    });
  const communityPinnedToken = communityPinnedTokens?.[0];
  const { data: tokenMetadata, isLoading: isLoadingTokenMetadata } =
    useTokenMetadataQuery({
      tokenId: communityPinnedToken?.contract_address || '',
      nodeEthChainId: communityPinnedToken?.ChainNode?.eth_chain_id || 0,
      apiEnabled: !!(communityPinnedToken?.contract_address || ''),
    });
  const communityPinnedTokenWithMetadata = useMemo(() => {
    return communityPinnedToken && tokenMetadata
      ? { ...communityPinnedToken, ...tokenMetadata }
      : null;
  }, [communityPinnedToken, tokenMetadata]);
  const isLoadingToken =
    (launchpadEnabled && isLoadingLaunchpadToken) ||
    (isLoadingPinnedToken && !communityLaunchpadToken) ||
    (isLoadingTokenMetadata && communityPinnedToken);

  const communityToken = useMemo(():
    | LaunchpadToken
    | ExternalToken
    | undefined => {
    if (communityLaunchpadToken) {
      return {
        ...communityLaunchpadToken,
        community_id: communityId,
      } as LaunchpadToken;
    } else if (communityPinnedTokenWithMetadata) {
      return {
        ...communityPinnedTokenWithMetadata,
        logo:
          communityPinnedTokenWithMetadata.logo ||
          generatedFallbackImageForPinnedToken ||
          // this url points to common logo, adding this here as a fallback in
          // case token metadata from alchemy doesn't include a token icon and we
          // failed to generate one from `generateBlobImageFromAlphabet` util
          'https://assets.commonwealth.im/b531c73a-eb29-4348-96af-db1114346f90.jpeg',
      } as ExternalToken;
    } else {
      return undefined;
    }
  }, [
    communityLaunchpadToken,
    communityPinnedTokenWithMetadata,
    generatedFallbackImageForPinnedToken,
    communityId,
  ]);

  useRunOnceOnCondition({
    callback: () => {
      if (communityPinnedTokenWithMetadata?.name) {
        generateBlobImageFromAlphabet({
          letter: communityPinnedTokenWithMetadata.name.charAt(0),
        })
          .then(setGeneratedFallbackImageForPinnedToken)
          .catch(console.error);
      }
    },
    shouldRun:
      !!communityPinnedTokenWithMetadata &&
      !communityPinnedTokenWithMetadata.logo &&
      !!communityPinnedTokenWithMetadata.name,
  });

  return {
    isLoadingToken,
    communityToken,
    isPinnedToken:
      !communityLaunchpadToken && !!communityPinnedTokenWithMetadata,
  };
};
