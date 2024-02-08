import { createBoundedUseStore } from 'state/ui/utils';
import { ManageCommunityStakeModalMode } from 'views/modals/ManageCommunityStakeModal/types';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface ManageCommunityStakeModalStore {
  modeOfManageCommunityStakeModal: ManageCommunityStakeModalMode;
  setModeOfManageCommunityStakeModal: (
    modalType: ManageCommunityStakeModalMode,
  ) => any;
}

export const manageCommunityStakeModalStore =
  createStore<ManageCommunityStakeModalStore>()(
    devtools((set) => ({
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
