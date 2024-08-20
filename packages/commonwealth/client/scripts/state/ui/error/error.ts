import { createBoundedUseStore } from 'state/ui/utils';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface ErrorStore {
  loadingError: string;
  setLoadingError: (loadingError: string) => void;
}

export const errorStore = createStore<ErrorStore>()(
  devtools((set) => ({
    loadingError: '',
    setLoadingError: (loadingError) => set({ loadingError }),
  })),
);

const useErrorStore = createBoundedUseStore(errorStore);

export default useErrorStore;
