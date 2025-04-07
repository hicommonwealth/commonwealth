import AddressInfo from 'models/AddressInfo';
import React, { useState } from 'react';
import { openConfirmation } from 'views/modals/confirmation_modal';
import EnableStake from '../CommunityStakeStep/EnableStake';
import { StakeData } from '../CommunityStakeStep/types';
import { SignCommunityTransactions } from './index';
import {
  createNamespaceTransaction,
  createStakeTransaction,
  getNamespaceTransactionText,
} from './transactionUtils';
import useNamespaceTransaction from './useNamespaceTransaction';
import useStakeTransaction from './useStakeTransaction';

import './CommunityTransactions.scss';

/**
 * Props for the CommunityTransactions component
 * Maintains the same interface as CommunityStakeStep for backward compatibility
 */
interface CommunityTransactionsProps {
  createdCommunityName?: string;
  createdCommunityId: string;
  selectedAddress: AddressInfo;
  chainId: string;
  isTopicFlow?: boolean;

  onlyNamespace?: boolean;
  namespace?: string | null;
  symbol?: string;
  onEnableStakeStepSucess?: (data: StakeData) => void;
  onEnableStakeStepCancel?: () => void;
  onSignTransactionsStepReserveNamespaceSuccess?: () => void;
  onSignTransactionsStepLaunchStakeSuccess?: () => void;
  onSignTransactionsStepCancel?: () => void;
}

/**
 * Modern replacement for CommunityStakeStep that uses the new transaction architecture
 * Maintains the same interface for backward compatibility
 */
const CommunityTransactions = ({
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
}: CommunityTransactionsProps) => {
  const hasNamespaceReserved = !!namespace;
  const [enableStakePage, setEnableStakePage] = useState(
    hasNamespaceReserved ? false : true,
  );
  const [communityStakeData, setCommunityStakeData] = useState({
    namespace: namespace || createdCommunityName || '',
    symbol: symbol || (createdCommunityName || '').toUpperCase().slice(0, 4),
  });

  // Hook for namespace transaction
  const namespaceTransaction = useNamespaceTransaction({
    communityId: createdCommunityId,
    namespace: communityStakeData.namespace,
    symbol: communityStakeData.symbol,
    userAddress: selectedAddress.address,
    chainId,
    onSuccess: onSignTransactionsStepReserveNamespaceSuccess,
    hasNamespaceReserved,
  });

  // Hook for stake transaction
  const stakeTransaction = useStakeTransaction({
    namespace: communityStakeData.namespace,
    communityId: createdCommunityId,
    userAddress: selectedAddress.address,
    chainId,
    onSuccess: onSignTransactionsStepLaunchStakeSuccess,
  });

  // Enable Stake step handlers
  const handleEnableStakeStepSuccess = (data: StakeData) => {
    setCommunityStakeData(data);
    setEnableStakePage(false);
    onEnableStakeStepSucess?.(data);
  };

  const handleEnableStakeStepCancel = () => {
    onEnableStakeStepCancel?.();
  };

  // Sign Transactions step handlers
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

  // Configure transactions array based on needs
  const getTransactions = () => {
    const transactions = [createNamespaceTransaction(namespaceTransaction)];

    if (!onlyNamespace) {
      transactions.push(
        createStakeTransaction(
          stakeTransaction,
          namespaceTransaction.state === 'completed',
        ),
      );
    }

    return transactions;
  };

  // Get text for transactions component
  const { title, description } = getNamespaceTransactionText(!!onlyNamespace);

  return (
    <div className="CommunityTransactions">
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

export default CommunityTransactions;
