import AddressInfo from 'models/AddressInfo';
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

export type ActionState = {
  state: ActionStepProps['state'];
  errorText: string;
};

export type StakeData = {
  symbol: string;
  namespace: string;
};

export interface SignStakeTransactionsProps {
  communityStakeData: StakeData;
  selectedAddress: AddressInfo;
  createdCommunityId: string;
  chainId: string;
  onlyNamespace?: boolean;
  hasNamespaceReserved?: boolean;
  onReserveNamespaceSuccess: () => void;
  onLaunchStakeSuccess: () => void;
  backButton?: {
    label: string;
    action: () => void;
  };
}

export interface EnableStakeProps {
  communityStakeData: StakeData;
  chainId: string;
  onlyNamespace?: boolean;
  backButton?: {
    label: string;
    action: () => void;
  };
  confirmButton?: {
    label: string;
    action: (data: StakeData) => void;
  };
}

export const defaultActionState: ActionState = {
  state: 'not-started',
  errorText: '',
};
