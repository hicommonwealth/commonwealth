import { AuthModalType } from 'client/scripts/views/modals/AuthModal';
import { createBoundedUseStore } from 'state/ui/utils';
import { devtools, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface AuthModalStore {
  shouldOpenGuidanceModalAfterMagicSSORedirect: boolean;
  setShouldOpenGuidanceModalAfterMagicSSORedirect: (
    shouldOpen: boolean,
  ) => void;
  triggerOpenModalType: AuthModalType;
  setTriggerOpenModalType: (modalType: AuthModalType) => void;
  validateAndOpenAuthTypeGuidanceModalOnSSORedirectReceived: () => void;
}

export const authModal = createStore<AuthModalStore>()(
  devtools(
    persist(
      (set) => ({
        shouldOpenGuidanceModalAfterMagicSSORedirect: false,
        setShouldOpenGuidanceModalAfterMagicSSORedirect: (shouldOpen) => {
          set((state) => {
            return {
              ...state,
              shouldOpenGuidanceModalAfterMagicSSORedirect: shouldOpen,
            };
          });
        },
        triggerOpenModalType: null,
        setTriggerOpenModalType: (modalType) => {
          set((state) => {
            return {
              ...state,
              triggerOpenModalType: modalType,
            };
          });
        },
        validateAndOpenAuthTypeGuidanceModalOnSSORedirectReceived: () => {
          set((state) => {
            if (state.shouldOpenGuidanceModalAfterMagicSSORedirect) {
              return {
                ...state,
                triggerOpenModalType: AuthModalType.AccountTypeGuidance,
                shouldOpenGuidanceModalAfterMagicSSORedirect: false,
              };
            }

            return {
              ...state,
              shouldOpenGuidanceModalAfterMagicSSORedirect: false,
            };
          });
        },
      }),
      {
        name: 'auth-modal', // unique name
        partialize: (state) => ({
          shouldOpenGuidanceModalAfterMagicSSORedirect:
            state.shouldOpenGuidanceModalAfterMagicSSORedirect,
        }), // persist only shouldOpenGuidanceModalAfterMagicSSORedirect
      },
    ),
  ),
);

const useAuthModalStore = createBoundedUseStore(authModal);

export default useAuthModalStore;
