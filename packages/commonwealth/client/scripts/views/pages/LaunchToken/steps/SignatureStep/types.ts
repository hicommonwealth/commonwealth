import NodeInfo from 'client/scripts/models/NodeInfo';
import AddressInfo from 'models/AddressInfo';
import { ActionStepProps } from 'views/pages/CreateCommunity/components/ActionSteps/types';
import { TokenInfo } from '../../types';

export type ActionState = {
  state: ActionStepProps['state'];
  errorText: string;
};

type BaseProps = {
  createdCommunityId: string;
  selectedAddress: AddressInfo;
  tokenInfo: TokenInfo;
  baseNode: NodeInfo;
};

export type SignatureStepProps = {
  goToSuccessStep: (isLaunched: boolean) => void;
} & BaseProps;

export type SignTokenTransactionsProps = {
  onSuccess: () => void;
  onCancel: () => void;
  selectedAddress: AddressInfo;
  createdCommunityId: string;
} & BaseProps;

export const defaultActionState: ActionState = {
  state: 'not-started',
  errorText: '',
};
