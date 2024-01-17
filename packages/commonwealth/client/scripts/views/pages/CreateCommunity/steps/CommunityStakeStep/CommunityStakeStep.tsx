import React, { useState } from 'react';

import EnableStake from './EnableStake';
import SignStakeTransactions from './SignStakeTransactions';

import './CommunityStakeStep.scss';

interface CommunityStakeStepProps {
  onOptOutEnablingStake: () => void;
  createdCommunityName: string;
}

const CommunityStakeStep = ({
  onOptOutEnablingStake,
  createdCommunityName,
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
          onOptOutEnablingStake={onOptOutEnablingStake}
          onOptInEnablingStake={handleOptInEnablingStake}
          communityStakeData={communityStakeData}
        />
      ) : (
        <SignStakeTransactions onOptOutEnablingStake={onOptOutEnablingStake} />
      )}
    </div>
  );
};

export default CommunityStakeStep;
