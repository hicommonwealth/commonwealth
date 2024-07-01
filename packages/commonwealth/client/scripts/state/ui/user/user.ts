import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { createBoundedUseStore } from '../utils';

type CommonProps = {
  isEmailVerified: boolean;
};

type UserStoreProps = CommonProps & {
  setData: (data: Partial<CommonProps>) => void;
};

export const userStore = createStore<UserStoreProps>()(
  devtools((set) => ({
    // default values when user is not signed in
    isEmailVerified: false,
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
