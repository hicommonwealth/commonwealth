export type ManageCommunityStakeModalMode = 'buy' | 'sell';

export interface ManageCommunityStakeModalProps {
  onModalClose: () => void;
  mode: ManageCommunityStakeModalMode;
  denomination: string;
}

export enum ManageCommunityStakeModalState {
  Exchange = 'Exchange',
  Loading = 'Loading',
  Failure = 'Failure',
  Success = 'Success',
}
