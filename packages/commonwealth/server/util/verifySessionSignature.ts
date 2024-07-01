import { Session } from '@canvas-js/interfaces';
import assert from 'assert';

import { NotificationCategories } from '@hicommonwealth/shared';
import Sequelize from 'sequelize';
import { getSessionSignerForAddress } from 'shared/canvas/verify';

import {
  type AddressInstance,
  type DB,
  type ProfileAttributes,
} from '@hicommonwealth/model';
import { CANVAS_TOPIC } from '../../shared/canvas';

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
  const expectedAddress = addressModel.address;

  const walletAddress = session.address.split(':')[2];
  assert(
    walletAddress === expectedAddress,
    `session.address (${walletAddress}) does not match addressModel.address (${expectedAddress})`,
  );

  const signer = getSessionSignerForAddress(session.address);
  if (!signer) {
    throw new Error('missing signer');
  }

  await signer.verifySession(CANVAS_TOPIC, session);

  addressModel.last_active = new Date();

  if (user_id === null || user_id === undefined) {
    // mark the address as verified, and if it doesn't have an associated user, create a new user
    // @ts-expect-error StrictNullChecks
    addressModel.verification_token_expires = null;
    addressModel.verified = new Date();
    if (!addressModel.user_id) {
      const existingAddress = await models.Address.findOne({
        // @ts-expect-error StrictNullChecks
        where: {
          address: addressModel.address,
          user_id: { [Sequelize.Op.ne]: null },
        },
      });
      if (existingAddress) {
        addressModel.user_id = existingAddress.user_id;
        addressModel.profile_id = existingAddress.profile_id;
      } else {
        const user = await models.User.createWithProfile?.({
          email: null,
        });
        if (!user || !user.id) throw new Error('Failed to create user');
        addressModel.profile_id = (user?.Profiles?.[0] as ProfileAttributes).id;
        await models.Subscription.create({
          subscriber_id: user.id,
          category_id: NotificationCategories.NewMention,
          is_active: true,
        });
        await models.Subscription.create({
          subscriber_id: user.id,
          category_id: NotificationCategories.NewCollaboration,
          is_active: true,
        });
        addressModel.user_id = user!.id;
      }
    }
  } else {
    // mark the address as verified
    // @ts-expect-error StrictNullChecks
    addressModel.verification_token_expires = null;
    addressModel.verified = new Date();
    addressModel.user_id = user_id;
    const profile = await models.Profile.findOne({ where: { user_id } });
    addressModel.profile_id = profile?.id;
  }
  await addressModel.save();
};

export default verifySessionSignature;
