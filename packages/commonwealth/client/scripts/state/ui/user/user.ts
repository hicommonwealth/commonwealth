import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { createBoundedUseStore } from '../utils';

type CommonProps = {
  id: number;
  email: string;
  knockJWT: string;
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
    id: 0,
    email: '',
    knockJWT: '',
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
