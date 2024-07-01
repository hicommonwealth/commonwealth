import { Session } from '@canvas-js/interfaces';
import { fileURLToPath } from 'url';

import { logger } from '@hicommonwealth/core';
import {
  NotificationCategories,
  getSessionSignerForAddress,
} from '@hicommonwealth/shared';
import Sequelize from 'sequelize';

import {
  type AddressInstance,
  type DB,
  type ProfileAttributes,
} from '@hicommonwealth/model';
import { CANVAS_TOPIC } from '@hicommonwealth/shared';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

const verifySessionSignature = async (
  models: DB,
  addressModel: AddressInstance,
  user_id: number,
  session: Session,
): Promise<boolean> => {
  const expectedAddress = addressModel.address;
  const sessionAddress = session.address.split(':')[2];
  if (sessionAddress !== expectedAddress) {
    log.warn(
      `session.address (${sessionAddress}) does not match addressModel.address (${expectedAddress})`,
    );
  }

  const signer = getSessionSignerForAddress(session.address);
  let isValid = false;
  try {
    if (signer !== undefined) {
      await signer.verifySession(CANVAS_TOPIC, session);
      isValid = true;
    }
  } catch (e) {
    log.error(e);
  }

  addressModel.last_active = new Date();

  if (isValid && user_id === null) {
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
        // @ts-expect-error StrictNullChecks
        const user = await models.User.createWithProfile({
          email: null,
        });
        // @ts-expect-error StrictNullChecks
        addressModel.profile_id = (user.Profiles[0] as ProfileAttributes).id;
        await models.Subscription.create({
          // @ts-expect-error StrictNullChecks
          subscriber_id: user.id,
          category_id: NotificationCategories.NewMention,
          is_active: true,
        });
        await models.Subscription.create({
          // @ts-expect-error StrictNullChecks
          subscriber_id: user.id,
          category_id: NotificationCategories.NewCollaboration,
          is_active: true,
        });
        addressModel.user_id = user.id;
      }
    }
  } else if (isValid) {
    // mark the address as verified
    // @ts-expect-error StrictNullChecks
    addressModel.verification_token_expires = null;
    addressModel.verified = new Date();
    addressModel.user_id = user_id;
    const profile = await models.Profile.findOne({ where: { user_id } });
    // @ts-expect-error StrictNullChecks
    addressModel.profile_id = profile.id;
  }
  await addressModel.save();
  return isValid;
};

export default verifySessionSignature;
