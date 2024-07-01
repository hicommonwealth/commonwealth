import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { createBoundedUseStore } from '../utils';

type CommonProps = {
  isSiteAdmin: boolean;
  isEmailVerified: boolean;
  isPromotionalEmailEnabled: boolean;
  isWelcomeOnboardFlowComplete: boolean;
};

type UserStoreProps = CommonProps & {
  setData: (data: Partial<CommonProps>) => void;
};

export const userStore = createStore<UserStoreProps>()(
  devtools((set) => ({
    // default values when user is not signed in
    isSiteAdmin: false,
    isEmailVerified: false,
    isPromotionalEmailEnabled: false,
    isWelcomeOnboardFlowComplete: false,
    // when logged-in, set the auth-user values
    setData: (data) => {
      if (Object.keys(data).length > 0) {
        set((state) => ({
          ...state,
          ...data,
        }));
      }
    },
  })),
);

export const useUserStore = createBoundedUseStore(userStore);
