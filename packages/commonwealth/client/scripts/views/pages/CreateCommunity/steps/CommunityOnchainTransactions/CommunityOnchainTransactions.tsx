import AddressInfo from 'models/AddressInfo';
import React, { useState } from 'react';
import { openConfirmation } from 'views/modals/confirmation_modal';
import ConfirmNamespaceData from './ConfirmNamespaceData';
import SignCommunityTransactions from './SignCommunityTransactions';
import {
  TransactionType,
  createTransaction,
  getTransactionText,
} from './helpers/transactionUtils';
import useConfigureVerificationTransaction from './helpers/useConfigureVerificationTransaction';
import useNamespaceTransaction from './helpers/useNamespaceTransaction';
import useNominationsTransaction from './helpers/useNominationsTransaction';
import useStakeTransaction from './helpers/useStakeTransaction';
import useVerificationTokenTransaction from './helpers/useVerificationTokenTransaction';
import { NamespaceData, TransactionConfig } from './types';

interface CommunityOnchainTransactionsProps {
  createdCommunityName?: string;
  createdCommunityId: string;
  selectedAddress: AddressInfo;
  chainId: string;
  isTopicFlow?: boolean;
  transactionTypes: TransactionType[];
  namespace?: string | null;
  symbol?: string;
  onConfirmNamespaceData?: (data: NamespaceData) => void;
  onConfirmNamespaceDataStepCancel?: () => void;
  onSignTransactionDeployNamespace?: () => void;
  onSignTransactionConfigureStake?: () => void;
  onSignTransactionConfigureNominations?: () => void;
  onSignTransactionMintVerificationToken?: () => void;
  onSignTransactionConfigureVerification?: () => void;
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
  onConfirmNamespaceData,
  onConfirmNamespaceDataStepCancel,
  onSignTransactionDeployNamespace,
  onSignTransactionConfigureStake,
  onSignTransactionConfigureNominations,
  onSignTransactionMintVerificationToken,
  onSignTransactionConfigureVerification,
  onSignTransactionsStepCancel,
}: CommunityOnchainTransactionsProps) => {
  const hasNamespaceReserved = !!namespace;

  const [confirmNamespaceDataPage, setConfirmNamespaceDataPage] = useState(
    hasNamespaceReserved ? false : true,
  );
  const [communityNamespaceData, setCommunityNamespaceData] = useState({
    namespace: namespace || createdCommunityName || '',
    symbol: symbol || (createdCommunityName || '').toUpperCase().slice(0, 4),
  });

  const namespaceTransaction = useNamespaceTransaction({
    communityId: createdCommunityId,
    namespace: communityNamespaceData.namespace,
    symbol: communityNamespaceData.symbol,
    userAddress: selectedAddress?.address,
    chainId,
    onSuccess: onSignTransactionDeployNamespace,
    hasNamespaceReserved,
  });

  const stakeTransaction = useStakeTransaction({
    namespace: communityNamespaceData.namespace,
    communityId: createdCommunityId,
    userAddress: selectedAddress?.address,
    chainId,
    onSuccess: onSignTransactionConfigureStake,
  });

  const nominationsTransaction = useNominationsTransaction({
    namespace: communityNamespaceData.namespace,
    userAddress: selectedAddress?.address,
    chainId,
    onSuccess: onSignTransactionConfigureNominations,
  });

  const verificationTokenTransaction = useVerificationTokenTransaction({
    namespace: communityNamespaceData.namespace,
    userAddress: selectedAddress?.address,
    chainId,
    onSuccess: onSignTransactionMintVerificationToken,
  });

  const verificationTransaction = useConfigureVerificationTransaction({
    namespace: communityNamespaceData.namespace,
    userAddress: selectedAddress?.address,
    chainId,
    onSuccess: onSignTransactionConfigureVerification,
  });

  const handleConfirmNamespaceDataStepSuccess = (data: NamespaceData) => {
    setCommunityNamespaceData(data);
    setConfirmNamespaceDataPage(false);
    onConfirmNamespaceData?.(data);
  };

  const handleConfirmNamespaceDataStepCancel = () => {
    onConfirmNamespaceDataStepCancel?.();
  };

  const handleSignTransactionsStepCancel = () => {
    openConfirmation({
      title: 'Are you sure you want to cancel?',
      description: 'Onchain transactions are not completed yet.',
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
      [TransactionType.ConfigureNominations]: nominationsTransaction,
      [TransactionType.MintVerificationToken]: verificationTokenTransaction,
      [TransactionType.ConfigureVerification]: verificationTransaction,
    };

    let previousTransactionCompleted = true;

    return transactionTypes.map((type, index) => {
      const transaction = transactionHooks[type];

      const canBeEnabled = index === 0 ? true : previousTransactionCompleted;

      if (index < transactionTypes.length - 1) {
        previousTransactionCompleted = transaction.state === 'completed';
      }

      return createTransaction(type, transaction, true, canBeEnabled);
    });
  };

  const { title, description } = getTransactionText(transactionTypes);

  return (
    <div className="CommunityOnchainTransactions">
      {confirmNamespaceDataPage ? (
        <ConfirmNamespaceData
          communityNamespaceData={communityNamespaceData}
          chainId={chainId}
          confirmButton={{
            label: 'Confirm',
            action: handleConfirmNamespaceDataStepSuccess,
          }}
          backButton={{
            label: isTopicFlow ? 'Back' : 'Cancel',
            action: handleConfirmNamespaceDataStepCancel,
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
