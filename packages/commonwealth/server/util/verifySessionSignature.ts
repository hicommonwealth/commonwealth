import { Session } from '@canvas-js/interfaces';
import assert from 'assert';

import {
  CANVAS_TOPIC,
  addressSwapper,
  getSessionSignerForDid,
} from '@hicommonwealth/shared';
import Sequelize from 'sequelize';

import {
  incrementProfileCount,
  type AddressInstance,
  type DB,
} from '@hicommonwealth/model';
import { getRandomAvatar } from './defaultAvatar';

/**
 * Verify the session signature is valid for the address model,
 * and either create a new user linked to `addressModel`
 * or attach it to an existing `user_id`.
 */
const verifySessionSignature = async (
  models: DB,
  addressModel: AddressInstance,
  user_id: number | undefined | null,
  session: Session,
): Promise<void> => {
  const storedAddress = addressModel.address;

  // Re-encode BOTH address if needed for substrate verification, to ensure matching
  //  between stored address (re-encoded based on community joined at creation time)
  //  and address provided directly from wallet.
  const expectedAddress = addressModel.Community?.ss58_prefix
    ? addressSwapper({
        address: storedAddress,
        currentPrefix: 42,
      })
    : addressModel.address;

  const sessionRawAddress = session.did.split(':')[4];
  const walletAddress = addressModel.Community?.ss58_prefix
    ? addressSwapper({
        address: sessionRawAddress,
        currentPrefix: 42,
      })
    : sessionRawAddress;
  assert(
    walletAddress === expectedAddress,
    `session.did address (${walletAddress}) does not match addressModel.address (${expectedAddress})`,
  );

  const signer = getSessionSignerForDid(session.did);
  if (!signer) {
    throw new Error('missing signer');
  }

  await signer.verifySession(CANVAS_TOPIC, session);

  addressModel.last_active = new Date();

  if (user_id === null || user_id === undefined) {
    // mark the address as verified, and if it doesn't have an associated user, create a new user
    addressModel.verification_token_expires = null;
    addressModel.verified = new Date();
    if (!addressModel.user_id) {
      const existingAddress = await models.Address.findOne({
        where: {
          address: addressModel.address,
          user_id: { [Sequelize.Op.ne]: null },
        },
      });
      if (existingAddress) {
        addressModel.user_id = existingAddress.user_id;
      } else {
        const default_avatar_url = getRandomAvatar();
        const user = await models.sequelize.transaction(async (transaction) => {
          const userEntity = await models.User.create(
            {
              email: null,
              profile: {
                avatar_url: default_avatar_url,
              },
            },
            { transaction },
          );

          await incrementProfileCount(
            addressModel.community_id!,
            userEntity!.id!,
            transaction,
          );

          return userEntity;
        });
        if (!user || !user.id) throw new Error('Failed to create user');
        addressModel.user_id = user!.id;
      }
    }
  } else {
    // mark the address as verified
    addressModel.verification_token_expires = null;
    addressModel.verified = new Date();
    addressModel.user_id = user_id;
    await incrementProfileCount(addressModel.community_id!, user_id, undefined);
  }
  await addressModel.save();
};

export default verifySessionSignature;
