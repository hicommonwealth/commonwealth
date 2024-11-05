import React, { useState } from 'react';

import AddressInfo from 'models/AddressInfo';
import { openConfirmation } from 'views/modals/confirmation_modal';
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

  const handleLaunchStakeSuccess = () => {
    return onSuccessSignTransactions();
  };

  const handleReserveNamespaceSuccess = () => {
    return onlyNamespace ? onSuccessSignTransactions() : undefined;
  };

  const handleCancelSignStakeTransactions = () => {
    isTopicFlow
      ? onCancelSignTransactions()
      : openConfirmation({
          title: 'Are you sure you want to cancel?',
          description: onlyNamespace
            ? 'Namespace has not been enabled for your community yet'
            : 'Community Stake has not been enabled for your community yet',
          buttons: [
            {
              label: 'Cancel',
              buttonType: 'destructive',
              buttonHeight: 'sm',
              onClick: onCancelSignTransactions,
            },
            {
              label: 'Continue',
              buttonType: 'primary',
              buttonHeight: 'sm',
            },
          ],
        });
  };

  return (
    <div className="CommunityStakeStep">
      {enableStakePage ? (
        <EnableStake
          communityStakeData={communityStakeData}
          chainId={chainId}
          onlyNamespace={onlyNamespace}
          backButton={{
            label: isTopicFlow ? 'Back' : 'No',
            action: enableStakeHandler,
          }}
          confirmButton={{
            label: 'Yes',
            action: handleOptInEnablingStake,
          }}
        />
      ) : (
        <SignStakeTransactions
          communityStakeData={communityStakeData}
          selectedAddress={selectedAddress}
          createdCommunityId={createdCommunityId}
          chainId={chainId}
          onlyNamespace={onlyNamespace}
          hasNamespaceReserved={hasNamespaceReserved}
          onLaunchStakeSuccess={handleLaunchStakeSuccess}
          onReserveNamespaceSuccess={handleReserveNamespaceSuccess}
          backButton={{
            label: isTopicFlow ? 'Back' : 'Cancel',
            action: handleCancelSignStakeTransactions,
          }}
        />
      )}
    </div>
  );
};

export default CommunityStakeStep;
