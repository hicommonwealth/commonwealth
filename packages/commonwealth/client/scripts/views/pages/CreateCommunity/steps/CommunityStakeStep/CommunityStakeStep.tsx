import React, { useState } from 'react';

import AddressInfo from 'models/AddressInfo';
import { openConfirmation } from 'views/modals/confirmation_modal';
import EnableStake from './EnableStake';
import SignStakeTransactions from './SignStakeTransactions';

interface CommunityStakeStepProps {
  createdCommunityName?: string;
  createdCommunityId: string;
  selectedAddress: AddressInfo;
  chainId: string;
  isTopicFlow?: boolean;

  onlyNamespace?: boolean;
  namespace?: string | null;
  symbol?: string;
  onEnableStakeStepSucess?: () => void;
  onEnableStakeStepCancel?: () => void;
  onSignTransactionsStepReserveNamespaceSuccess?: () => void;
  onSignTransactionsStepLaunchStakeSuccess?: () => void;
  onSignTransactionsStepCancel?: () => void;
}

const CommunityStakeStep = ({
  createdCommunityName,
  createdCommunityId,
  selectedAddress,
  chainId,
  isTopicFlow,
  onlyNamespace,
  namespace,
  symbol,
  onEnableStakeStepSucess,
  onEnableStakeStepCancel,
  onSignTransactionsStepReserveNamespaceSuccess,
  onSignTransactionsStepLaunchStakeSuccess,
  onSignTransactionsStepCancel,
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

  const handleEnableStakeStepSuccess = (data: {
    namespace: string;
    symbol: string;
  }) => {
    handleOptInEnablingStake(data);
    onEnableStakeStepSucess?.();
  };

  const handleEnableStakeStepCancel = () => {
    onEnableStakeStepCancel?.();
  };

  const handleSignTransactionsStepReserveNamespaceSuccess = () => {
    onSignTransactionsStepReserveNamespaceSuccess?.();
  };

  const handleSignTransactionsStepLaunchStakeSuccess = () => {
    onSignTransactionsStepLaunchStakeSuccess?.();
  };

  const handleSignTransactionsStepCancel = () => {
    openConfirmation({
      title: 'Are you sure you want to cancel?',
      description: onlyNamespace
        ? 'Namespace has not been enabled for your community yet'
        : 'Community Stake has not been enabled for your community yet',
      buttons: [
        {
          label: 'Cancel',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: onSignTransactionsStepCancel,
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
          confirmButton={{
            label: 'Yes',
            action: handleEnableStakeStepSuccess,
          }}
          backButton={{
            label: isTopicFlow ? 'Back' : 'No',
            action: handleEnableStakeStepCancel,
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
          onReserveNamespaceSuccess={
            handleSignTransactionsStepReserveNamespaceSuccess
          }
          onLaunchStakeSuccess={handleSignTransactionsStepLaunchStakeSuccess}
          backButton={{
            label: isTopicFlow ? 'Back' : 'Cancel',
            action: handleSignTransactionsStepCancel,
          }}
        />
      )}
    </div>
  );
};

export default CommunityStakeStep;
