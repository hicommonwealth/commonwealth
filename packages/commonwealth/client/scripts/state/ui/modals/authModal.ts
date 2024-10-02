import { SessionKeyError } from 'controllers/server/sessions';
import { createBoundedUseStore } from 'state/ui/utils';
import { AuthModalType } from 'views/modals/AuthModal/types';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface AuthModalStore {
  authModalType: AuthModalType | undefined;
  setAuthModalType: (type: AuthModalType | undefined) => void;
  sessionKeyValidationError?: SessionKeyError;
  checkForSessionKeyRevalidationErrors: (error: unknown) => void;
}

export const authModal = createStore<AuthModalStore>()(
  devtools((set) => ({
    authModalType: undefined,
    setAuthModalType: (type) => {
      set((state) => {
        return {
          ...state,
          authModalType: type,
        };
      });
    },
    checkForSessionKeyRevalidationErrors: (error) => {
      const sessionKeyValidationError =
        error instanceof SessionKeyError && error;

      if (sessionKeyValidationError) {
        console.log('session key validation error');
        // set((state) => {
        //   return {
        //     ...state,
        //     sessionKeyValidationError: sessionKeyValidationError,
        //     authModalType: AuthModalType.RevalidateSession,
        //   };
        // });
      }
    },
  })),
);

const useAuthModalStore = createBoundedUseStore(authModal);

export default useAuthModalStore;
