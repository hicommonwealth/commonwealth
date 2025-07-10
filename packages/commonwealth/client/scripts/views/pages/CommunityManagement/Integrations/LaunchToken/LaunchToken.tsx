import { ChainBase } from '@hicommonwealth/shared';
import React, { useState } from 'react';
import app from 'state';
import useGetCommunityByIdQuery from 'state/api/communities/getCommuityById';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import TokenLaunchDrawer from 'views/pages/ExplorePage/IdeaLaunchpad/TokenLaunchDrawer';
import './LaunchToken.scss';

const LaunchToken = () => {
  const isEthereum = app.chain.meta.base === ChainBase.Ethereum;

  const [isTokenLaunchDrawerOpen, setIsTokenLaunchDrawerOpen] = useState(false);

  const communityId = app.activeChainId();
  const { data: community } = useGetCommunityByIdQuery({
    id: communityId || '',
    enabled: !!communityId,
  });

  const communityDescription = community?.description || '';

  if (!isEthereum) return null;

  return (
    <div className="LaunchToken">
      <div className="header">
        <CWText type="h4">Launch Token</CWText>
        <CWText type="b1">Launch a token for your community</CWText>
      </div>

      <CWButton
        label="Launch Token"
        iconLeft="rocketLaunch"
        buttonType="primary"
        onClick={() => setIsTokenLaunchDrawerOpen(true)}
      />

      <TokenLaunchDrawer
        isOpen={isTokenLaunchDrawerOpen}
        onClose={() => setIsTokenLaunchDrawerOpen(false)}
        initialIdeaPrompt={communityDescription}
      />
    </div>
  );
};

export default LaunchToken;
