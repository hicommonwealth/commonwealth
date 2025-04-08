import { TransactionConfig, TransactionHookResult } from '../types';

export enum TransactionType {
  DeployNamespace = 'deployNamespace',
  ConfigureStakes = 'configureStakes',
  ConfigureNominations = 'configureNominations',
  MintVerificationToken = 'mintVerificationToken',
}

export interface TransactionDefinition {
  id: string;
  label: string;
}

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
  [TransactionType.ConfigureNominations]: {
    id: 'nominations',
    label: 'Configure nominations',
  },
  [TransactionType.MintVerificationToken]: {
    id: 'verificationToken',
    label: 'Mint verification token',
  },
};

export const createTransaction = (
  type: TransactionType,
  transaction: TransactionHookResult,
  showActionButton: boolean = true,
  enableActionButton: boolean = true,
): TransactionConfig => {
  const definition = TRANSACTION_DEFINITIONS[type];

  return {
    id: definition.id,
    label: definition.label,
    state: transaction?.state,
    errorText: transaction?.errorText,
    action: transaction?.action,
    shouldShowActionButton: showActionButton,
    isActionButtonDisabled:
      !enableActionButton ||
      transaction?.state === 'loading' ||
      transaction?.state === 'completed',
  };
};

export const getTransactionText = (transactionTypes: TransactionType[]) => {
  const count = transactionTypes.length;

  return {
    title: `Sign ${count > 1 ? 'transactions' : 'transaction'}`,
    description:
      count > 1
        ? `You need to sign ${count} transactions. Please complete them in sequence.`
        : 'Please sign this transaction to proceed.',
  };
};
