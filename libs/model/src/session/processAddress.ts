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
import { Op } from 'sequelize';
import { models } from '../database';
import { CommunityInstance } from '../models';
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

export async function processAddress(
  community: CommunityInstance,
  address: string,
  wallet_id: WalletId,
  session: Session,
  user?: User,
) {
  const addressInstance = await models.Address.scope('withPrivateData').findOne(
    {
      where: { community_id: community.id, address },
      include: {
        model: models.Community,
        attributes: ['ss58_prefix'],
      },
    },
  );
  if (!addressInstance) throw new InvalidInput(Errors.AddressNF);
  if (addressInstance.wallet_id !== wallet_id)
    throw new InvalidInput(Errors.WrongWallet);
  // check whether the token has expired
  // (certain login methods e.g. jwt have no expiration token, so we skip the check in that case)
  const expiration = addressInstance.verification_token_expires;
  if (expiration && +expiration <= +new Date())
    throw new InvalidInput(Errors.ExpiredToken);

  // verify the signature matches the session information = verify ownership
  try {
    await verifySessionSignature(
      addressInstance,
      user ? user.id : null,
      session,
    );
  } catch {
    log.warn(`Failed to verify signature for ${address}`);
    throw new InvalidInput(Errors.InvalidSignature);
  }

  addressInstance.last_active = new Date();

  if (!user?.id) {
    // user is not logged in
    addressInstance.verification_token_expires = null;
    addressInstance.verified = new Date();
    if (!addressInstance.user_id) {
      // address is not yet verified => create a new user
      const newUser = await models.User.create({
        email: null,
        profile: {},
      });
      addressInstance.user_id = newUser.id;
    }
  } else {
    // user is already logged in => verify the newly created address
    addressInstance.verification_token_expires = null;
    addressInstance.verified = new Date();
    addressInstance.user_id = user.id;
  }
  await addressInstance.save();

  // if address has already been previously verified, update all other addresses
  // to point to the new user = "transfer ownership".
  const addressToTransfer = await models.Address.findOne({
    where: {
      address,
      user_id: { [Op.ne]: addressInstance.user_id },
      verified: { [Op.ne]: null },
    },
  });

  if (addressToTransfer) {
    // reassign the users of the transferred addresses
    await models.Address.update(
      { user_id: addressInstance.user_id },
      {
        where: {
          address,
          user_id: { [Op.ne]: addressInstance.user_id },
          verified: { [Op.ne]: null },
        },
      },
    );

    try {
      // send email to the old user (should only ever be one)
      const oldUser = await models.User.scope('withPrivateData').findOne({
        where: { id: addressToTransfer.user_id!, email: { [Op.ne]: null } },
      });
      if (!oldUser?.email) throw new InvalidState(Errors.NoEmail);

      const msg = {
        to: oldUser.email,
        from: `Commonwealth <no-reply@${PRODUCTION_DOMAIN}>`,
        templateId: DynamicTemplate.VerifyAddress,
        dynamic_template_data: {
          address,
          chain: community.name,
        },
      };
      await sgMail.send(msg);
      log.info(
        `Sent address move email: ${address} transferred to a new account`,
      );
    } catch (e) {
      log.error(
        `Could not send address move email for: ${address}`,
        e as Error,
      );
    }
  }
}
