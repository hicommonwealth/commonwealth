import { ActionStepProps } from 'views/pages/CreateCommunity/components/ActionSteps/types';

// Transaction state types
export type TransactionState = ActionStepProps['state'];

// Base transaction data structure
export interface TransactionData {
  state: TransactionState;
  errorText: string;
}

// Default state for transactions
export const defaultTransactionState: TransactionData = {
  state: 'not-started',
  errorText: '',
};

// Base transaction configuration
export interface TransactionConfig {
  id: string;
  label: string;
  state: TransactionState;
  errorText?: string;
  action: () => void;
  shouldShowActionButton: boolean;
  dependsOn?: string[]; // IDs of transactions this one depends on
}

// Standard transaction hook result
export interface TransactionHookResult {
  state: TransactionState;
  errorText: string;
  action: () => Promise<void>;
}

// SignCommunityTransactions props
export interface SignCommunityTransactionsProps {
  title: string;
  description: string;
  transactions: TransactionConfig[];
  isPreventLeaveEnabled?: boolean;
  backButton?: {
    label: string;
    action: () => void;
  };
}

// Community data structure
export type CommunityData = {
  symbol: string;
  namespace: string;
};
