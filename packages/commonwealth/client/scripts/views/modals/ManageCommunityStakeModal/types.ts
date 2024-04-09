import ChainInfo from 'client/scripts/models/ChainInfo';
import { CommunityData } from '../../pages/DirectoryPage/DirectoryPageContent';

export type ManageCommunityStakeModalMode = 'buy' | 'sell';

export interface ManageCommunityStakeModalProps {
  onModalClose: () => void;
  mode: ManageCommunityStakeModalMode;
  community?: ChainInfo | CommunityData;
}

export enum ManageCommunityStakeModalState {
  Exchange = 'Exchange',
  Loading = 'Loading',
  Failure = 'Failure',
  Success = 'Success',
}
