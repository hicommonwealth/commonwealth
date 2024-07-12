import ChainInfo from 'models/ChainInfo';
import { createBoundedUseStore } from 'state/ui/utils';
import { ManageCommunityStakeModalMode } from 'views/modals/ManageCommunityStakeModal/types';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface ManageCommunityStakeModalStore {
  selectedAddress?: Readonly<string>;
  setSelectedAddress: (address: string) => void;
  selectedCommunity?: Readonly<ChainInfo>;
  setSelectedCommunity: (community: ChainInfo) => void;
  modeOfManageCommunityStakeModal: ManageCommunityStakeModalMode;
  setModeOfManageCommunityStakeModal: (
    modalType: ManageCommunityStakeModalMode,
  ) => void;
}

export const manageCommunityStakeModalStore =
  createStore<ManageCommunityStakeModalStore>()(
    devtools((set) => ({
      setSelectedAddress: (address) => {
        set((state) => {
          return {
            ...state,
            selectedAddress: address,
          };
        });
      },
      setSelectedCommunity: (community) => {
        set((state) => {
          return {
            ...state,
            selectedCommunity: community,
          };
        });
      },
      // @ts-expect-error StrictNullChecks
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
