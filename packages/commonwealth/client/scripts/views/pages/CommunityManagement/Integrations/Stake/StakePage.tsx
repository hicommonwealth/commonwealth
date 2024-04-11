import { default as React, default as React, useState } from 'react';
import app from 'state';
import useCommunityState from 'views/components/CommunityStake/useCommunityStake';
import { CWText } from 'views/components/component_kit/cw_text';
import CWBanner from 'views/components/component_kit/new_designs/CWBanner';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import CommunityStakeStep from 'views/pages/CreateCommunity/steps/CommunityStakeStep';
import './Stake.scss';
import StakeEnabled from './StakeEnabled';

const StakePage = () => {
  const { stakeEnabled, ethChainId, stakeData } = useCommunityState();

  const [community] = useState(app.config.chains.getById(app.activeChainId()));
  const [isEnabled, setIsEnabled] = useState(community.directoryPageEnabled);

  const createdCommunityName = app.config.chains.getById(
    app.activeChainId(),
  ).name;
  const createdCommunityid = app.config.chains.getById(app.activeChainId()).id;

  const onChangeStep = (isSuccess: boolean) => {
    if (isSuccess) {
      setIsEnabled(true);
    }
  };

  const selectedAddress = {
    address: app?.user?.activeAccount?.address,
  };

  console.log(stakeData);

  return (
    <CWPageLayout>
      <div className="StakePage">
        <div className="header">
          <CWText type="h4">Stake</CWText>
        </div>
        <div
          style={{
            width: '100%',
          }}
        >
          <CWBanner
            title="Stake not enabled"
            body={`You currently do not have stake in ${createdCommunityName}`}
            headerClassName="banner-center"
            bodyClassName="banner-center"
            className="banner"
            hideCloseIcon
            onClose={() => {}}
          />
          <div className="border" />
        </div>
        {isEnabled ? (
          <StakeEnabled />
        ) : (
          <CommunityStakeStep
            goToSuccessStep={() => onChangeStep(true)}
            createdCommunityName={createdCommunityName}
            createdCommunityId={createdCommunityid}
            selectedAddress={selectedAddress}
            chainId={ethChainId.toString()}
          />
        )}
      </div>
    </CWPageLayout>
  );
};

export default StakePage;
