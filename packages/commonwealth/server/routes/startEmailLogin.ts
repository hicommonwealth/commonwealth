import { AppError, DynamicTemplate, WalletId } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import type { DB } from '@hicommonwealth/model';
import sgMail from '@sendgrid/mail';
import type { NextFunction, Request, Response } from 'express';
import moment from 'moment';
import {
  LOGIN_RATE_LIMIT_MINS,
  LOGIN_RATE_LIMIT_TRIES,
  MAGIC_DEFAULT_CHAIN,
  MAGIC_SUPPORTED_BASES,
  SENDGRID_API_KEY,
} from '../config';
import { validateCommunity } from '../middleware/validateCommunity';

sgMail.setApiKey(SENDGRID_API_KEY);

const log = logger(__filename);

export const Errors = {
  AlreadyLoggedIn: 'Already signed in',
  NoEmail: 'Missing email',
  InvalidEmail: 'Invalid email',
  ChainOrCommunityRequired:
    'Must be within existing chain or community to register',
};

const startEmailLogin = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const hostname = req.headers['x-forwarded-host'] || req.hostname;

  if (req.user && req.user.email) {
    return next(new AppError(Errors.AlreadyLoggedIn));
  }

  // validate the email
  const email = req.body.email;
  const validEmailRegex = /\S+@\S+\.\S+/;
  if (!email) {
    return next(new AppError(Errors.NoEmail));
  } else if (!validEmailRegex.test(email)) {
    return next(new AppError(Errors.InvalidEmail));
  }

  const previousUser = await models.User.scope('withPrivateData').findOne({
    where: {
      email,
    },
    include: [
      {
        model: models.Address,
        where: { wallet_id: WalletId.Magic },
        required: false,
      },
    ],
  });

  // check whether to recommend magic.link registration instead
  // 1. user should not already exist
  // 2. chain or community default chain should be "supported"
  //
  // ignore error because someone might try to log in from the homepage, or another page without
  // chain or community
  const context = req.body.chain ? req.body : { chain: MAGIC_DEFAULT_CHAIN };
  const [chain] = await validateCommunity(models, context);
  const magicChain = chain;

  const isNewRegistration = !previousUser;
  const isExistingMagicUser =
    previousUser && previousUser.Addresses?.length > 0;
  if (
    isExistingMagicUser || // existing magic users should always use magic login, even if they're in the wrong community
    (isNewRegistration &&
      magicChain?.base &&
      MAGIC_SUPPORTED_BASES.includes(magicChain.base) &&
      !req.body.forceEmailLogin)
  ) {
    return res.json({
      status: 'Success',
      result: {
        shouldUseMagic: true,
        shouldUseMagicImmediately: !!isExistingMagicUser,
      },
    });
  }

  // ensure no more than 3 tokens have been created in the last 5 minutes
  const recentTokens = await models.LoginToken.findAndCountAll({
    where: {
      email,
      created_at: {
        $gte: moment().subtract(LOGIN_RATE_LIMIT_MINS, 'minutes').toDate(),
      },
    },
  });
  if (recentTokens.count >= LOGIN_RATE_LIMIT_TRIES) {
    return res.json({
      status: 'Error',
      message:
        "You've tried to sign in several times already. " +
        `Check your spam folder, or wait ${LOGIN_RATE_LIMIT_MINS} minutes to try again.`,
    });
  }

  // create and email the token
  const path = req.body.path;
  const tokenObj = await models.LoginToken.createForEmail(email, path);

  const loginLink = `${protocol}://${hostname}/api/finishLogin?token=${
    tokenObj.token
  }&email=${encodeURIComponent(email)}`;
  const msg = {
    to: email,
    from: 'Common <no-reply@commonwealth.im>',
    templateId: previousUser ? DynamicTemplate.SignIn : DynamicTemplate.SignUp,
    dynamic_template_data: {
      loginLink,
    },
  };

  sgMail
    .send(msg)
    .then(() => {
      res.json({ status: 'Success' });
    })
    .catch((e) => {
      log.error(`Could not send authentication email: ${loginLink}`);
      res
        .status(500)
        .json({ error: 'Could not send login email', message: e.message });
    });
};

export default startEmailLogin;
