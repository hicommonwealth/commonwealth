import {
  EmailNotificationInterval,
  ExtendedCommunity,
} from '@hicommonwealth/schemas';
import { WalletId } from '@hicommonwealth/shared';
import Account from 'models/Account';
import AddressInfo from 'models/AddressInfo';
import { z } from 'zod';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { createBoundedUseStore } from '../utils';

export type UserCommunities = {
  id: string;
  name: string;
  iconUrl: string;
  isStarred: boolean;
};

type CommonProps = {
  id: number;
  email: string;
  emailNotificationInterval: z.infer<typeof EmailNotificationInterval> | '';
  knockJWT: string;
  addresses: AddressInfo[];
  activeCommunity: z.infer<typeof ExtendedCommunity> | null;
  communities: UserCommunities[]; // basic info of user-joined communities with user-associated metadata per community
  accounts: Account[]; // contains full accounts list of the user - when in a active chain/community scope, only
  // contains accounts specific to that community
  activeAccount: Account | null;
  jwt: string | null;
  isOnPWA: boolean;
  isSiteAdmin: boolean;
  isEmailVerified: boolean;
  isPromotionalEmailEnabled: boolean;
  isWelcomeOnboardFlowComplete: boolean;
  isLoggedIn: boolean;
  addressSelectorSelectedAddress: string | undefined;
  hasMagicWallet: boolean;
  xpPoints: number;
  xpReferrerPoints: number;
  referredByAddress?: string;
  tier: number;
  notifyUserNameChange: boolean;
};

export type UserStoreProps = CommonProps & {
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
    isOnPWA: false,
    isSiteAdmin: false,
    isEmailVerified: false,
    isPromotionalEmailEnabled: false,
    isWelcomeOnboardFlowComplete: false,
    isLoggedIn: false,
    addressSelectorSelectedAddress: undefined,
    hasMagicWallet: false,
    xpPoints: 0,
    xpReferrerPoints: 0,
    referredByAddress: undefined,
    tier: 0,
    notifyUserNameChange: false,
    // when logged-in, set the auth-user values
    setData: (data) => {
      if (Object.keys(data).length > 0) {
        set((state) => {
          const newState = { ...state, ...data };

          // Compute hasMagicWallet whenever addresses or activeAccount changes
          const hasMagicWallet = Boolean(
            newState.activeAccount?.walletId === WalletId.Magic ||
              newState.accounts?.some(
                (account) => account.walletId === WalletId.Magic,
              ) ||
              newState.addresses?.some(
                (addr) => addr.walletId === WalletId.Magic,
              ),
          );

          return {
            ...newState,
            hasMagicWallet,
          };
        });
      }
    },
  })),
);

export const useUserStore = createBoundedUseStore(userStore);
