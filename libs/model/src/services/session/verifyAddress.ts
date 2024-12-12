import { Session } from '@canvas-js/interfaces';
import { type User } from '@hicommonwealth/core';
import {
  ChainBase,
  WalletId,
  addressSwapper,
  deserializeCanvas,
} from '@hicommonwealth/shared';
import { models } from '../../database';
import { mustExist } from '../../middleware/guards';
import assertAddressOwnership from './assertAddressOwnership';
import { processAddress } from './processAddress';

/**
 * Verifies an address, processing it and transferring ownership to the user if necessary.
 * @param community_id
 * @param address
 * @param wallet_id
 * @param session
 * @param user
 */
export async function verifyAddress(
  community_id: string,
  address: string,
  wallet_id: WalletId,
  session: string,
  user?: User,
): Promise<void> {
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

  await processAddress(
    community,
    decodedAddress,
    wallet_id,
    deserializeCanvas(session) as Session,
    user,
  );

  // assertion check (TODO: this might be redundant)
  await assertAddressOwnership(address);
}
