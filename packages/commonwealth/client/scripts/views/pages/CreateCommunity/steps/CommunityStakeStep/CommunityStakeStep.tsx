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
  onlyNamespace?: boolean;
  namespace?: string | null;
  symbol?: string;
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
  onlyNamespace,
  namespace,
  symbol,
}: CommunityStakeStepProps) => {
  const hasNamespaceReserved = !!namespace;
  const [enableStakePage, setEnableStakePage] = useState(
    hasNamespaceReserved ? false : true,
  );
  const [communityStakeData, setCommunityStakeData] = useState({
    namespace: namespace || createdCommunityName || '',
    symbol: symbol || (createdCommunityName || '').toUpperCase().slice(0, 4),
  });

  const handleOptInEnablingStake = (stakeData: {
    namespace: string;
    symbol: string;
  }) => {
    setCommunityStakeData(stakeData);
    setEnableStakePage(false);
  };

  const enableStakeHandler = () => {
    isTopicFlow && onTopicFlowStepChange
      ? onTopicFlowStepChange(CreateTopicStep.WVMethodSelection)
      : goToSuccessStep();
  };

  const onSuccessSignTransactions = () => {
    if (isTopicFlow) {
      if (onlyNamespace) {
        return goToSuccessStep();
      } else {
        return refetchStakeQuery?.();
      }
    }

    goToSuccessStep();
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
          onlyNamespace={onlyNamespace}
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
          onlyNamespace={onlyNamespace}
          hasNamespaceReserved={hasNamespaceReserved}
        />
      )}
    </div>
  );
};

export default CommunityStakeStep;
