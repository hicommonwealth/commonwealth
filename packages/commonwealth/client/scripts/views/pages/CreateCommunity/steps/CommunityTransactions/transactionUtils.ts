import { TransactionConfig, TransactionHookResult } from './types';

/**
 * Creates a namespace transaction configuration
 */
export const createNamespaceTransaction = (
  namespaceTransaction: TransactionHookResult,
): TransactionConfig => {
  return {
    id: 'namespace',
    label: 'Reserve community namespace',
    state: namespaceTransaction.state,
    errorText: namespaceTransaction.errorText,
    action: namespaceTransaction.action,
    shouldShowActionButton: true,
  };
};

/**
 * Creates a stake transaction configuration
 */
export const createStakeTransaction = (
  stakeTransaction: TransactionHookResult,
  namespaceCompleted: boolean,
): TransactionConfig => {
  return {
    id: 'stake',
    label: 'Launch community stake',
    state: stakeTransaction.state,
    errorText: stakeTransaction.errorText,
    action: stakeTransaction.action,
    shouldShowActionButton: namespaceCompleted,
    dependsOn: ['namespace'],
  };
};

/**
 * Creates a custom transaction configuration
 */
export const createCustomTransaction = (
  id: string,
  label: string,
  transaction: TransactionHookResult,
  shouldShowActionButton: boolean,
  dependsOn?: string[],
): TransactionConfig => {
  return {
    id,
    label,
    state: transaction.state,
    errorText: transaction.errorText,
    action: transaction.action,
    shouldShowActionButton,
    dependsOn,
  };
};

/**
 * Returns namespace transaction title and description
 */
export const getNamespaceTransactionText = (onlyNamespace: boolean) => {
  return {
    title: onlyNamespace
      ? 'Sign transactions to reserve namespace'
      : 'Sign transactions to launch stake?',
    description: onlyNamespace
      ? 'In order to reserve namespace you will need to sign one transaction.'
      : 'In order to launch community stake you will need to sign two transactions. The first launches your community namespace on the blockchain, and the second launches your community stake. Both transactions have associated gas fees.',
  };
};
