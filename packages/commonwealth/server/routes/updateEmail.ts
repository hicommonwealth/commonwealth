import { AppError } from '@hicommonwealth/adapters';
import { WalletId, logger } from '@hicommonwealth/core';
import sgMail from '@sendgrid/mail';
import type { NextFunction, Request, Response } from 'express';
import moment from 'moment';
import Sequelize from 'sequelize';
import { DynamicTemplate } from '../../shared/types';
import { LOGIN_RATE_LIMIT_MINS, SENDGRID_API_KEY, SERVER_URL } from '../config';
import type { DB } from '../models';

const log = logger().getLogger(__filename);

sgMail.setApiKey(SENDGRID_API_KEY);

export const Errors = {
  NotLoggedIn: 'Not signed in',
  NoEmail: 'Must provide email',
  NoUser: 'Could not find a user with this email',
  InvalidEmail: 'Invalid email',
  EmailInUse: 'Email already in use',
  NoUpdateForMagic: 'Cannot update email if registered with Magic Link',
};

const updateEmail = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.body.email) return next(new AppError(Errors.NoEmail));
  const { email } = req.body;

  // validate the email
  const validEmailRegex = /\S+@\S+\.\S+/;
  if (!validEmailRegex.test(email)) {
    return next(new AppError(Errors.InvalidEmail));
  }

  // check if email is already in use
  const existingUser = await models.User.findOne({
    where: {
      email,
      id: { [Sequelize.Op.ne]: req.user.id },
    },
  });
  if (existingUser) return next(new AppError(Errors.EmailInUse));

  const user = await models.User.scope('withPrivateData').findOne({
    where: {
      id: req.user.id,
    },
    include: [
      {
        model: models.Address,
        where: { wallet_id: WalletId.Magic },
        required: false,
      },
    ],
  });
  if (!user) return next(new AppError(Errors.NoUser));
  if (user.Addresses?.length > 0)
    return next(new AppError(Errors.NoUpdateForMagic));
  // ensure no more than 3 tokens have been created in the last 5 minutes
  const recentTokens = await models.LoginToken.findAndCountAll({
    where: {
      email,
      created_at: {
        $gte: moment().subtract(LOGIN_RATE_LIMIT_MINS, 'minutes').toDate(),
      },
    },
  });
  if (recentTokens.count >= LOGIN_RATE_LIMIT_MINS) {
    return res.json({
      status: 'Error',
      message: `You've tried to update your email several times! Try again in ${LOGIN_RATE_LIMIT_MINS} minutes`,
    });
  }

  // create and email the token
  const tokenObj = await models.LoginToken.createForEmail(email);
  const loginLink = `${SERVER_URL}/api/finishLogin?token=${
    tokenObj.token
  }&email=${encodeURIComponent(email)}&confirmation=success`;
  const msg = {
    to: email,
    from: 'Commonwealth <no-reply@commonwealth.im>',
    subject: 'Verify your Commonwealth email',
    templateId: DynamicTemplate.UpdateEmail,
    dynamic_template_data: {
      loginLink,
    },
  };

  try {
    await sgMail.send(msg);
  } catch (e) {
    log.error(`Could not send authentication email: ${loginLink}`);
  }

  user.email = email;
  user.emailVerified = false;
  await user.save();
  res.json({ status: 'Success', result: user.toJSON() });
};

export default updateEmail;
