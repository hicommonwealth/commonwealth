import { createBoundedUseStore } from 'state/ui/utils';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface IGrowlStore {
  growlHidden: boolean;
  setGrowlHidden: (growlHidden: boolean) => void;
}

export const growlStore = createStore<IGrowlStore>()(
  devtools(
    (set) => ({
      growlHidden: false,
      setGrowlHidden: (growlHidden: boolean) => set({ growlHidden }),
      message: '',
    }),
    {
      name: 'growl',
    },
  ),
);

const useGrowlStore = createBoundedUseStore(growlStore);

export default useGrowlStore;
