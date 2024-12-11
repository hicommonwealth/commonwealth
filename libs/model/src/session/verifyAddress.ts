import { Session } from '@canvas-js/interfaces';
import { type User } from '@hicommonwealth/core';
import {
  ChainBase,
  WalletId,
  addressSwapper,
  deserializeCanvas,
} from '@hicommonwealth/shared';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import assertAddressOwnership from './assertAddressOwnership';
import { processAddress } from './processAddress';

export async function verifyAddress(
  community_id: string,
  address: string,
  wallet_id: WalletId,
  session: string,
  user?: User,
): Promise<User> {
  const community = await models.Community.findOne({
    where: { id: community_id },
  });
  mustExist('Community', community);

  const decodedAddress =
    community.base === ChainBase.Substrate
      ? addressSwapper({
          address,
          currentPrefix: community.ss58_prefix!,
        })
      : address;

  const decodedSession = deserializeCanvas(session) as Session;

  await processAddress(
    community,
    decodedAddress,
    wallet_id,
    decodedSession,
    user,
  );

  // assertion check
  await assertAddressOwnership(address);

  if (user) return user;

  // if user isn't logged in, log them in now
  const addr = await models.Address.findOne({
    where: { community_id, address },
    attributes: ['user_id'],
    include: {
      model: models.User,
      required: true,
      attributes: ['id', 'email'],
    },
  });
  return {
    id: addr!.User!.id,
    email: addr!.User!.email ?? '',
  };
}
