import { type Session } from '@canvas-js/interfaces';
import {
  InvalidInput,
  InvalidState,
  logger,
  type User,
} from '@hicommonwealth/core';
import {
  DynamicTemplate,
  PRODUCTION_DOMAIN,
  WalletId,
} from '@hicommonwealth/shared';
import sgMail from '@sendgrid/mail';
import { Op, Transaction } from 'sequelize';
import { models, sequelize } from '../../database';
import { AddressInstance, CommunityInstance } from '../../models';
import { verifySessionSignature } from './verifySessionSignature';

const log = logger(import.meta);

export const Errors = {
  InvalidCommunity: 'Invalid community',
  InvalidAddress: 'Invalid address',
  NoChain: 'Must provide chain',
  AddressNF: 'Address not found',
  ExpiredToken: 'Token has expired, please re-register',
  InvalidSignature: 'Invalid signature, please re-register',
  NoEmail: 'No email to alert',
  InvalidArguments: 'Invalid arguments',
  BadSecret: 'Invalid jwt secret',
  BadToken: 'Invalid sign in token',
  WrongWallet: 'Verified with different wallet than created',
};

/**
 * After verification, reassign users of transferred addresses = "transfer ownership".
 */
async function transferOwnership(
  addr: AddressInstance,
  community: CommunityInstance,
  transaction: Transaction,
) {
  const unverifed = await models.Address.findOne({
    where: {
      address: addr.address,
      user_id: { [Op.ne]: addr.user_id },
      verified: { [Op.ne]: null },
    },
    include: {
      model: models.User,
      required: true,
      attributes: ['id', 'email'],
    },
    transaction,
  });
  const [updated] = await models.Address.update(
    { user_id: addr.user_id },
    {
      where: {
        address: addr.address,
        user_id: { [Op.ne]: addr.user_id },
        verified: { [Op.ne]: null },
      },
      transaction,
    },
  );
  if (updated > 0 && unverifed) {
    // TODO: should this be fire and forget or await in transaction?
    try {
      // send email to the old user (should only ever be one)
      if (!unverifed.User?.email) throw new InvalidState(Errors.NoEmail);

      const msg = {
        to: unverifed.User.email,
        from: `Commonwealth <no-reply@${PRODUCTION_DOMAIN}>`,
        templateId: DynamicTemplate.VerifyAddress,
        dynamic_template_data: {
          address: addr.address,
          chain: community.name,
        },
      };
      await sgMail.send(msg);
      log.info(
        `Sent address move email: ${addr.address} transferred to a new account`,
      );
    } catch (e) {
      log.error(
        `Could not send address move email for: ${addr.address}`,
        e as Error,
      );
    }
  }
}

/**
 * Processes an address, verifying the session signature and transferring ownership
 * to the user if necessary.
 * @param community community instance
 * @param address address to verify
 * @param wallet_id wallet id
 * @param session session to verify
 * @param user user to assign ownership to
 * @returns updated address instance
 */
export async function processAddress(
  community: CommunityInstance,
  address: string,
  wallet_id: WalletId,
  session: Session,
  user?: User,
): Promise<AddressInstance> {
  const addr = await models.Address.scope('withPrivateData').findOne({
    where: { community_id: community.id, address },
    include: [
      {
        model: models.Community,
        required: true,
        attributes: ['ss58_prefix'],
      },
    ],
  });
  if (!addr) throw new InvalidInput(Errors.AddressNF);
  if (addr.wallet_id !== wallet_id) throw new InvalidInput(Errors.WrongWallet);
  // check whether the token has expired
  // (certain login methods e.g. jwt have no expiration token, so we skip the check in that case)
  const expiration = addr.verification_token_expires;
  if (expiration && +expiration <= +new Date())
    throw new InvalidInput(Errors.ExpiredToken);

  // Verify the signature matches the session information = verify ownership
  // IMPORTANT: A new user is created if none exists for this address!
  try {
    return await sequelize.transaction(async (transaction) => {
      const updated = await verifySessionSignature(
        session,
        addr,
        transaction,
        user?.id,
      );
      await transferOwnership(updated, community, transaction);
      return updated;
    });
  } catch {
    log.warn(`Failed to verify signature for ${address}`);
    throw new InvalidInput(Errors.InvalidSignature);
  }
}
