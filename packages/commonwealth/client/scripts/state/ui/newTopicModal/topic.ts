import { createBoundedUseStore } from 'state/ui/utils';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface NewTopicModalMutationStore {
  isNewTopicModalOpen: boolean;
  setIsNewTopicModalOpen: (isOpen: boolean) => any;
}

export const NewTopicModalMutationStore =
  createStore<NewTopicModalMutationStore>()(
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

const useNewTopicModalMutationStore = createBoundedUseStore(
  NewTopicModalMutationStore,
);

export default useNewTopicModalMutationStore;
