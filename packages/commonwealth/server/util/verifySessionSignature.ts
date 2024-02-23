import { NotificationCategories, logger } from '@hicommonwealth/core';
import Sequelize, { Transaction } from 'sequelize';

import type { Session, SessionSigner } from '@canvas-js/interfaces';
import type {
  AddressInstance,
  DB,
  ProfileAttributes,
} from '@hicommonwealth/model';
import { CANVAS_TOPIC } from '../../shared/canvas';

const log = logger().getLogger(__filename);

export const attachUserAndProfileToAddressInstance = async ({
  addressInstance,
  models,
  user_id,
  transaction,
}: {
  addressInstance: AddressInstance;
  models: DB;
  user_id?: number;
  transaction: Transaction;
}) => {
  if (!user_id) {
    // if it doesn't have an associated user, create a new user
    if (!addressInstance.user_id) {
      const existingAddress = await models.Address.findOne({
        where: {
          address: addressInstance.address,
          user_id: { [Sequelize.Op.ne]: null },
        },
        transaction,
      });
      if (existingAddress) {
        addressInstance.user_id = existingAddress.user_id;
        addressInstance.profile_id = existingAddress.profile_id;
      } else {
        const user = await models.User.createWithProfile(
          models,
          {
            email: null,
          },
          { transaction },
        );
        addressInstance.profile_id = (user.Profiles[0] as ProfileAttributes).id;
        await models.Subscription.create(
          {
            subscriber_id: user.id,
            category_id: NotificationCategories.NewMention,
            is_active: true,
          },
          { transaction },
        );
        await models.Subscription.create(
          {
            subscriber_id: user.id,
            category_id: NotificationCategories.NewCollaboration,
            is_active: true,
          },
          { transaction },
        );
        addressInstance.user_id = user.id;
      }
    }
  } else {
    addressInstance.user_id = user_id;
    const profile = await models.Profile.findOne({
      where: { user_id },
      transaction,
    });
    addressInstance.profile_id = profile.id;
  }
};

const verifySessionSignature = async (
  session: Session,
  expectedAddress: string,
): Promise<boolean> => {
  const { SIWESigner } = await import('@canvas-js/chain-ethereum');
  // const { SolanaSigner } = await import('@canvas-js/chain-solana');
  // const { SubstrateSigner } = await import('@canvas-js/chain-substrate');

  const signers: SessionSigner[] = [
    new SIWESigner(),
    // new SubstrateSigner(),
    // new SolanaSigner(),
  ];

  const sessionAddress = session.address.split(':')[2];

  console.log(sessionAddress);
  console.log(expectedAddress);
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
    console.log(e);
    isValid = false;
  }

  return isValid;
};

export default verifySessionSignature;
