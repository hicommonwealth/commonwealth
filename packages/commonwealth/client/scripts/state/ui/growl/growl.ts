import { createBoundedUseStore } from 'state/ui/utils';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface GrowlStore {
  isGrowlHidden: boolean;
  setIsGrowlHidden: (isGrowlHidden: boolean) => void;
}

const growlStore = createStore<GrowlStore>()(
  devtools(
    (set) => ({
      isGrowlHidden: false,
      setIsGrowlHidden: (isGrowlHidden: boolean) => set({ isGrowlHidden }),
    }),
    {
      name: 'growl',
    },
  ),
);

const useGrowlStore = createBoundedUseStore(growlStore);

export default useGrowlStore;
