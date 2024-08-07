import { SessionKeyError } from 'controllers/server/sessions';
import { createBoundedUseStore } from 'state/ui/utils';
import { AuthModalType } from 'views/modals/AuthModal/types';
import { devtools, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface AuthModalStore {
  authModalType: AuthModalType | undefined;
  setAuthModalType: (type: AuthModalType | undefined) => void;
  shouldOpenGuidanceModalAfterMagicSSORedirect: boolean;
  setShouldOpenGuidanceModalAfterMagicSSORedirect: (
    shouldOpen: boolean,
  ) => void;
  validateAndOpenAuthTypeGuidanceModalOnSSORedirectReceived: () => void;
  sessionKeyValidationError?: SessionKeyError;
  checkForSessionKeyRevalidationErrors: (error: unknown) => void;
}

export const authModal = createStore<AuthModalStore>()(
  devtools(
    persist(
      (set) => ({
        authModalType: undefined,
        setAuthModalType: (type) => {
          set((state) => {
            return {
              ...state,
              authModalType: type,
            };
          });
        },
        shouldOpenGuidanceModalAfterMagicSSORedirect: false,
        setShouldOpenGuidanceModalAfterMagicSSORedirect: (shouldOpen) => {
          set((state) => {
            return {
              ...state,
              shouldOpenGuidanceModalAfterMagicSSORedirect: shouldOpen,
            };
          });
        },
        validateAndOpenAuthTypeGuidanceModalOnSSORedirectReceived: () => {
          set((state) => {
            if (state.shouldOpenGuidanceModalAfterMagicSSORedirect) {
              return {
                ...state,
                authModalType: AuthModalType.AccountTypeGuidance,
                shouldOpenGuidanceModalAfterMagicSSORedirect: false,
              };
            }

            return {
              ...state,
              shouldOpenGuidanceModalAfterMagicSSORedirect: false,
            };
          });
        },
        checkForSessionKeyRevalidationErrors: (error) => {
          const sessionKeyValidationError =
            error instanceof SessionKeyError && error;

          if (sessionKeyValidationError) {
            set((state) => {
              return {
                ...state,
                sessionKeyValidationError: sessionKeyValidationError,
                authModalType: AuthModalType.RevalidateSession,
              };
            });
          }
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
