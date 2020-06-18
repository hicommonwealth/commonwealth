import { Request, Response, NextFunction } from 'express';
import moment from 'moment';
import { LOGIN_RATE_LIMIT_MINS, SERVER_URL, SENDGRID_API_KEY } from '../config';
import { factory, formatFilename } from '../../shared/logging';
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(SENDGRID_API_KEY);

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoEmail: 'Must provide email to update.',
  NoUser: 'Could not find user',
  InvalidEmail: 'Invalid Email',
};

const updateEmail = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.body.email) return next(new Error(Errors.NoEmail));
  const { email } = req.body;

  // validate the email
  const validEmailRegex = /\S+@\S+\.\S+/;
  if (!validEmailRegex.test(email)) {
    return next(new Error(Errors.InvalidEmail));
  }

  const user = await models.User.findOne({
    where: {
      id: req.user.id,
    }
  });
  if (!user) return next(new Error(Errors.NoUser));

  // ensure no more than 3 tokens have been created in the last 5 minutes
  const recentTokens = await models.LoginToken.findAndCountAll({
    where: {
      email,
      created_at: {
        $gte: moment().subtract(LOGIN_RATE_LIMIT_MINS, 'minutes').toDate()
      }
    }
  });
  if (recentTokens.count >= LOGIN_RATE_LIMIT_MINS) {
    return res.json({
      status: 'Error',
      message: `You've tried to update your email several times! Try again in ${LOGIN_RATE_LIMIT_MINS} minutes`,
    });
  }

  // create and email the token
  const path = '/';
  const tokenObj = await models.LoginToken.createForEmail(email, path);
  const loginLink = `${SERVER_URL}/api/finishLogin?token=${tokenObj.token}&email=${encodeURIComponent(email)}`;
  const msg = {
    to: email,
    from: 'Commonwealth <no-reply@commonwealth.im>',
    subject: 'Verify your Commonwealth email',
    templateId: 'd-a0c28546fecc49fb80a3ba9e535bff48',
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
