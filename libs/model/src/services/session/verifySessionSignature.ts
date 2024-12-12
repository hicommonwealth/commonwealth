import { Session } from '@canvas-js/interfaces';
import {
  CANVAS_TOPIC,
  addressSwapper,
  getSessionSignerForDid,
} from '@hicommonwealth/shared';
import assert from 'assert';
import Sequelize, { Transaction } from 'sequelize';
import { models } from '../../database';
import { AddressInstance } from '../../models';
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
  user_id?: number | null,
): Promise<AddressInstance> => {
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
    `session.did address (${walletAddress}) does not match addressModel.address (${expectedAddress})`,
  );

  const signer = getSessionSignerForDid(session.did);
  if (!signer) throw new Error('Missing signer');

  await signer.verifySession(CANVAS_TOPIC, session);

  // mark the address as verified
  addr.verification_token_expires = null;
  addr.verified = new Date();
  addr.last_active = new Date();

  /* If it doesn't have an associated user, create one!
  - IMPORTANT: this is the only place to create a new user (when using wallets)
  - NOTE: magic strategy is the other place (when using email)
  */
  addr.user_id = user_id;
  if (!addr.user_id) {
    const existing = await models.Address.findOne({
      where: {
        address: addr.address,
        user_id: { [Sequelize.Op.ne]: null },
      },
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
      return updated;
    }
    // assign existing user
    addr.user_id = existing.user_id;
  }

  // save the newly verified address, incrementing the profile count (TODO: check this)
  const updated = await addr.save({ transaction });
  await incrementProfileCount(addr.community_id!, addr.user_id!, transaction);
  return updated;
};
