import { createBoundedUseStore } from 'state/ui/utils';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface NewTopicModalStore {
  isNewTopicModalOpen: boolean;
  setIsNewTopicModalOpen: (isOpen: boolean) => any;
}

export const newTopicModalStore = createStore<NewTopicModalStore>()(
  devtools((set) => ({
    isNewTopicModalOpen: false,
    setIsNewTopicModalOpen: (isOpen) => {
      set((state) => {
        return {
          ...state,
          isNewTopicModalOpen: isOpen,
        };
      });
    },
  })),
);

const useNewTopicModalStore = createBoundedUseStore(newTopicModalStore);

export default useNewTopicModalStore;
