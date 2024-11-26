import { createBoundedUseStore } from 'state/ui/utils';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface InviteLinkModalProps {
  isInviteLinkModalOpen: boolean;
  setIsInviteLinkModalOpen: (isOpen: boolean) => void;
}

export const inviteLinkModal = createStore<InviteLinkModalProps>()(
  devtools((set) => ({
    isInviteLinkModalOpen: false,
    setIsInviteLinkModalOpen: (isOpen) => {
      set((state) => {
        return {
          ...state,
          isInviteLinkModalOpen: isOpen,
        };
      });
    },
  })),
);

const useInviteLinkModal = createBoundedUseStore(inviteLinkModal);

export default useInviteLinkModal;
