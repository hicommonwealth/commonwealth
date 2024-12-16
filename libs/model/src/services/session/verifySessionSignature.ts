import { Session } from '@canvas-js/interfaces';
import {
  CANVAS_TOPIC,
  addressSwapper,
  getSessionSignerForDid,
} from '@hicommonwealth/shared';
import assert from 'assert';
import Sequelize, { Transaction } from 'sequelize';
import { models } from '../../database';
import { AddressInstance, UserInstance } from '../../models';
import { incrementProfileCount } from '../../utils';

/**
 * Verifies that the session signature is valid for the address model
 * - Creates a new user linked to `addressModel`!
 * - Or attaches an existing `user_id` when provided.
 */
export const verifySessionSignature = async (
  session: Session,
  addr: AddressInstance,
  transaction: Transaction,
): Promise<{ addr: AddressInstance; user?: UserInstance }> => {
  // Re-encode BOTH address if needed for substrate verification, to ensure matching
  // between stored address (re-encoded based on community joined at creation time)
  // and address provided directly from wallet.
  const expectedAddress = addr.Community?.ss58_prefix
    ? addressSwapper({
        address: addr.address,
        currentPrefix: 42,
      })
    : addr.address;
  const sessionRawAddress = session.did.split(':')[4];
  const walletAddress = addr.Community?.ss58_prefix
    ? addressSwapper({
        address: sessionRawAddress,
        currentPrefix: 42,
      })
    : sessionRawAddress;
  assert(
    walletAddress === expectedAddress,
    `session.did address (${walletAddress}) does not match (${expectedAddress})`,
  );

  const signer = getSessionSignerForDid(session.did);
  if (!signer) throw new Error('Missing signer');

  await signer.verifySession(CANVAS_TOPIC, session);

  // mark the address as verified TODO: why are we setting expire to null?
  addr.verification_token_expires = null;
  addr.verified = new Date();
  addr.last_active = new Date();

  /* If it doesn't have an associated user, create one!
  - IMPORTANT: this is the only place to create a new user (when using wallets)
  - NOTE: magic strategy is the other place (when using email)
  */
  if (!addr.user_id) {
    const existing = await models.Address.findOne({
      where: {
        address: addr.address,
        user_id: { [Sequelize.Op.ne]: null },
      },
      include: [
        {
          model: models.User,
          required: true,
          attributes: ['id', 'email', 'profile'],
        },
      ],
    });
    // create new user if none found for this address
    if (!existing) {
      const user = await models.User.create(
        { email: null, profile: {} },
        { transaction },
      );
      if (!user) throw new Error('Failed to create user');
      addr.user_id = user.id;
      const updated = await addr.save({ transaction });
      await incrementProfileCount(addr.community_id!, user.id!, transaction);
      return { addr: updated, user };
    }
    addr.user_id = existing.user_id;
  }

  // save the newly verified address
  const updated = await addr.save({ transaction });
  // TODO: should we always increment the profile count?
  await incrementProfileCount(addr.community_id!, addr.user_id!, transaction);
  return { addr: updated };
};
