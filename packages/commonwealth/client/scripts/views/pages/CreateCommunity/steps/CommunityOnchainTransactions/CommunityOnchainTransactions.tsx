import AddressInfo from 'models/AddressInfo';
import React, { useState } from 'react';
import { openConfirmation } from 'views/modals/confirmation_modal';
import EnableStake from './EnableStake';
import SignCommunityTransactions from './SignCommunityTransactions';
import {
  TransactionType,
  createTransaction,
  getTransactionText,
} from './helpers/transactionUtils';
import useNamespaceTransaction from './helpers/useNamespaceTransaction';
import useStakeTransaction from './helpers/useStakeTransaction';
import { StakeData, TransactionConfig } from './types';

import './CommunityOnchainTransactions.scss';

interface CommunityOnchainTransactionsProps {
  createdCommunityName?: string;
  createdCommunityId: string;
  selectedAddress: AddressInfo;
  chainId: string;
  isTopicFlow?: boolean;

  // New property - array of transaction types to include
  transactionTypes?: TransactionType[];

  // Legacy properties for backward compatibility
  onlyNamespace?: boolean;
  namespace?: string | null;
  symbol?: string;
  onEnableStakeStepSucess?: (data: StakeData) => void;
  onEnableStakeStepCancel?: () => void;
  onSignTransactionsStepReserveNamespaceSuccess?: () => void;
  onSignTransactionsStepLaunchStakeSuccess?: () => void;
  onSignTransactionsStepCancel?: () => void;
}

const CommunityOnchainTransactions = ({
  createdCommunityName,
  createdCommunityId,
  selectedAddress,
  chainId,
  isTopicFlow,
  transactionTypes, // New property
  onlyNamespace,
  namespace,
  symbol,
  onEnableStakeStepSucess,
  onEnableStakeStepCancel,
  onSignTransactionsStepReserveNamespaceSuccess,
  onSignTransactionsStepLaunchStakeSuccess,
  onSignTransactionsStepCancel,
}: CommunityOnchainTransactionsProps) => {
  const hasNamespaceReserved = !!namespace;
  const [enableStakePage, setEnableStakePage] = useState(
    hasNamespaceReserved ? false : true,
  );
  const [communityStakeData, setCommunityStakeData] = useState({
    namespace: namespace || createdCommunityName || '',
    symbol: symbol || (createdCommunityName || '').toUpperCase().slice(0, 4),
  });

  // Determine which transaction types to use
  // If transactionTypes is provided, use it; otherwise, use the legacy onlyNamespace flag
  const transactionsToInclude =
    transactionTypes ||
    (onlyNamespace
      ? [TransactionType.DeployNamespace]
      : [TransactionType.DeployNamespace, TransactionType.ConfigureStakes]);

  const namespaceTransaction = useNamespaceTransaction({
    communityId: createdCommunityId,
    namespace: communityStakeData.namespace,
    symbol: communityStakeData.symbol,
    userAddress: selectedAddress.address,
    chainId,
    onSuccess: onSignTransactionsStepReserveNamespaceSuccess,
    hasNamespaceReserved,
  });

  const stakeTransaction = useStakeTransaction({
    namespace: communityStakeData.namespace,
    communityId: createdCommunityId,
    userAddress: selectedAddress.address,
    chainId,
    onSuccess: onSignTransactionsStepLaunchStakeSuccess,
  });

  // Create a hooks map for easy access by transaction type

  const handleEnableStakeStepSuccess = (data: StakeData) => {
    setCommunityStakeData(data);
    setEnableStakePage(false);
    onEnableStakeStepSucess?.(data);
  };

  const handleEnableStakeStepCancel = () => {
    onEnableStakeStepCancel?.();
  };

  const handleSignTransactionsStepCancel = () => {
    openConfirmation({
      title: 'Are you sure you want to cancel?',
      description:
        transactionsToInclude.length === 1 &&
        transactionsToInclude[0] === TransactionType.DeployNamespace
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

  const getTransactions = (): TransactionConfig[] => {
    const transactionHooks = {
      [TransactionType.DeployNamespace]: namespaceTransaction,
      [TransactionType.ConfigureStakes]: stakeTransaction,
      // Add more hooks here as needed
    };

    return transactionsToInclude.map((type) => {
      const transaction = transactionHooks[type];

      const showActionButton =
        type === TransactionType.ConfigureStakes
          ? transactionHooks[TransactionType.DeployNamespace].state ===
            'completed'
          : true;

      return createTransaction(type, transaction, showActionButton);
    });
  };

  const { title, description } = getTransactionText(transactionsToInclude);

  return (
    <div className="CommunityOnchainTransactions">
      {enableStakePage ? (
        <EnableStake
          communityStakeData={communityStakeData}
          chainId={chainId}
          onlyNamespace={
            transactionsToInclude.length === 1 &&
            transactionsToInclude[0] === TransactionType.DeployNamespace
          }
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
        <SignCommunityTransactions
          title={title}
          description={description}
          transactions={getTransactions()}
          backButton={{
            label: isTopicFlow ? 'Back' : 'Cancel',
            action: handleSignTransactionsStepCancel,
          }}
        />
      )}
    </div>
  );
};

export default CommunityOnchainTransactions;
