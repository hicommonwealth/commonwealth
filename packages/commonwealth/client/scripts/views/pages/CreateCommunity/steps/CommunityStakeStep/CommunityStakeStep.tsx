import React, { useState } from 'react';

import AddressInfo from 'models/AddressInfo';
import EnableStake from './EnableStake';
import SignStakeTransactions from './SignStakeTransactions';

interface CommunityStakeStepProps {
  goToSuccessStep: () => void;
  createdCommunityName: string;
  createdCommunityId: string;
  selectedAddress: AddressInfo;
}

const CommunityStakeStep = ({
  goToSuccessStep,
  createdCommunityName,
  createdCommunityId,
  selectedAddress,
}: CommunityStakeStepProps) => {
  const [enableStakePage, setEnableStakePage] = useState(true);
  const [communityStakeData, setCommunityStakeData] = useState({
    namespace: createdCommunityName,
    symbol: createdCommunityName.toUpperCase().slice(0, 4),
  });

  const handleOptInEnablingStake = ({ namespace, symbol }) => {
    setCommunityStakeData({ namespace, symbol });
    setEnableStakePage(false);
  };

  return (
    <div className="CommunityStakeStep">
      {enableStakePage ? (
        <EnableStake
          goToSuccessStep={goToSuccessStep}
          onOptInEnablingStake={handleOptInEnablingStake}
          communityStakeData={communityStakeData}
        />
      ) : (
        <SignStakeTransactions
          goToSuccessStep={goToSuccessStep}
          communityStakeData={communityStakeData}
          selectedAddress={selectedAddress}
          createdCommunityId={createdCommunityId}
        />
      )}
    </div>
  );
};

export default CommunityStakeStep;
