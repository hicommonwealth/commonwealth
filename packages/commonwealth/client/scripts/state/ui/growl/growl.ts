import { createBoundedUseStore } from 'state/ui/utils';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface GrowlStore {
  growlHidden: boolean;
  setGrowlHidden: (growlHidden: boolean) => void;
}

const growlStore = createStore<GrowlStore>()(
  devtools(
    (set) => ({
      growlHidden: false,
      setGrowlHidden: (growlHidden: boolean) => set({ growlHidden }),
    }),
    {
      name: 'growl',
    },
  ),
);

const useGrowlStore = createBoundedUseStore(growlStore);

export default useGrowlStore;
