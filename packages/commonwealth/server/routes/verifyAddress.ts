import { Op } from 'sequelize';

import { formatFilename, loggerFactory } from '@hicommonwealth/adapters';
import {
  ChainBase,
  NotificationCategories,
  WalletId,
  WalletSsoSource,
} from '@hicommonwealth/core';
import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';

import { MixpanelLoginEvent } from '../../shared/analytics/types';
import { DynamicTemplate } from '../../shared/types';
import { addressSwapper } from '../../shared/utils';
import type { DB } from '../models';
import type { CommunityInstance } from '../models/community';
import type { ProfileAttributes } from '../models/profile';
import assertAddressOwnership from '../util/assertAddressOwnership';
import verifySessionSignature from '../util/verifySessionSignature';

import { ServerAnalyticsController } from '../controllers/server_analytics_controller';

const log = loggerFactory.getLogger(formatFilename(__filename));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sgMail = require('@sendgrid/mail');
export const Errors = {
  NoChain: 'Must provide chain',
  InvalidChain: 'Invalid chain',
  AddressNF: 'Address not found',
  ExpiredToken: 'Token has expired, please re-register',
  InvalidSignature: 'Invalid signature, please re-register',
  NoEmail: 'No email to alert',
  InvalidArguments: 'Invalid arguments',
  CouldNotVerifySignature: 'Failed to verify signature',
  BadSecret: 'Invalid jwt secret',
  BadToken: 'Invalid sign in token',
  WrongWallet: 'Verified with different wallet than created',
};

const processAddress = async (
  models: DB,
  chain: CommunityInstance,
  chain_id: string | number,
  address: string,
  wallet_id: WalletId,
  wallet_sso_source: WalletSsoSource,
  signature: string,
  user: Express.User,
  sessionAddress: string | null,
  sessionIssued: string | null,
  sessionBlockInfo: string | null,
): Promise<void> => {
  const addressInstance = await models.Address.scope('withPrivateData').findOne(
    {
      where: { community_id: chain.id, address },
    },
  );
  if (!addressInstance) {
    throw new AppError(Errors.AddressNF);
  }

  if (addressInstance.wallet_id !== wallet_id) {
    throw new AppError(Errors.WrongWallet);
  }

  // check whether the token has expired
  // (certain login methods e.g. jwt have no expiration token, so we skip the check in that case)
  const expiration = addressInstance.verification_token_expires;
  if (expiration && +expiration <= +new Date()) {
    throw new AppError(Errors.ExpiredToken);
  }

  // verify the signature matches the session information = verify ownership
  try {
    const valid = await verifySessionSignature(
      models,
      chain,
      chain_id,
      addressInstance,
      user ? user.id : null,
      signature,
      sessionAddress,
      sessionIssued,
      sessionBlockInfo,
    );
    if (!valid) {
      throw new AppError(Errors.InvalidSignature);
    }
  } catch (e) {
    log.warn(`Failed to verify signature for ${address}: ${e.stack}`);
    throw new AppError(Errors.CouldNotVerifySignature);
  }

  addressInstance.last_active = new Date();

  if (!user?.id) {
    // user is not logged in
    addressInstance.verification_token_expires = null;
    addressInstance.verified = new Date();
    if (!addressInstance.user_id) {
      // address is not yet verified => create a new user
      const newUser = await models.User.createWithProfile(models, {
        email: null,
      });
      addressInstance.profile_id = (
        newUser.Profiles[0] as ProfileAttributes
      ).id;
      await models.Subscription.create({
        subscriber_id: newUser.id,
        category_id: NotificationCategories.NewMention,
        is_active: true,
      });
      await models.Subscription.create({
        subscriber_id: newUser.id,
        category_id: NotificationCategories.NewCollaboration,
        is_active: true,
      });
      addressInstance.user_id = newUser.id;
    }
  } else {
    // user is already logged in => verify the newly created address
    addressInstance.verification_token_expires = null;
    addressInstance.verified = new Date();
    addressInstance.user_id = user.id;
    const profile = await models.Profile.findOne({
      where: { user_id: user.id },
    });
    addressInstance.profile_id = profile.id;
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
    // reassign the users and profiles of the transferred addresses
    await models.Address.update(
      {
        user_id: addressInstance.user_id,
        profile_id: addressInstance.profile_id,
      },
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
        where: { id: addressToTransfer.user_id, email: { [Op.ne]: null } },
      });
      if (!oldUser?.email) {
        throw new AppError(Errors.NoEmail);
      }
      const msg = {
        to: user.email,
        from: 'Commonwealth <no-reply@commonwealth.im>',
        templateId: DynamicTemplate.VerifyAddress,
        dynamic_template_data: {
          address,
          chain: chain.name,
        },
      };
      await sgMail.send(msg);
      log.info(
        `Sent address move email: ${address} transferred to a new account`,
      );
    } catch (e) {
      log.error(`Could not send address move email for: ${address}`);
    }
  }
};

const verifyAddress = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.body.chain || !req.body.chain_id) {
    throw new AppError(Errors.NoChain);
  }
  const chain = await models.Community.findOne({
    where: { id: req.body.chain },
  });
  const chain_id = req.body.chain_id;
  if (!chain) {
    return next(new AppError(Errors.InvalidChain));
  }

  if (!req.body.address || !req.body.signature) {
    throw new AppError(Errors.InvalidArguments);
  }

  const address =
    chain.base === ChainBase.Substrate
      ? addressSwapper({
          address: req.body.address,
          currentPrefix: chain.ss58_prefix,
        })
      : req.body.address;

  await processAddress(
    models,
    chain,
    chain_id,
    address,
    req.body.wallet_id,
    req.body.wallet_sso_source,
    req.body.signature,
    req.user,
    req.body.session_public_address,
    req.body.session_timestamp || null, // disallow empty strings
    req.body.session_block_data || null, // disallow empty strings
  );

  // assertion check
  await assertAddressOwnership(models, address);

  if (req.user) {
    // if user was already logged in, we're done
    return res.json({
      status: 'Success',
      result: { address, message: 'Verified signature' },
    });
  } else {
    // if user isn't logged in, log them in now
    const newAddress = await models.Address.findOne({
      where: { community_id: req.body.chain, address },
    });
    const user = await models.User.scope('withPrivateData').findOne({
      where: { id: newAddress.user_id },
    });
    req.login(user, (err) => {
      const serverAnalyticsController = new ServerAnalyticsController();
      if (err) {
        serverAnalyticsController.track(
          {
            event: MixpanelLoginEvent.LOGIN_FAILED,
          },
          req,
        );
        return next(err);
      }
      serverAnalyticsController.track(
        {
          event: MixpanelLoginEvent.LOGIN_COMPLETED,
          userId: user.id,
        },
        req,
      );

      return res.json({
        status: 'Success',
        result: {
          user,
          address,
          message: 'Signed in',
        },
      });
    });
  }
};

export default verifyAddress;
