import { NotificationCategories, logger } from '@hicommonwealth/core';
import Sequelize from 'sequelize';

import { SIWESigner } from '@canvas-js/chain-ethereum';
import { SolanaSigner } from '@canvas-js/chain-solana';
import { SubstrateSigner } from '@canvas-js/chain-substrate';
import { Session, SessionSigner } from '@canvas-js/interfaces';
import type {
  AddressInstance,
  DB,
  ProfileAttributes,
} from '@hicommonwealth/model';
import { CANVAS_TOPIC } from '../../shared/canvas';

const log = logger().getLogger(__filename);

const signers: SessionSigner[] = [
  new SIWESigner(),
  new SubstrateSigner(),
  new SolanaSigner(),
];

export const markAddressInstanceAsVerified = async ({
  addressInstance,
}: {
  addressInstance: AddressInstance;
  models: DB;
}) => {
  // mark the address as verified
  addressInstance.verification_token_expires = null;
  addressInstance.verified = new Date();
};

export const attachUserAndProfileToAddressInstance = async ({
  addressInstance,
  models,
  user_id,
}: {
  addressInstance: AddressInstance;
  models: DB;
  user_id: number | null;
}) => {
  if (user_id === null) {
    // if it doesn't have an associated user, create a new user
    if (!addressInstance.user_id) {
      const existingAddress = await models.Address.findOne({
        where: {
          address: addressInstance.address,
          user_id: { [Sequelize.Op.ne]: null },
        },
      });
      if (existingAddress) {
        addressInstance.user_id = existingAddress.user_id;
        addressInstance.profile_id = existingAddress.profile_id;
      } else {
        const user = await models.User.createWithProfile(models, {
          email: null,
        });
        addressInstance.profile_id = (user.Profiles[0] as ProfileAttributes).id;
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
        addressInstance.user_id = user.id;
      }
    }
  } else {
    addressInstance.user_id = user_id;
    const profile = await models.Profile.findOne({ where: { user_id } });
    addressInstance.profile_id = profile.id;
  }
};

const verifySessionSignature = async (
  session: Session,
  expectedAddress: string,
): Promise<boolean> => {
  const sessionAddress = session.address.split(':')[2];

  if (sessionAddress !== expectedAddress) {
    log.error(
      `session.address (${sessionAddress}) does not match addressModel.address (${expectedAddress})`,
    );
  }

  const matchingSigners = signers.filter((signer) =>
    signer.match(session.address),
  );
  if (matchingSigners.length == 0) {
    log.error(
      `no signer found that matches session.address ${session.address}`,
    );
    return false;
  }
  const signer = matchingSigners[0];
  let isValid: boolean;
  try {
    await signer.verifySession(CANVAS_TOPIC, session);
    isValid = true;
  } catch (e) {
    isValid = false;
  }

  return isValid;
};

export default verifySessionSignature;
