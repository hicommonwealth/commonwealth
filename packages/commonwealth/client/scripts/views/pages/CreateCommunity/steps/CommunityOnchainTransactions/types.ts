import { ActionStepProps } from 'views/pages/CreateCommunity/components/ActionSteps/types';

export type NamespaceData = {
  symbol: string;
  namespace: string;
};

export interface TransactionData {
  state: ActionStepProps['state'];
  errorText: string;
}

export const defaultTransactionState: TransactionData = {
  state: 'not-started',
  errorText: '',
};

export interface TransactionConfig {
  id: string;
  label: string;
  description?: string;
  state: TransactionData['state'];
  errorText: TransactionData['errorText'];
  action: () => void;
  shouldShowActionButton: boolean;
  isActionButtonDisabled?: boolean;
}

export interface TransactionHookResult {
  state: TransactionData['state'];
  errorText: TransactionData['errorText'];
  action: () => Promise<void>;
}
