import { Session, SessionSigner } from '@canvas-js/interfaces';
import { NotificationCategories, logger } from '@hicommonwealth/core';
import type {
  AddressInstance,
  DB,
  ProfileAttributes,
} from '@hicommonwealth/model';
import Sequelize from 'sequelize';

import { CANVAS_TOPIC } from '../../shared/canvas';

const log = logger().getLogger(__filename);

const verifySessionSignature = async (
  models: DB,
  addressModel: AddressInstance,
  user_id: number,
  session: Session,
): Promise<boolean> => {
  const { SIWESigner } = await import('@canvas-js/chain-ethereum');
  // const { SolanaSigner } = await import('@canvas-js/chain-solana');
  // const { SubstrateSigner } = await import('@canvas-js/chain-substrate');

  const signers: SessionSigner[] = [
    new SIWESigner(),
    // new SubstrateSigner(),
    // new SolanaSigner(),
  ];

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

  if (isValid && user_id === null) {
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
        addressModel.profile_id = existingAddress.profile_id;
      } else {
        const user = await models.User.createWithProfile(models, {
          email: null,
        });
        addressModel.profile_id = (user.Profiles[0] as ProfileAttributes).id;
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
        addressModel.user_id = user.id;
      }
    }
  } else if (isValid) {
    // mark the address as verified
    addressModel.verification_token_expires = null;
    addressModel.verified = new Date();
    addressModel.user_id = user_id;
    const profile = await models.Profile.findOne({ where: { user_id } });
    addressModel.profile_id = profile.id;
  }
  await addressModel.save();
  return isValid;
};

export default verifySessionSignature;
