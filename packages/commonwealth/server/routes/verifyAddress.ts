import { sequelize } from '@hicommonwealth/model';
import { Op, Transaction } from 'sequelize';

import {
  AppError,
  ChainBase,
  DynamicTemplate,
  logger,
} from '@hicommonwealth/core';
import type { AddressInstance, DB } from '@hicommonwealth/model';
import type { NextFunction, Request, Response } from 'express';
import { MixpanelLoginEvent } from '../../shared/analytics/types';
import { addressSwapper } from '../../shared/utils';
import { ServerAnalyticsController } from '../controllers/server_analytics_controller';
import assertAddressOwnership from '../util/assertAddressOwnership';
import verifySessionSignature, {
  attachUserAndProfileToAddressInstance,
} from '../util/verifySessionSignature';

const log = logger().getLogger(__filename);

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

const transferAddress = async ({
  address,
  models,
  addressInstance,
  transaction,
}: {
  address: string;
  models: DB;
  addressInstance: AddressInstance;
  transaction: Transaction;
}) => {
  // update addresses
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
      transaction,
    },
  );
};

const createAddressTransferEmail = async ({ address, chain, user }) => ({
  to: user.email,
  from: 'Commonwealth <no-reply@commonwealth.im>',
  templateId: DynamicTemplate.VerifyAddress,
  dynamic_template_data: {
    address,
    chain: chain.name,
  },
});

const verifyAddress = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (
    !req.body.address ||
    !req.body.session ||
    !req.body.wallet_id ||
    !req.body.chain
  ) {
    throw new AppError(Errors.InvalidArguments);
  }

  const transaction = await sequelize.transaction();

  try {
    const chain = await models.Community.findOne({
      where: { id: req.body.chain },
      transaction,
    });

    const address =
      chain.base === ChainBase.Substrate
        ? addressSwapper({
            address: req.body.address,
            currentPrefix: chain.ss58_prefix,
          })
        : req.body.address;

    const addressInstance = await models.Address.scope(
      'withPrivateData',
    ).findOne({
      where: { community_id: chain.id, address },
      transaction,
    });
    if (!addressInstance) {
      throw new AppError(Errors.AddressNF);
    }

    if (addressInstance.wallet_id !== req.body.wallet_id) {
      throw new AppError(Errors.WrongWallet);
    }

    // check whether the token has expired
    // (certain login methods e.g. jwt have no expiration token, so we skip the check in that case)
    const expiration = addressInstance.verification_token_expires;
    if (expiration && +expiration <= +new Date()) {
      throw new AppError(Errors.ExpiredToken);
    }

    const newSignature = new Uint8Array(65);
    for (let i = 0; i < 65; i++) {
      newSignature[i] = req.body.session.authorizationData.signature[i];
    }
    req.body.session.authorizationData.signature = newSignature;
    console.log(newSignature);

    // req.body.session.authorizationData.signature = new Uint8Array(req.body.session.authorizationData.signature);

    // verify the signature matches the session information = verify ownership
    const valid = await verifySessionSignature(
      req.body.session,
      addressInstance.address,
    );
    if (!valid) {
      throw new AppError(Errors.InvalidSignature);
    }

    addressInstance.last_active = new Date();
    // mark the address as verified
    addressInstance.verification_token_expires = null;
    addressInstance.verified = new Date();

    await attachUserAndProfileToAddressInstance({
      addressInstance,
      models,
      user_id: req.user?.id,
      transaction,
    });
    addressInstance.save({ transaction });

    // if address has already been previously verified, update all other addresses
    // to point to the new user = "transfer ownership".
    const addressToTransfer = await models.Address.findOne({
      where: {
        address,
        user_id: { [Op.ne]: addressInstance.user_id },
        verified: { [Op.ne]: null },
      },
      transaction,
    });

    let emailToSend: any;

    if (addressToTransfer) {
      await transferAddress({ models, address, addressInstance, transaction });

      try {
        // send email to the old user (should only ever be one)
        const oldUser = await models.User.scope('withPrivateData').findOne({
          where: { id: addressToTransfer.user_id, email: { [Op.ne]: null } },
          transaction,
        });
        if (!oldUser?.email) {
          throw new AppError(Errors.NoEmail);
        }

        emailToSend = createAddressTransferEmail({
          address,
          chain,
          user: req.user,
        });
        log.info(
          `Sent address move email: ${address} transferred to a new account`,
        );
      } catch (e) {
        log.error(`Could not send address move email for: ${address}`);
      }
    }

    // assertion check
    await assertAddressOwnership(models, address, transaction);

    // Apply side effects
    await transaction.commit();

    if (emailToSend) {
      await sgMail.send();
    }

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
  } catch (e) {
    await transaction.rollback();
    console.log(e);

    return res.status(e.status || 500).json({ status: 'Error', result: e });
  }
};

export default verifyAddress;
