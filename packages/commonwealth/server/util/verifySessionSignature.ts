import { Session } from '@canvas-js/interfaces';
import { fileURLToPath } from 'url';

import { logger } from '@hicommonwealth/core';
import { NotificationCategories } from '@hicommonwealth/shared';
import Sequelize from 'sequelize';

import type {
  AddressInstance,
  DB,
  ProfileAttributes,
} from '@hicommonwealth/model';
import { getSessionSigners } from 'shared/canvas/verify';
import { CANVAS_TOPIC } from '../../shared/canvas';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

const verifySessionSignature = async (
  models: DB,
  addressModel: AddressInstance,
  user_id: number,
  session: Session,
): Promise<boolean> => {
  const signers = getSessionSigners();

  const expectedAddress = addressModel.address;
  const sessionAddress = session.address.split(':')[2];
  if (sessionAddress !== expectedAddress) {
    log.error(
      `session.address (${sessionAddress}) does not match addressModel.address (${expectedAddress})`,
    );
  }

  const matchingSigners = signers.filter((signer) =>
    signer.match(session.address),
  );
  const signer = matchingSigners[0];
  let isValid = false;
  try {
    await signer.verifySession(CANVAS_TOPIC, session);
    isValid = true;
  } catch (e) {
    console.log(e);
  }

  addressModel.last_active = new Date();

  // @ts-expect-error StrictNullChecks
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
    // @ts-expect-error StrictNullChecks
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
  // @ts-expect-error StrictNullChecks
  return isValid;
};

export default verifySessionSignature;
