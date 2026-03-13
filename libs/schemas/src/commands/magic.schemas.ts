import { WalletSsoSource } from '@hicommonwealth/shared';
import { z } from 'zod';
import { ImageUrl } from '../utils';

export const MagicLogin = z.object({
  community_id: z.string().optional(),
  access_token: z.string().optional(),
  jwt: z.string().nullish(),
  username: z.string().nullish(),
  avatarUrl: ImageUrl.nullish(),
  magicAddress: z.string(),
  session: z.string().nullish(),
  walletSsoSource: z.enum(WalletSsoSource),
  referrer_address: z.string().nullish(),
});
