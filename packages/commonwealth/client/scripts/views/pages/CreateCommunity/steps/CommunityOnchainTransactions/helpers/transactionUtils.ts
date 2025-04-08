import { TransactionConfig, TransactionHookResult } from '../types';

export enum TransactionType {
  DeployNamespace = 'deployNamespace',
  ConfigureStakes = 'configureStakes',
  // Add more transaction types as needed
}

interface TransactionDefinition {
  id: string;
  label: string;
}

const TRANSACTION_DEFINITIONS: Record<TransactionType, TransactionDefinition> =
  {
    [TransactionType.DeployNamespace]: {
      id: 'namespace',
      label: 'Reserve community namespace',
    },
    [TransactionType.ConfigureStakes]: {
      id: 'stake',
      label: 'Launch community stake',
    },
  };

export const createTransaction = (
  type: TransactionType,
  transaction: TransactionHookResult,
  showActionButton: boolean = true,
): TransactionConfig => {
  const definition = TRANSACTION_DEFINITIONS[type];

  return {
    id: definition.id,
    label: definition.label,
    state: transaction.state,
    errorText: transaction.errorText,
    action: transaction.action,
    shouldShowActionButton: showActionButton,
  };
};

export const getTransactionText = (transactionTypes: TransactionType[]) => {
  const hasNamespace = transactionTypes.includes(
    TransactionType.DeployNamespace,
  );
  const hasStake = transactionTypes.includes(TransactionType.ConfigureStakes);

  if (hasNamespace && !hasStake) {
    return {
      title: 'Sign transaction to reserve namespace',
      description:
        'In order to reserve namespace you will need to sign one transaction.',
    };
  } else if (hasNamespace && hasStake) {
    return {
      title: 'Sign transactions to launch stake',
      description: `In order to launch community stake you will need to sign two transactions. 
      The first launches your community namespace on the blockchain, and the second launches 
      your community stake. Both transactions have associated gas fees.`,
    };
  } else {
    return {
      title: 'Sign transactions',
      description:
        'You need to sign the following transactions to complete this process.',
    };
  }
};
