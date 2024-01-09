import {
  AppError,
  ServerError,
  formatFilename,
  loggerFactory,
} from '@hicommonwealth/adapters';
import { NotificationCategories, WalletId } from '@hicommonwealth/core';
import * as jwt from 'jsonwebtoken';
import { isAddress, toChecksumAddress } from 'web3-utils';
import { MixpanelLoginEvent } from '../../shared/analytics/types';
import { DynamicTemplate } from '../../shared/types';
import { AXIE_SHARED_SECRET } from '../config';
import { sequelize } from '../database';
import type { DB } from '../models';
import type { AddressAttributes } from '../models/address';
import type { ProfileAttributes } from '../models/profile';
import type { UserAttributes } from '../models/user';

import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import { createRole } from '../util/roles';

import { ServerAnalyticsController } from '../controllers/server_analytics_controller';
import { redirectWithLoginError } from './finishEmailLogin';

const log = loggerFactory.getLogger(formatFilename(__filename));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sgMail = require('@sendgrid/mail');

export enum Issuers {
  AxieInfinity = 'AxieInfinity',
}

type AxieInfinityJwt = {
  iat: number; // issued at time
  iss: string; // should be "AxieInfinity"
  jti: string; // random UUID
  roninAddress: string; // eth address
};

function isAxieInfinityJwt(token: any): token is AxieInfinityJwt {
  return (
    typeof token.iat === 'number' &&
    typeof token.iss === 'string' &&
    typeof token.jti === 'string' &&
    typeof token.roninAddress === 'string'
  );
}

const AXIE_INFINITY_CHAIN_ID = 'axie-infinity';
const EXPIRATION_TIME = 60 * 5; // 5 minutes

const Errors = {
  InvalidTokenState: 'Invalid token state',
  InvalidIssuer: 'Invalid issuer',
  NoSharedSecret: 'Missing shared secret',
  MissingToken: 'Must provide token',
  InvalidToken: 'Invalid token',
  InvalidUser: 'Invalid user',
  TokenBadIssuer: 'Invalid token issuer',
  TokenExpired: 'Token expired',
  TokenBadAddress: 'Invalid token address',
  AlreadyLoggedIn: 'User is already signed in',
  ReplayAttack: 'Invalid token. Try again',
  AccountCreationFailed: 'Failed to create account',
};

type FinishSsoLoginReq = { token: string; issuer: Issuers; stateId: string };
type FinishSsoLoginRes = { user?: UserAttributes; address?: AddressAttributes };

