import { createBoundedUseStore } from 'state/ui/utils';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface WelcomeOnboardModalProps {
  isWelcomeOnboardModalOpen: boolean;
  setIsWelcomeOnboardModalOpen: (isOpen: boolean) => void;
}

export const welcomeOnboardModal = createStore<WelcomeOnboardModalProps>()(
  devtools((set) => ({
    isWelcomeOnboardModalOpen: false,
    setIsWelcomeOnboardModalOpen: (isOpen) => {
      set((state) => {
        return {
          ...state,
          isWelcomeOnboardModalOpen: isOpen,
        };
      });
    },
  })),
);

const useWelcomeOnboardModal = createBoundedUseStore(welcomeOnboardModal);

export default useWelcomeOnboardModal;
