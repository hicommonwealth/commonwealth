import ChainInfo from 'client/scripts/models/ChainInfo';

export type ManageCommunityStakeModalMode = 'buy' | 'sell';

export interface ManageCommunityStakeModalProps {
  onModalClose: () => void;
  mode: ManageCommunityStakeModalMode;
  denomination: string;
  community?: ChainInfo;
}

export enum ManageCommunityStakeModalState {
  Exchange = 'Exchange',
  Loading = 'Loading',
  Failure = 'Failure',
  Success = 'Success',
}
