import { WalletSsoSource } from '@hicommonwealth/shared';
import { z } from 'zod';

export const MagicLogin = z.object({
  community_id: z.string().optional(),
  access_token: z.string().optional(),
  jwt: z.string().nullish(),
  username: z.string().nullish(),
  avatarUrl: z.string().nullish(),
  magicAddress: z.string(),
  session: z.string().nullish(),
  walletSsoSource: z.nativeEnum(WalletSsoSource),
  referrer_address: z.string().nullish(),
});
