import AddressInfo from 'models/AddressInfo';
import { ActionStepProps } from 'views/pages/CreateCommunity/components/ActionSteps/types';

export type ActionState = {
  state: ActionStepProps['state'];
  errorText: string;
};

export type StakeData = {
  symbol: string;
  namespace: string;
};

export interface SignStakeTransactionsProps {
  onSuccess: () => void;
  onCancel: () => void;
  communityStakeData: StakeData;
  selectedAddress: AddressInfo;
  createdCommunityId: string;
  chainId: string;
  isTopicFlow?: boolean;
  onlyNamespace?: boolean;
  hasNamespaceReserved?: boolean;
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
