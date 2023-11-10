import { createBoundedUseStore } from 'state/ui/utils';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface groupMutationBannerStore {
  shouldShowGroupMutationBanner: boolean;
  setShouldShowGroupMutationBanner: (shouldShow: boolean) => void;
}

export const GroupMutationBannerStore = createStore<groupMutationBannerStore>()(
  devtools((set) => ({
    shouldShowGroupMutationBanner: false,
    setShouldShowGroupMutationBanner: (shouldShow) =>
      set({ shouldShowGroupMutationBanner: shouldShow }),
  })),
);

const useGroupMutationBannerStore = createBoundedUseStore(
  GroupMutationBannerStore,
);

export default useGroupMutationBannerStore;
