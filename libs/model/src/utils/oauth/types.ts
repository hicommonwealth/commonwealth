import { WalletSsoSource } from '@hicommonwealth/shared';

export type VerifiedUserInfo = {
  provider: WalletSsoSource;
  email?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  username?: string;
};
