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
}

// Standard transaction hook result
export interface TransactionHookResult {
  state: TransactionState;
  errorText: string;
  action: () => Promise<void>;
}

// Community data structure
export type CommunityData = {
  symbol: string;
  namespace: string;
};

export type ActionState = {
  state: ActionStepProps['state'];
  errorText: string;
};

export type StakeData = {
  symbol: string;
  namespace: string;
};

export const defaultActionState: ActionState = {
  state: 'not-started',
  errorText: '',
};
