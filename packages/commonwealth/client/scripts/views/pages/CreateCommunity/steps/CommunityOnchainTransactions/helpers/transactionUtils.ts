import { TransactionConfig, TransactionHookResult } from '../types';

/**
 * Enum of available transaction types
 */
export enum TransactionType {
  DeployNamespace = 'deployNamespace',
  ConfigureStakes = 'configureStakes',
  // Add more transaction types as needed
}

/**
 * Transaction definition including metadata
 */
export interface TransactionDefinition {
  id: string;
  label: string;
}

/**
 * Transaction definitions registry
 */
export const TRANSACTION_DEFINITIONS: Record<
  TransactionType,
  TransactionDefinition
> = {
  [TransactionType.DeployNamespace]: {
    id: 'namespace',
    label: 'Reserve community namespace',
  },
  [TransactionType.ConfigureStakes]: {
    id: 'stake',
    label: 'Launch community stake',
  },
  // Add more transaction definitions as needed
};

/**
 * Create transaction configuration from a hook result
 */
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

/**
 * Get transaction title and description based on transaction types
 */
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
      description:
        'In order to launch community stake you will need to sign two transactions. The first launches your community namespace on the blockchain, and the second launches your community stake. Both transactions have associated gas fees.',
    };
  } else {
    // Default case or other combinations
    return {
      title: 'Sign transactions',
      description:
        'You need to sign the following transactions to complete this process.',
    };
  }
};

/**
 * Legacy function for backwards compatibility
 */
export const getNamespaceTransactionText = (onlyNamespace: boolean) => {
  return getTransactionText(
    onlyNamespace
      ? [TransactionType.DeployNamespace]
      : [TransactionType.DeployNamespace, TransactionType.ConfigureStakes],
  );
};
