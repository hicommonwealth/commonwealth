import { ChainBase } from '@hicommonwealth/shared';
import React, { useState } from 'react';
import app from 'state';
import useGetCommunityByIdQuery from 'state/api/communities/getCommuityById';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import QuickTokenLaunchForm from 'views/pages/LaunchToken/QuickTokenLaunchForm';
import './LaunchToken.scss';

const LaunchToken = () => {
  const isEthereum = app.chain.meta.base === ChainBase.Ethereum;

  const [isLaunchTokenModalOpen, setLaunchTokenModalOpen] = useState(false);

  const communityId = app.activeChainId();
  const { data: community } = useGetCommunityByIdQuery({
    id: communityId || '',
    enabled: !!communityId,
  });
  const communityDescription = community?.description || '';

  if (!isEthereum) {
    return null;
  }

  return (
    <div className="LaunchToken">
      <div className="header">
        <h4>Launch Token</h4>
        <p>Create and launch a token for your community</p>
      </div>

      <CWButton
        label="Launch Token"
        iconLeft="rocketLaunch"
        buttonType="primary"
        onClick={() => setLaunchTokenModalOpen(true)}
      />

      {/* Modal with QuickTokenLaunchForm */}
      <CWModal
        open={isLaunchTokenModalOpen}
        onClose={() => setLaunchTokenModalOpen(false)}
        content={
          <QuickTokenLaunchForm
            onCancel={() => setLaunchTokenModalOpen(false)}
            onCommunityCreated={() => setLaunchTokenModalOpen(false)}
            initialIdeaPrompt={communityDescription}
          />
        }
        size="large"
      />
    </div>
  );
};

export default LaunchToken;
