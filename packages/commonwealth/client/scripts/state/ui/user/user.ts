import Account from 'models/Account';
import AddressInfo from 'models/AddressInfo';
import ChainInfo from 'models/ChainInfo';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { createBoundedUseStore } from '../utils';

export type EmailNotificationInterval = 'weekly' | 'never';

type UserCommunities = {
  id: string;
  name: string;
  iconUrl: string;
  isStarred: boolean;
};

type CommonProps = {
  id: number;
  email: string;
  emailNotificationInterval: EmailNotificationInterval | '';
  knockJWT: string;
  addresses: AddressInfo[];
  activeCommunity: ChainInfo | null;
  communities: UserCommunities[]; // basic info of user-joined communities with user-associated metadata per community
  accounts: Account[]; // contains full accounts list of the user - when in a active chain/community scope, only
  // contains accounts specific to that community
  activeAccount: Account | null;
  jwt: string | null;
  isSiteAdmin: boolean;
  isEmailVerified: boolean;
  isPromotionalEmailEnabled: boolean;
  isWelcomeOnboardFlowComplete: boolean;
  isLoggedIn: boolean;
};

type UserStoreProps = CommonProps & {
  setData: (data: Partial<CommonProps>) => void;
};

export const userStore = createStore<UserStoreProps>()(
  devtools((set) => ({
    // default values when user is not signed in
    id: 0,
    email: '',
    emailNotificationInterval: '',
    knockJWT: '',
    addresses: [],
    activeCommunity: null,
    communities: [],
    accounts: [],
    activeAccount: null,
    jwt: null,
    isSiteAdmin: false,
    isEmailVerified: false,
    isPromotionalEmailEnabled: false,
    isWelcomeOnboardFlowComplete: false,
    isLoggedIn: false,
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
