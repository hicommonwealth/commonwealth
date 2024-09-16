import React, { useState } from 'react';

import AddressInfo from 'models/AddressInfo';
import { CreateTopicStep } from 'views/pages/CommunityManagement/Topics/utils';
import EnableStake from './EnableStake';
import SignStakeTransactions from './SignStakeTransactions';

interface CommunityStakeStepProps {
  goToSuccessStep: () => void;
  createdCommunityName?: string;
  createdCommunityId: string;
  selectedAddress: AddressInfo;
  chainId: string;
  isTopicFlow?: boolean;
  onTopicFlowStepChange?: (step: CreateTopicStep) => void;
  refetchStakeQuery?: () => void;
}

const CommunityStakeStep = ({
  goToSuccessStep,
  createdCommunityName,
  createdCommunityId,
  selectedAddress,
  chainId,
  isTopicFlow,
  onTopicFlowStepChange,
  refetchStakeQuery,
}: CommunityStakeStepProps) => {
  const [enableStakePage, setEnableStakePage] = useState(true);
  const [communityStakeData, setCommunityStakeData] = useState({
    namespace: createdCommunityName || '',
    symbol: (createdCommunityName || '').toUpperCase().slice(0, 4),
  });

  const handleOptInEnablingStake = ({ namespace, symbol }) => {
    setCommunityStakeData({ namespace, symbol });
    setEnableStakePage(false);
  };

  const enableStakeHandler = () => {
    isTopicFlow && onTopicFlowStepChange
      ? onTopicFlowStepChange(CreateTopicStep.WVMethodSelection)
      : goToSuccessStep();
  };

  const onSuccessSignTransactions = () => {
    isTopicFlow ? refetchStakeQuery?.() : goToSuccessStep();
  };

  const onCancelSignTransactions = () => {
    isTopicFlow ? setEnableStakePage(true) : goToSuccessStep();
  };

  return (
    <div className="CommunityStakeStep">
      {enableStakePage ? (
        <EnableStake
          goToSuccessStep={enableStakeHandler}
          onOptInEnablingStake={handleOptInEnablingStake}
          communityStakeData={communityStakeData}
          chainId={chainId}
          isTopicFlow={isTopicFlow}
        />
      ) : (
        <SignStakeTransactions
          onSuccess={onSuccessSignTransactions}
          onCancel={onCancelSignTransactions}
          communityStakeData={communityStakeData}
          selectedAddress={selectedAddress}
          createdCommunityId={createdCommunityId}
          chainId={chainId}
          isTopicFlow={isTopicFlow}
        />
      )}
    </div>
  );
};

export default CommunityStakeStep;
