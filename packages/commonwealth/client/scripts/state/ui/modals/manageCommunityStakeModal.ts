import ChainInfo from 'client/scripts/models/ChainInfo';
import { CommunityData } from 'client/scripts/views/pages/DirectoryPage/DirectoryPageContent';
import { createBoundedUseStore } from 'state/ui/utils';
import { ManageCommunityStakeModalMode } from 'views/modals/ManageCommunityStakeModal/types';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface ManageCommunityStakeModalStore {
  selectedCommunity?: ChainInfo | CommunityData;
  setSelectedCommunity: (community: ChainInfo | CommunityData) => void;
  modeOfManageCommunityStakeModal: ManageCommunityStakeModalMode;
  setModeOfManageCommunityStakeModal: (
    modalType: ManageCommunityStakeModalMode,
  ) => void;
}

export const manageCommunityStakeModalStore =
  createStore<ManageCommunityStakeModalStore>()(
    devtools((set) => ({
      setSelectedCommunity: (community) => {
        set((state) => {
          return {
            ...state,
            selectedCommunity: community,
          };
        });
      },
      modeOfManageCommunityStakeModal: null,
      setModeOfManageCommunityStakeModal: (modalType) => {
        set((state) => {
          return {
            ...state,
            modeOfManageCommunityStakeModal: modalType,
          };
        });
      },
    })),
  );

const useManageCommunityStakeModalStore = createBoundedUseStore(
  manageCommunityStakeModalStore,
);

export default useManageCommunityStakeModalStore;
