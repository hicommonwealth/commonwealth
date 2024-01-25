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
  goToSuccessStep: () => void;
  communityStakeData: StakeData;
  selectedAddress: AddressInfo;
  createdCommunityId: string;
}

export interface EnableStakeProps {
  goToSuccessStep: () => void;
  onOptInEnablingStake: ({ namespace, symbol }: StakeData) => void;
  communityStakeData: StakeData;
}

export const defaultActionState: ActionState = {
  state: 'not-started',
  errorText: '',
};
