import { AppError, logger } from '@hicommonwealth/core';
import { type DB } from '@hicommonwealth/model';
import { DynamicTemplate, PRODUCTION_DOMAIN } from '@hicommonwealth/shared';
import sgMail from '@sendgrid/mail';
import type { NextFunction, Request, Response } from 'express';
import Sequelize from 'sequelize';
import { config } from '../config';

const log = logger(import.meta);

// @ts-expect-error StrictNullChecks
sgMail.setApiKey(config.SENDGRID.API_KEY);

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
  // XXX JAKE 5/17/24: we're currently enforcing a unique cosntraint on emails,
  //   but this MAY no longer be necessary following removal of email-login
  const existingUser = await models.User.findOne({
    where: {
      email,
      // @ts-expect-error StrictNullChecks
      id: { [Sequelize.Op.ne]: req.user.id },
    },
  });
  if (existingUser) return next(new AppError(Errors.EmailInUse));

  const user = await models.User.scope('withPrivateData').findOne({
    where: {
      // @ts-expect-error StrictNullChecks
      id: req.user.id,
    },
  });
  if (!user) return next(new AppError(Errors.NoUser));

  // create and email the token
  // @ts-expect-error StrictNullChecks
  const tokenObj = await models.EmailUpdateToken.createForEmail(email);
  const loginLink = `${config.SERVER_URL}/api/finishUpdateEmail?token=${
    tokenObj.token
  }&email=${encodeURIComponent(email)}`;
  const msg = {
    to: email,
    from: `Commonwealth <no-reply@${PRODUCTION_DOMAIN}>`,
    subject: 'Verify your Commonwealth email',
    templateId: DynamicTemplate.UpdateEmail,
    dynamic_template_data: {
      loginLink,
    },
  };

  try {
    await sgMail.send(msg);
    log.info('Sent update email');
  } catch (e) {
    log.error(`Could not send authentication email: ${loginLink}`);
  }

  user.email = email;
  user.emailVerified = false;
  await user.save();
  res.json({ status: 'Success', result: user.toJSON() });
};

export default updateEmail;
