import { commonProtocol } from '@hicommonwealth/evm-protocols';
import React from 'react';
import app from 'state';
import { useGetPinnedTokenByCommunityId } from 'state/api/communities';
import { useTokenMetadataQuery } from 'state/api/tokens';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from '../../404';
import ConnectTokenForm from './ConnectTokenForm';
import ManageConnectedToken from './ManageConnectedToken';
import Status from './Status';
import './TokenIntegration.scss';

const TokenIntegration = () => {
  const communityId = app.activeChainId() || '';

  const { data: communityTokens, isLoading: isLoadingPinnedToken } =
    useGetPinnedTokenByCommunityId({
      community_ids: [communityId],
      with_chain_node: true,
      enabled: !!communityId,
    });
  const communityPinnedToken = communityTokens?.[0];

  const { data: tokenMetadata, isLoading: isLoadingTokenMetadata } =
    useTokenMetadataQuery({
      tokenId: communityPinnedToken?.contract_address || '',
      nodeEthChainId: communityPinnedToken?.ChainNode?.eth_chain_id || 0,
      apiEnabled: !!(communityPinnedToken?.contract_address || ''),
    });
  const isExternalTokenLinked = !!communityPinnedToken;
  const isLoading =
    isLoadingPinnedToken || (isLoadingTokenMetadata && isExternalTokenLinked);

  const contractInfo =
    commonProtocol?.factoryContracts[
      app?.chain?.meta?.ChainNode?.eth_chain_id || 0
    ];

  if (!contractInfo) {
    return <PageNotFound />;
  }

  if (isLoading) {
    return <CWCircleMultiplySpinner />;
  }

  return (
    <CWPageLayout>
      <section className="TokenIntegration">
        <CWText type="h2">
          {isExternalTokenLinked ? 'Manage Connected token' : 'Connect token'}
        </CWText>
        <Status
          communityName={app.chain.meta.name || ''}
          tokenName={tokenMetadata?.name || ''}
          isEnabled={isExternalTokenLinked}
        />
        <CWDivider />
        {isExternalTokenLinked ? (
          <ManageConnectedToken
            tokenInfo={tokenMetadata}
            isLoadingToken={isLoadingTokenMetadata}
          />
        ) : (
          <ConnectTokenForm />
        )}
      </section>
    </CWPageLayout>
  );
};

export default TokenIntegration;
