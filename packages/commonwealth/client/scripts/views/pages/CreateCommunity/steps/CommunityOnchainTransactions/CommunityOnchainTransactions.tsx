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

interface CommunityOnchainTransactionsProps {
  createdCommunityName?: string;
  createdCommunityId: string;
  selectedAddress: AddressInfo;
  chainId: string;
  isTopicFlow?: boolean;
  transactionTypes: TransactionType[];
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
  transactionTypes,
  namespace,
  symbol,
  onEnableStakeStepSucess,
  onEnableStakeStepCancel,
  onSignTransactionsStepReserveNamespaceSuccess,
  onSignTransactionsStepLaunchStakeSuccess,
  onSignTransactionsStepCancel,
}: CommunityOnchainTransactionsProps) => {
  const hasNamespaceReserved = !!namespace;
  const onlyNamespace =
    transactionTypes.length === 1 &&
    transactionTypes[0] === TransactionType.DeployNamespace;

  const [enableStakePage, setEnableStakePage] = useState(
    hasNamespaceReserved ? false : true,
  );
  const [communityStakeData, setCommunityStakeData] = useState({
    namespace: namespace || createdCommunityName || '',
    symbol: symbol || (createdCommunityName || '').toUpperCase().slice(0, 4),
  });

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

  const getTransactions = (): TransactionConfig[] => {
    const transactionHooks = {
      [TransactionType.DeployNamespace]: namespaceTransaction,
      [TransactionType.ConfigureStakes]: stakeTransaction,
    };

    return transactionTypes.map((type) => {
      const transaction = transactionHooks[type];

      const showActionButton =
        type === TransactionType.ConfigureStakes
          ? transactionHooks[TransactionType.DeployNamespace].state ===
            'completed'
          : true;

      return createTransaction(type, transaction, showActionButton);
    });
  };

  const { title, description } = getTransactionText(transactionTypes);

  return (
    <div className="CommunityOnchainTransactions">
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

export default CommunityOnchainTransactions;
