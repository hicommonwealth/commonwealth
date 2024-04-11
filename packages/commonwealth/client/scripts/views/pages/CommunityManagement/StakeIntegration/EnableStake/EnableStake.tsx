import { default as React, default as React } from 'react';
import app from 'state';
import CommunityStakeStep from 'views/pages/CreateCommunity/steps/CommunityStakeStep';
import AddressInfo from '../../../../../models/AddressInfo';

const EnableStake = ({ ethChainId, onChangeStep }) => {
  const createdCommunityName = app.config.chains.getById(
    app.activeChainId(),
  ).name;
  const createdCommunityid = app.config.chains.getById(app.activeChainId()).id;

  const selectedAddress = () => {
    return new AddressInfo({
      address: app?.user?.activeAccount?.address,
      id: null,
      communityId: createdCommunityid,
    });
  };

  return (
    <CommunityStakeStep
      goToSuccessStep={onChangeStep}
      createdCommunityName={createdCommunityName}
      createdCommunityId={createdCommunityid}
      selectedAddress={selectedAddress()}
      chainId={ethChainId.toString()}
    />
  );
};

export default EnableStake;
