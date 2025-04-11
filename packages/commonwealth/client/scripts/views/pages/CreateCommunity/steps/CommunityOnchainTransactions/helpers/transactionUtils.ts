import { pluralize } from 'helpers';
import { TransactionConfig, TransactionHookResult } from '../types';

export enum TransactionType {
  DeployNamespace = 'deployNamespace',
  ConfigureStakes = 'configureStakes',
  ConfigureNominations = 'configureNominations',
  MintVerificationToken = 'mintVerificationToken',
  ConfigureVerification = 'configureVerification',
}

export interface TransactionDefinition {
  id: string;
  label: string;
  description?: string;
}

export const TRANSACTION_DEFINITIONS: Record<
  TransactionType,
  TransactionDefinition
> = {
  [TransactionType.DeployNamespace]: {
    id: 'namespace',
    label: 'Reserve community namespace',
    description: 'Reserve your unique community identifier on the blockchain.',
  },
  [TransactionType.ConfigureStakes]: {
    id: 'stake',
    label: 'Launch community stake',
    description: 'This transaction launches a community stake.',
  },
  [TransactionType.ConfigureNominations]: {
    id: 'nominations',
    label: 'Configure nominations',
    description: 'This transaction configures nominations for your community.',
  },
  [TransactionType.MintVerificationToken]: {
    id: 'verificationToken',
    label: 'Mint verification token',
    description: 'Create verification credentials for your community.',
  },
  [TransactionType.ConfigureVerification]: {
    id: 'verification',
    label: 'Configure verification',
    description: 'This transaction configures verification for your community.',
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
    description: definition.description,
    state: transaction?.state,
    errorText: transaction?.errorText,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
    title: `Sign ${pluralize(count, 'transaction')}`,
    description:
      count > 1
        ? `You need to sign ${pluralize(count, 'transaction')}. Please complete them in sequence.`
        : 'Please sign this transaction to proceed.',
  };
};