const finishSsoLogin = async (
  models: DB,
  req: TypedRequestBody<FinishSsoLoginReq>,
  res: TypedResponse<FinishSsoLoginRes>,
) => {
  const serverAnalyticsController = new ServerAnalyticsController();

  // verify issuer (TODO: support other SSO endpoints)
  if (req.body.issuer !== Issuers.AxieInfinity) {
    throw new AppError(Errors.InvalidIssuer);
  } else if (!AXIE_SHARED_SECRET) {
    throw new ServerError(Errors.NoSharedSecret);
  }

  // verify request stateId (i.e. that /auth/sso was called)
  const emptyTokenInstance = await models.SsoToken.findOne({
    where: { state_id: req.body.stateId },
  });
  if (!emptyTokenInstance) {
    throw new AppError(Errors.InvalidTokenState);
  }

  // decode token payload
  const tokenString = req.body.token;
  if (!tokenString) {
    throw new AppError(Errors.MissingToken);
  }

  let jwtPayload: AxieInfinityJwt;
  try {
    const decoded = jwt.verify(tokenString, AXIE_SHARED_SECRET, {
      issuer: 'AxieInfinity',
    });
    if (isAxieInfinityJwt(decoded)) {
      jwtPayload = decoded;
    } else {
      throw new AppError('Could not decode token');
    }
  } catch (e) {
    log.info(`Axie token decoding error: ${e.message}`);
    throw new AppError(Errors.InvalidToken);
  }

  // verify issuer
  if (jwtPayload.iss !== Issuers.AxieInfinity) {
    throw new AppError(Errors.TokenBadIssuer);
  }

  // verify expiration
  if (jwtPayload.iat + EXPIRATION_TIME < Math.floor(Date.now() / 1000)) {
    throw new AppError(Errors.TokenExpired);
  }

  // verify address is an address
  if (!isAddress(jwtPayload.roninAddress)) {
    throw new AppError(Errors.TokenBadAddress);
  }

  // convert address to checksum version before storing in db
  let checksumAddress: string;
  try {
    // NOTE: chainId is technically unused here, no need to provide it
    checksumAddress = toChecksumAddress(jwtPayload.roninAddress);
  } catch (e) {
    throw new AppError(Errors.TokenBadAddress);
  }

  // check if this is a new signup or a login
  const reqUser = req.user;
  const existingAddress = await models.Address.scope('withPrivateData').findOne(
    {
      where: {
        address: checksumAddress,
        community_id: 'axie-infinity',
      },
      include: [
        {
          model: models.SsoToken,
          where: { issuer: jwtPayload.iss },
          required: false,
        },
      ],
    },
  );
  if (existingAddress) {
    // TODO: transactionalize
    // if the address was removed by /deleteAddress, we need to re-verify it
    if (!existingAddress.verified) {
      existingAddress.verified = new Date();
      await existingAddress.save();
    }

    if (reqUser?.id && reqUser.id === existingAddress.user_id) {
      const newUser = await models.User.findOne({
        where: {
          id: reqUser.id,
        },
        include: [models.Address],
      });
      return success(res, { user: newUser });
    }

    // check login token, if the user has already logged in before with SSO
    const token = await existingAddress.getSsoToken();

    if (token) {
      // perform login on existing account
      if (jwtPayload.iat <= token.issued_at) {
        log.error('Replay attack detected.');
        throw new AppError(Errors.ReplayAttack);
      }
      token.issued_at = jwtPayload.iat;
      token.state_id = emptyTokenInstance.state_id;
      await token.save();

      // delete the empty token that was initialized on /auth/sso, because it is superceded
      // by the existing token for this user
      await emptyTokenInstance.destroy();
    } else {
      // XXX: some tokens got dis-associated from accounts due to checksum migration.
      //   To fix this, we attach new (current) tokens to them here.
      //   The only possible vulnerability here would be a delayed replay attack using a token
      //   issued before the migration, which will not work because those tokens would be
      //   marked expired.
      emptyTokenInstance.issuer = jwtPayload.iss;
      emptyTokenInstance.issued_at = jwtPayload.iat;
      emptyTokenInstance.address_id = existingAddress.id;
      await emptyTokenInstance.save();
    }

    if (reqUser) {
      // perform address transfer
      // TODO: factor this email code into a util
      try {
        const oldUser = await models.User.scope('withPrivateData').findOne({
          where: { id: existingAddress.user_id },
        });
        if (!oldUser) {
          throw new AppError('User should exist');
        }
        const msg = {
          to: oldUser.email,
          from: 'Commonwealth <no-reply@commonwealth.im>',
          templateId: DynamicTemplate.VerifyAddress,
          dynamic_template_data: {
            address: existingAddress,
            chain: AXIE_INFINITY_CHAIN_ID,
          },
        };
        await sgMail.send(msg);
        log.info(
          `Sent address move email: ${existingAddress} transferred to a new account`,
        );
      } catch (e) {
        log.error(`Could not send address move email for: ${existingAddress}`);
      }

      const newProfile = await models.Profile.findOne({
        where: { user_id: reqUser.id },
      });
      existingAddress.user_id = reqUser.id;
      existingAddress.profile_id = newProfile.id;
      await existingAddress.save();

      const newAddress = await models.Address.findOne({
        where: { id: existingAddress.id },
      });
      return success(res, { address: newAddress });
    } else {
      if (existingAddress.user_id) {
        // user exists but is not logged in, so we log them in
        const existingUser = await models.User.findOne({
          where: {
            id: existingAddress.user_id,
          },
          include: [models.Address],
        });

        if (!existingUser) {
          // if the address has a user id but we don't have a user object,
          // the db has gotten into a bad state -- throw a server error
          throw new ServerError(Errors.InvalidUser);
        }

        req.login(existingUser, (err) => {
          if (err)
            return redirectWithLoginError(
              res,
              `Could not sign in with ronin wallet`,
            );
          serverAnalyticsController.track(
            {
              event: MixpanelLoginEvent.LOGIN_COMPLETED,
              userId: existingUser.id,
            },
            req,
          );
        });
        return success(res, { user: existingUser });
      } else {
        // create new user if no user exists but address exists
        const newUser = await models.User.createWithProfile(models, {
          email: null,
        });
        existingAddress.user_id = newUser.id;
        await existingAddress.save();
        req.login(newUser, (err) => {
          if (err) {
            serverAnalyticsController.track(
              {
                event: MixpanelLoginEvent.LOGIN_FAILED,
              },
              req,
            );
            return redirectWithLoginError(
              res,
              `Could not sign in with ronin wallet`,
            );
          }

          serverAnalyticsController.track(
            {
              event: MixpanelLoginEvent.LOGIN_COMPLETED,
              userId: newUser.id,
            },
            req,
          );
        });
        return success(res, { user: newUser });
      }
    }
  }

  // create new address and user if needed + populate sso token
  try {
    const result = await sequelize.transaction(async (t) => {
      let user: Express.User;
      // TODO: this profile fetching will eventually need to assume more than one profile
      let profile: ProfileAttributes;
      if (!reqUser) {
        // create new user
        user = await models.User.createWithProfile(
          models,
          { email: null },
          { transaction: t },
        );
        profile = user.Profiles[0];
      } else {
        user = reqUser;
        profile = await models.Profile.findOne({
          where: { user_id: user.id },
          transaction: t,
        });
      }

      // create new address
      const newAddress = await models.Address.create(
        {
          address: checksumAddress,
          community_id: AXIE_INFINITY_CHAIN_ID,
          verification_token: 'SSO',
          verification_token_expires: null,
          verified: new Date(), // trust addresses from magic
          last_active: new Date(),
          user_id: user.id,
          profile_id: profile.id,
          wallet_id: WalletId.Ronin,
          // wallet_sso_source: null,
        },
        { transaction: t },
      );

      await createRole(
        models,
        newAddress.id,
        AXIE_INFINITY_CHAIN_ID,
        'member',
        false,
        t,
      );

      // Automatically create subscription to their own mentions
      await models.Subscription.create(
        {
          subscriber_id: user.id,
          category_id: NotificationCategories.NewMention,
          is_active: true,
        },
        { transaction: t },
      );

      // Automatically create a subscription to collaborations
      await models.Subscription.create(
        {
          subscriber_id: user.id,
          category_id: NotificationCategories.NewCollaboration,
          is_active: true,
        },
        { transaction: t },
      );

      // populate token
      emptyTokenInstance.issuer = jwtPayload.iss;
      emptyTokenInstance.issued_at = jwtPayload.iat;
      emptyTokenInstance.address_id = newAddress.id;
      await emptyTokenInstance.save({ transaction: t });

      return user;
    });

    if (reqUser) {
      // re-fetch address if existing user
      const newAddress = await models.Address.findOne({
        where: { address: checksumAddress },
      });
      serverAnalyticsController.track(
        {
          event: MixpanelLoginEvent.LOGIN_COMPLETED,
          userId: reqUser.id,
        },
        req,
      );
      return success(res, { address: newAddress });
    } else {
      // re-fetch user to include address object, if freshly created
      const newUser = await models.User.findOne({
        where: {
          id: result.id,
        },
        include: [models.Address],
      });
      // TODO: should we req.login here? or not?
      req.login(newUser, (err) => {
        if (err)
          return redirectWithLoginError(
            res,
            `Could not sign in with ronin wallet`,
          );
        serverAnalyticsController.track(
          {
            event: MixpanelLoginEvent.LOGIN_COMPLETED,
            userId: newUser.id,
          },
          req,
        );
      });
      return success(res, { user: newUser });
    }
  } catch (e) {
    log.error(e.message);
    throw new ServerError(Errors.AccountCreationFailed);
  }
};

export default finishSsoLogin;
